from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import random
from typing import Dict, Any

from app.core.database import get_db
from app.models.patient import Patient, PatientVitals, PatientStatus, PriorityLevel
from app.models.bed import Bed, BedStatus
from app.models.department import Department
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.recommendation import BedAssignment, TriageAssessment
from app.models.user import User
from app.schemas.simulation import SurgeSimulationRequest, SurgeSimulationResponse
from app.services.audit_service import log_action
from app.services.alert_service import check_and_update_alerts
from app.api.deps import get_current_user, require_role
from app.websocket.manager import manager
import asyncio
import json

router = APIRouter(prefix="/simulation", tags=["Surge Simulation"])

SCENARIOS_META = {
    "highway_collision": {
        "title": "Mass Casualty: Multi-Vehicle Interstate Collision",
        "description": "High-impact 6-vehicle collision involving bus on highway. Multiple polytrauma, intracranial hemorrhages, and thoracic crushes.",
        "default_count": 14,
        "dept_focus": "Emergency"
    },
    "chemical_hazard": {
        "title": "Industrial Toxic Chemical Spill & Vapor Inhalation",
        "description": "Industrial ammonia and chlorine release at local plant. High volume of acute toxic inhalation, chemical pneumonitis, and bronchospasm.",
        "default_count": 18,
        "dept_focus": "ICU"
    },
    "epidemic_spike": {
        "title": "Rapid Community Outbreak: Novel Respiratory Virus",
        "description": "Sharp sudden spike in severe febrile hypoxemic patients requiring immediate droplet isolation and continuous high-flow oxygen.",
        "default_count": 20,
        "dept_focus": "Isolation"
    }
}

