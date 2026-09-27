from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import random
from typing import Optional, List

from app.core.database import get_db
from app.models.patient import Patient, PatientVitals, PatientStatus, PriorityLevel
from app.models.bed import Bed, BedStatus
from app.models.recommendation import TriageAssessment, BedAssignment
from app.models.user import User
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse, 
    PriorityOverrideRequest, PatientVitalsCreate, PatientVitalsResponse
)
from app.algorithms.triage_engine import assess_patient_triage
from app.services.audit_service import log_action
from app.services.alert_service import check_and_update_alerts
from app.api.deps import get_current_user, require_role
from app.websocket.manager import manager
import asyncio

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
def get_patients(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    department_filter: Optional[str] = Query(None, alias="department"),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Patient)
    
    if status_filter:
        query = query.filter(Patient.current_status == status_filter)
    if priority_filter:
        query = query.filter(Patient.priority == priority_filter)
    if department_filter:
        query = query.filter(Patient.department_requirement == department_filter)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Patient.name.ilike(search_fmt)) | (Patient.id.ilike(search_fmt)) | (Patient.symptoms.ilike(search_fmt))
        )
    
    # Return sorted by priority (Critical first) then arrival time
    priority_order = {"Critical": 1, "High": 2, "Medium": 3, "Low": 4}
    patients = query.all()
    patients.sort(key=lambda p: (priority_order.get(p.priority, 5), p.arrival_time))
    
    results = []
    for p in patients:
        assigned_room = None
        if p.assigned_bed_id:
            b = db.query(Bed).filter(Bed.id == p.assigned_bed_id).first()
            if b:
                assigned_room = f"{b.id} ({b.room})"
        
        # Get latest triage factors if available
        latest_triage = db.query(TriageAssessment).filter(TriageAssessment.patient_id == p.id).order_by(TriageAssessment.created_at.desc()).first()
        factors = json.loads(latest_triage.factors) if (latest_triage and latest_triage.factors) else []

        results.append(PatientResponse(
            id=p.id,
            name=p.name,
            age=p.age,
            gender=p.gender,
            contact=p.contact,
            emergency_contact=p.emergency_contact,
            arrival_time=p.arrival_time,
            symptoms=p.symptoms,
            oxygen_requirement=p.oxygen_requirement,
            heart_rate=p.heart_rate,
            spo2=p.spo2,
            blood_pressure_sys=p.blood_pressure_sys,
            blood_pressure_dia=p.blood_pressure_dia,
            temperature=p.temperature,
            mobility_requirement=p.mobility_requirement,
            isolation_requirement=p.isolation_requirement,
            required_equipment=p.required_equipment,
            department_requirement=p.department_requirement,
            priority=p.priority,
            priority_override_reason=p.priority_override_reason,
            current_status=p.current_status,
            assigned_bed_id=p.assigned_bed_id,
            assigned_bed_room=assigned_room,
            admitted_at=p.admitted_at,
            discharged_at=p.discharged_at,
            is_simulation=p.is_simulation,
            created_at=p.created_at,
            triage_factors=factors
        ))
    return results

@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def register_patient(
    payload: PatientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    # Generate unique ID e.g. P-1026
    count = db.query(Patient).count()
    patient_id = f"P-{1026 + count}"

    # 1. Run explainable triage engine
    triage_result = assess_patient_triage(
        spo2=payload.spo2,
        heart_rate=payload.heart_rate,
        bp_sys=payload.blood_pressure_sys,
        bp_dia=payload.blood_pressure_dia,
        temperature=payload.temperature,
        symptoms=payload.symptoms,
        oxygen_requirement=payload.oxygen_requirement,
        isolation_requirement=payload.isolation_requirement
    )

    initial_status = PatientStatus.AWAITING_BED.value if triage_result["priority"] in ["Critical", "High"] else PatientStatus.WAITING.value

    patient = Patient(
        id=patient_id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        contact=payload.contact,
        emergency_contact=payload.emergency_contact,
        arrival_time=now,
        symptoms=payload.symptoms,
        oxygen_requirement=payload.oxygen_requirement,
        heart_rate=payload.heart_rate,
        spo2=payload.spo2,
        blood_pressure_sys=payload.blood_pressure_sys,
        blood_pressure_dia=payload.blood_pressure_dia,
        temperature=payload.temperature,
        mobility_requirement=payload.mobility_requirement,
        isolation_requirement=payload.isolation_requirement,
        required_equipment=payload.required_equipment or "",
        department_requirement=payload.department_requirement,
        priority=triage_result["priority"],
        current_status=initial_status,
        is_simulation=False
    )
    db.add(patient)
    db.flush()

    # Record vitals log
    vitals = PatientVitals(
        patient_id=patient.id,
        timestamp=now,
        spo2=payload.spo2,
        heart_rate=payload.heart_rate,
        blood_pressure_sys=payload.blood_pressure_sys,
        blood_pressure_dia=payload.blood_pressure_dia,
        temperature=payload.temperature,
        notes="Initial intake vitals"
    )
    db.add(vitals)

    # Record Triage Assessment
    triage_rec = TriageAssessment(
        patient_id=patient.id,
        calculated_priority=triage_result["priority"],
        final_priority=triage_result["priority"],
        factors=json.dumps(triage_result["factors"]),
        reviewed_by_id=current_user.id
    )
    db.add(triage_rec)
    db.commit()
    db.refresh(patient)

    # Audit log
    log_action(
        db=db,
        action="PATIENT_REGISTERED",
        entity="Patient",
        entity_id=patient.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        new_value=patient.priority,
        details=f"Intake registered: {patient.name}. Triage classified as {patient.priority} based on {len(triage_result['factors'])} factors."
    )

    check_and_update_alerts(db)

    # Broadcast real-time update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "PATIENT_REGISTERED",
                "data": {
                    "patient_id": patient.id,
                    "name": patient.name,
                    "priority": patient.priority,
                    "status": patient.current_status,
                    "department": patient.department_requirement
                }
            }))
    except Exception:
        pass

    return PatientResponse(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        contact=patient.contact,
        emergency_contact=patient.emergency_contact,
        arrival_time=patient.arrival_time,
        symptoms=patient.symptoms,
        oxygen_requirement=patient.oxygen_requirement,
        heart_rate=patient.heart_rate,
        spo2=patient.spo2,
        blood_pressure_sys=patient.blood_pressure_sys,
        blood_pressure_dia=patient.blood_pressure_dia,
        temperature=patient.temperature,
        mobility_requirement=patient.mobility_requirement,
        isolation_requirement=patient.isolation_requirement,
        required_equipment=patient.required_equipment,
        department_requirement=patient.department_requirement,
        priority=patient.priority,
        current_status=patient.current_status,
        assigned_bed_id=None,
        is_simulation=False,
        created_at=patient.created_at,
        triage_factors=triage_result["factors"]
    )

