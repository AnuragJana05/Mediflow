from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.bed import Bed, BedStatus
from app.models.patient import Patient, PatientStatus, PriorityLevel
from app.models.department import Department
from app.websocket.manager import manager
import asyncio

def check_and_update_alerts(db: Session):
    """
    Evaluates hospital operational metrics against safety thresholds
    and creates or updates active alerts.
    """
    now = datetime.now(timezone.utc)
    
    # 1. ICU Capacity Check
    icu_dept = db.query(Department).filter(Department.code == "ICU").first()
    if icu_dept:
        icu_beds = db.query(Bed).filter(Bed.department_id == icu_dept.id).all()
        total_icu = len(icu_beds)
        occupied_icu = sum(1 for b in icu_beds if b.status == BedStatus.OCCUPIED.value)
        available_icu = sum(1 for b in icu_beds if b.status == BedStatus.AVAILABLE.value)
        
        if total_icu > 0:
            icu_rate = (occupied_icu / total_icu) * 100
            if icu_rate >= 85 or available_icu <= 1:
                existing = db.query(Alert).filter(
                    Alert.type == "ICU_CAPACITY",
                    Alert.status == AlertStatus.ACTIVE.value
                ).first()
                if not existing:
                    alert = Alert(
                        type="ICU_CAPACITY",
                        severity=AlertSeverity.CRITICAL.value if available_icu == 0 else AlertSeverity.HIGH.value,
                        title="Critical ICU Bed Congestion",
                        message=f"ICU occupancy reached {icu_rate:.1f}%. Only {available_icu} available bed(s) remaining out of {total_icu}.",
                        department="Intensive Care Unit",
                        status=AlertStatus.ACTIVE.value
                    )
                    db.add(alert)
                    db.commit()

    # 2. Emergency Department Pressure Check
    ed_dept = db.query(Department).filter(Department.code == "ED").first()
    if ed_dept:
        ed_beds = db.query(Bed).filter(Bed.department_id == ed_dept.id).all()
        total_ed = len(ed_beds)
        occupied_ed = sum(1 for b in ed_beds if b.status == BedStatus.OCCUPIED.value)
        available_ed = sum(1 for b in ed_beds if b.status == BedStatus.AVAILABLE.value)
        
        if total_ed > 0:
            ed_rate = (occupied_ed / total_ed) * 100
            if ed_rate >= 80:
                existing = db.query(Alert).filter(
                    Alert.type == "EMERGENCY_CAPACITY",
                    Alert.status == AlertStatus.ACTIVE.value
                ).first()
                if not existing:
                    alert = Alert(
                        type="EMERGENCY_CAPACITY",
                        severity=AlertSeverity.HIGH.value,
                        title="Emergency Department Surge Inflow",
                        message=f"Emergency acute care occupancy is at {ed_rate:.1f}%. Inflow triage delay risk elevated.",
                        department="Emergency Medicine",
                        status=AlertStatus.ACTIVE.value
                    )
                    db.add(alert)
                    db.commit()

    # 3. Critical Patients Waiting Check
    critical_waiting = db.query(Patient).filter(
        Patient.priority == PriorityLevel.CRITICAL.value,
        Patient.current_status.in_([PatientStatus.WAITING.value, PatientStatus.AWAITING_BED.value])
    ).all()
    
    if len(critical_waiting) > 0:
        existing = db.query(Alert).filter(
            Alert.type == "CRITICAL_WAITING",
            Alert.status == AlertStatus.ACTIVE.value
        ).first()
        if not existing:
            alert = Alert(
                type="CRITICAL_WAITING",
                severity=AlertSeverity.CRITICAL.value,
                title="Critical Patient(s) Awaiting Immediate Allocation",
                message=f"{len(critical_waiting)} critical acuity patient(s) waiting for suitable bed allocation.",
                department="Hospital Operations",
                status=AlertStatus.ACTIVE.value
            )
            db.add(alert)
            db.commit()

    # 4. Ventilator Resources Check
    total_vent_beds = db.query(Bed).filter(Bed.has_ventilator == True).all()
    avail_vent_beds = sum(1 for b in total_vent_beds if b.status == BedStatus.AVAILABLE.value)
    if len(total_vent_beds) > 0 and avail_vent_beds <= 1:
        existing = db.query(Alert).filter(
            Alert.type == "EQUIPMENT_SHORTAGE",
            Alert.status == AlertStatus.ACTIVE.value
        ).first()
        if not existing:
            alert = Alert(
                type="EQUIPMENT_SHORTAGE",
                severity=AlertSeverity.HIGH.value,
                title="Low Ventilator Inventory Warning",
                message=f"Only {avail_vent_beds} ventilator-equipped bed(s) currently unassigned across facility.",
                department="Respiratory / Critical Care",
                status=AlertStatus.ACTIVE.value
            )
            db.add(alert)
            db.commit()

def create_custom_alert(db: Session, alert_type: str, severity: str, title: str, message: str, department: str = None) -> Alert:
    alert = Alert(
        type=alert_type,
        severity=severity,
        title=title,
        message=message,
        department=department,
        status=AlertStatus.ACTIVE.value
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