@router.post("/surge", response_model=SurgeSimulationResponse)
def trigger_surge_simulation(
    payload: SurgeSimulationRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    scenario_info = SCENARIOS_META.get(payload.scenario, SCENARIOS_META["highway_collision"])
    count = max(5, min(30, payload.patient_count))

    # Clean any prior active simulation first to make it cleanly repeatable
    existing_sim_patients = db.query(Patient).filter(Patient.is_simulation == True).all()
    for sp in existing_sim_patients:
        if sp.assigned_bed_id:
            b = db.query(Bed).filter(Bed.id == sp.assigned_bed_id).first()
            if b:
                b.status = BedStatus.AVAILABLE.value
                b.current_patient_id = None
        db.delete(sp)
    db.commit()

    crit_count = int(count * payload.critical_ratio)
    high_count = int(count * 0.3)
    med_count = count - crit_count - high_count

    # Generate synthetic surge patients
    first_names = ["Jackson", "Liam", "Sophia", "Noah", "Emma", "Oliver", "Ava", "Elijah", "Isabella", "William", "Mia", "James", "Amelia", "Benjamin", "Harper"]
    last_names = ["Brooks", "Ward", "Foster", "Bennett", "Simmons", "Hughes", "Perez", "Griffin", "Russell", "Diaz", "Hayes", "Myers", "Ford", "Hamilton", "Graham"]

    created_patients = []
    for i in range(count):
        pid = f"SIM-{101 + i}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        
        if i < crit_count:
            priority = PriorityLevel.CRITICAL.value
            spo2 = random.randint(81, 88)
            hr = random.randint(125, 148)
            bp_sys = random.randint(70, 88)
            bp_dia = random.randint(40, 55)
            temp = round(random.uniform(37.5, 39.5), 1)
            ox = "Invasive" if i % 2 == 0 else "High Flow"
            dept = "ICU" if payload.scenario == "chemical_hazard" else "Emergency"
            symptoms = "Multiple traumatic lacerations, thoracic injury, acute hypoxemia, altered consciousness"
            equipment = "Ventilator, Cardiac Monitor" if ox == "Invasive" else "Cardiac Monitor"
            mobility = "Stretcher"
            isolation = "Droplet" if payload.scenario == "epidemic_spike" else "None"
        elif i < (crit_count + high_count):
            priority = PriorityLevel.HIGH.value
            spo2 = random.randint(89, 93)
            hr = random.randint(105, 124)
            bp_sys = random.randint(145, 175)
            bp_dia = random.randint(90, 105)
            temp = round(random.uniform(37.2, 38.6), 1)
            ox = "High Flow"
            dept = "Emergency" if payload.scenario != "epidemic_spike" else "Isolation"
            symptoms = "Severe contusions, deep lacerations, dyspnea, suspected pelvic fracture"
            equipment = "Cardiac Monitor"
            mobility = "Stretcher"
            isolation = "Droplet" if payload.scenario == "epidemic_spike" else "None"
        else:
            priority = PriorityLevel.MEDIUM.value
            spo2 = random.randint(94, 97)
            hr = random.randint(90, 105)
            bp_sys = random.randint(125, 140)
            bp_dia = random.randint(80, 90)
            temp = round(random.uniform(36.8, 37.5), 1)
            ox = "Low Flow"
            dept = "General Ward"
            symptoms = "Extremity fractures, multiple abrasions, mild concussion, stable vitals"
            equipment = "Infusion Pump"
            mobility = "Wheelchair"
            isolation = "None"

        patient = Patient(
            id=pid,
            name=name,
            age=random.randint(19, 76),
            gender=random.choice(["Male", "Female"]),
            contact=f"+1 (555) 700-{1000+i}",
            emergency_contact="Emergency Field Responder Registry",
            arrival_time=now - timedelta(minutes=random.randint(2, 25)),
            symptoms=symptoms,
            oxygen_requirement=ox,
            heart_rate=hr,
            spo2=spo2,
            blood_pressure_sys=bp_sys,
            blood_pressure_dia=bp_dia,
            temperature=temp,
            mobility_requirement=mobility,
            isolation_requirement=isolation,
            required_equipment=equipment,
            department_requirement=dept,
            priority=priority,
            current_status=PatientStatus.AWAITING_BED.value,
            is_simulation=True
        )
        db.add(patient)
        created_patients.append(patient)

    db.commit()

    # Automatically allocate half into matching available beds to simulate acute intake load
    occupied_count = 0
    available_beds = db.query(Bed).filter(Bed.status == BedStatus.AVAILABLE.value).all()
    for p in created_patients[:int(count * 0.45)]:
        # Pick best available bed for this patient
        candidate = None
        for b in available_beds:
            if b.status == BedStatus.AVAILABLE.value:
                if p.department_requirement == "ICU" and b.bed_type == "ICU":
                    candidate = b
                    break
                elif p.department_requirement == "Emergency" and b.bed_type == "ER":
                    candidate = b
                    break
                elif candidate is None:
                    candidate = b
        
        if candidate:
            candidate.status = BedStatus.OCCUPIED.value
            candidate.current_patient_id = p.id
            p.assigned_bed_id = candidate.id
            p.current_status = PatientStatus.ADMITTED.value
            p.admitted_at = now
            occupied_count += 1
            available_beds.remove(candidate)

    # Trigger Simulation Surge Alerts
    surge_alert = Alert(
        type="SURGE_DEMAND",
        severity=AlertSeverity.CRITICAL.value,
        title=f"SURGE ALERT: {scenario_info['title']}",
        message=f"{count} sudden incoming patients registered via mass-casualty triage. Bed capacity index reaching peak critical threshold.",
        department="Hospital Emergency Operations Command",
        status=AlertStatus.ACTIVE.value
    )
    db.add(surge_alert)
    db.commit()

    # Recalculate metrics
    all_beds = db.query(Bed).all()
    total_beds = len(all_beds)
    occupied_beds = sum(1 for b in all_beds if b.status == BedStatus.OCCUPIED.value)
    overall_cap = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0

    icu_dept = db.query(Department).filter(Department.code == "ICU").first()
    icu_util = 0.0
    if icu_dept:
        icu_b = [b for b in all_beds if b.department_id == icu_dept.id]
        icu_util = round((sum(1 for b in icu_b if b.status == BedStatus.OCCUPIED.value) / len(icu_b) * 100), 1) if icu_b else 0

    ed_dept = db.query(Department).filter(Department.code == "ED").first()
    ed_util = 0.0
    if ed_dept:
        ed_b = [b for b in all_beds if b.department_id == ed_dept.id]
        ed_util = round((sum(1 for b in ed_b if b.status == BedStatus.OCCUPIED.value) / len(ed_b) * 100), 1) if ed_b else 0

    alerts_triggered = [
        f"Critical Surge Protocol: {scenario_info['title']} activated",
        f"Emergency Care Acuity saturation reached {ed_util}%",
        f"Intensive Care Unit (ICU) reached {icu_util}% occupancy"
    ]
    resource_shortages = [
        "Ventilator supply at reserve buffer threshold",
        "Trauma & resuscitation bay zero available surplus",
        "Rapid response nursing team mobilization requested"
    ]

    log_action(
        db=db,
        action="SURGE_SIMULATION_ACTIVATED",
        entity="Simulation",
        entity_id=payload.scenario,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value="Normal Operations",
        new_value="Mass Casualty Surge",
        details=f"Triggered surge scenario '{scenario_info['title']}' with {count} incoming synthetic patients. Hospital load spiked to {overall_cap}%."
    )

    # Broadcast websocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "SURGE_SIMULATION_ACTIVATED",
                "data": {
                    "scenario": scenario_info["title"],
                    "incoming": count,
                    "overall_occupancy": overall_cap
                }
            }))
    except Exception:
        pass

    return SurgeSimulationResponse(
        scenario=payload.scenario,
        scenario_title=scenario_info["title"],
        scenario_description=scenario_info["description"],
        incoming_patients_count=count,
        critical_patients_added=crit_count,
        high_patients_added=high_count,
        medium_patients_added=med_count,
        beds_occupied_automatically=occupied_count,
        icu_utilization_after=icu_util,
        emergency_utilization_after=ed_util,
        overall_hospital_capacity_after=overall_cap,
        capacity_status="Critical Surge" if overall_cap > 85 else "Severe Pressure",
        estimated_waiting_time_minutes=85,
        alerts_triggered=alerts_triggered,
        resource_shortages=resource_shortages
    )

@router.post("/reset")
def reset_surge_simulation(
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    """
    Reverts surge simulation without modifying real patient baseline data.
    """
    sim_patients = db.query(Patient).filter(Patient.is_simulation == True).all()
    count_reset = len(sim_patients)

    for p in sim_patients:
        if p.assigned_bed_id:
            bed = db.query(Bed).filter(Bed.id == p.assigned_bed_id).first()
            if bed:
                bed.status = BedStatus.AVAILABLE.value
                bed.current_patient_id = None
        db.delete(p)

    # Remove surge alerts
    surge_alerts = db.query(Alert).filter(Alert.type == "SURGE_DEMAND").all()
    for a in surge_alerts:
        db.delete(a)

    db.commit()

    log_action(
        db=db,
        action="SURGE_SIMULATION_RESET",
        entity="Simulation",
        entity_id="ALL",
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value="Mass Casualty Surge",
        new_value="Normal Baseline",
        details=f"Reset surge simulation. Cleared {count_reset} synthetic simulation patient records and restored assigned beds."
    )

    # Broadcast websocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "SURGE_SIMULATION_RESET",
                "data": {"cleared_patients": count_reset}
            }))
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Successfully reset simulation. Cleared {count_reset} simulation records and restored hospital baseline.",
        "cleared_patients": count_reset
    }