@router.get("/{id}", response_model=PatientResponse)
def get_patient(id: str, db: Session = Depends(get_db)):
    p = db.query(Patient).filter(Patient.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    assigned_room = None
    if p.assigned_bed_id:
        b = db.query(Bed).filter(Bed.id == p.assigned_bed_id).first()
        if b:
            assigned_room = f"{b.id} ({b.room})"
    
    latest_triage = db.query(TriageAssessment).filter(TriageAssessment.patient_id == p.id).order_by(TriageAssessment.created_at.desc()).first()
    factors = json.loads(latest_triage.factors) if (latest_triage and latest_triage.factors) else []

    return PatientResponse(
        id=p.id,
        name=p.name,
        age=p.age,
        gender=p.gender,
        contact=p.contact,
        emergency_contact=p.emergency_contact,
        arrival_time=p.arrival_time,
        symptoms=p.symptoms,
        oxygen_requirement=p.oxygen_requirement,
        heart_rate=p.heart_rate,
        spo2=p.spo2,
        blood_pressure_sys=p.blood_pressure_sys,
        blood_pressure_dia=p.blood_pressure_dia,
        temperature=p.temperature,
        mobility_requirement=p.mobility_requirement,
        isolation_requirement=p.isolation_requirement,
        required_equipment=p.required_equipment,
        department_requirement=p.department_requirement,
        priority=p.priority,
        priority_override_reason=p.priority_override_reason,
        current_status=p.current_status,
        assigned_bed_id=p.assigned_bed_id,
        assigned_bed_room=assigned_room,
        admitted_at=p.admitted_at,
        discharged_at=p.discharged_at,
        is_simulation=p.is_simulation,
        created_at=p.created_at,
        triage_factors=factors
    )

@router.post("/{id}/override-priority")
def override_priority(
    id: str,
    payload: PriorityOverrideRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    old_priority = patient.priority
    patient.priority = payload.priority
    patient.priority_override_reason = payload.reason
    patient.priority_overridden_by = current_user.id
    
    # Record Triage Assessment override
    triage_rec = TriageAssessment(
        patient_id=patient.id,
        calculated_priority=old_priority,
        final_priority=payload.priority,
        factors=json.dumps([f"Clinician Override: {payload.reason}"]),
        override_reason=payload.reason,
        reviewed_by_id=current_user.id
    )
    db.add(triage_rec)
    db.commit()

    log_action(
        db=db,
        action="PRIORITY_OVERRIDDEN",
        entity="Patient",
        entity_id=patient.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=old_priority,
        new_value=payload.priority,
        details=f"Doctor {current_user.name} overridden priority to {payload.priority}. Justification: {payload.reason}"
    )

    check_and_update_alerts(db)

    return {"message": "Priority successfully overridden", "patient_id": patient.id, "new_priority": payload.priority}

@router.post("/{id}/discharge")
def discharge_patient(
    id: str,
    current_user: User = Depends(require_role(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    bed_id = patient.assigned_bed_id
    now = datetime.now(timezone.utc)
    patient.current_status = PatientStatus.DISCHARGED.value
    patient.discharged_at = now
    patient.assigned_bed_id = None

    if bed_id:
        bed = db.query(Bed).filter(Bed.id == bed_id).first()
        if bed:
            bed.status = BedStatus.CLEANING.value # transition to Cleaning
            bed.current_patient_id = None
            bed.last_updated = now
            
            # Close assignment
            assignment = db.query(BedAssignment).filter(
                BedAssignment.patient_id == patient.id,
                BedAssignment.bed_id == bed_id,
                BedAssignment.status == "Active"
            ).first()
            if assignment:
                assignment.released_at = now
                assignment.status = "Completed"

    db.commit()

    log_action(
        db=db,
        action="PATIENT_DISCHARGED",
        entity="Patient",
        entity_id=patient.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=PatientStatus.ADMITTED.value,
        new_value=PatientStatus.DISCHARGED.value,
        details=f"Patient {patient.name} discharged. Bed {bed_id} marked for cleaning/sanitization."
    )

    # Broadcast websocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "PATIENT_DISCHARGED",
                "data": {
                    "patient_id": patient.id,
                    "bed_id": bed_id
                }
            }))
    except Exception:
        pass

    return {"message": "Patient discharged successfully", "patient_id": patient.id, "bed_status": "Cleaning"}
