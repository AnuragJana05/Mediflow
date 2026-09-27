from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, List

from app.core.database import get_db
from app.models.bed import Bed, BedStatus
from app.models.department import Department, Ward
from app.models.patient import Patient, PatientStatus
from app.models.recommendation import BedAssignment
from app.models.user import User
from app.schemas.bed import BedCreate, BedUpdate, BedStatusUpdate, BedResponse, BedAssignRequest
from app.services.audit_service import log_action
from app.services.alert_service import check_and_update_alerts
from app.api.deps import get_current_user, require_role
from app.websocket.manager import manager
import asyncio

router = APIRouter(prefix="/beds", tags=["Beds"])

@router.get("", response_model=List[BedResponse])
def get_beds(
    department_code: Optional[str] = Query(None, alias="department"),
    status_filter: Optional[str] = Query(None, alias="status"),
    floor_filter: Optional[str] = Query(None, alias="floor"),
    has_ventilator: Optional[bool] = None,
    has_oxygen: Optional[bool] = None,
    has_isolation: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Bed)
    
    if department_code:
        dept = db.query(Department).filter(Department.code == department_code).first()
        if dept:
            query = query.filter(Bed.department_id == dept.id)
    if status_filter:
        query = query.filter(Bed.status == status_filter)
    if floor_filter:
        query = query.filter(Bed.floor == floor_filter)
    if has_ventilator is not None:
        query = query.filter(Bed.has_ventilator == has_ventilator)
    if has_oxygen is not None:
        query = query.filter(Bed.has_oxygen == has_oxygen)
    if has_isolation is not None:
        query = query.filter(Bed.has_isolation == has_isolation)

    beds = query.all()
    results = []
    for b in beds:
        patient_name = None
        if b.current_patient_id:
            p = db.query(Patient).filter(Patient.id == b.current_patient_id).first()
            if p:
                patient_name = p.name

        results.append(BedResponse(
            id=b.id,
            ward_id=b.ward_id,
            department_id=b.department_id,
            bed_type=b.bed_type,
            status=b.status,
            floor=b.floor,
            room=b.room,
            has_oxygen=b.has_oxygen,
            has_ventilator=b.has_ventilator,
            has_cardiac_monitor=b.has_cardiac_monitor,
            has_isolation=b.has_isolation,
            has_infusion_pump=b.has_infusion_pump,
            notes=b.notes,
            department_name=b.department.name if b.department else None,
            department_code=b.department.code if b.department else None,
            ward_name=b.ward.name if b.ward else None,
            current_patient_id=b.current_patient_id,
            current_patient_name=patient_name,
            last_updated=b.last_updated
        ))
    return results

@router.get("/{id}", response_model=BedResponse)
def get_bed(id: str, db: Session = Depends(get_db)):
    b = db.query(Bed).filter(Bed.id == id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bed not found")
    
    patient_name = None
    if b.current_patient_id:
        p = db.query(Patient).filter(Patient.id == b.current_patient_id).first()
        if p:
            patient_name = p.name

    return BedResponse(
        id=b.id,
        ward_id=b.ward_id,
        department_id=b.department_id,
        bed_type=b.bed_type,
        status=b.status,
        floor=b.floor,
        room=b.room,
        has_oxygen=b.has_oxygen,
        has_ventilator=b.has_ventilator,
        has_cardiac_monitor=b.has_cardiac_monitor,
        has_isolation=b.has_isolation,
        has_infusion_pump=b.has_infusion_pump,
        notes=b.notes,
        department_name=b.department.name if b.department else None,
        department_code=b.department.code if b.department else None,
        ward_name=b.ward.name if b.ward else None,
        current_patient_id=b.current_patient_id,
        current_patient_name=patient_name,
        last_updated=b.last_updated
    )

@router.post("", response_model=BedResponse, status_code=status.HTTP_201_CREATED)
def create_bed(
    payload: BedCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Bed).filter(Bed.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bed with this ID already exists")

    bed = Bed(
        id=payload.id,
        ward_id=payload.ward_id,
        department_id=payload.department_id,
        bed_type=payload.bed_type,
        status=payload.status,
        floor=payload.floor,
        room=payload.room,
        has_oxygen=payload.has_oxygen,
        has_ventilator=payload.has_ventilator,
        has_cardiac_monitor=payload.has_cardiac_monitor,
        has_isolation=payload.has_isolation,
        has_infusion_pump=payload.has_infusion_pump,
        notes=payload.notes,
        last_updated=datetime.now(timezone.utc)
    )
    db.add(bed)
    db.commit()
    db.refresh(bed)

    log_action(
        db=db,
        action="BED_CREATED",
        entity="Bed",
        entity_id=bed.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        new_value=bed.status,
        details=f"Admin created new bed {bed.id} in {bed.department.name if bed.department else 'ward'}"
    )

    return get_bed(bed.id, db)

@router.put("/{id}/status", response_model=BedResponse)
def update_bed_status(
    id: str,
    payload: BedStatusUpdate,
    current_user: User = Depends(require_role(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    old_status = bed.status
    bed.status = payload.status
    if payload.notes:
        bed.notes = payload.notes
    bed.last_updated = datetime.now(timezone.utc)
    
    # If set to available, clear patient if still lingered
    if payload.status == BedStatus.AVAILABLE.value:
        bed.current_patient_id = None

    db.commit()

    log_action(
        db=db,
        action="BED_STATUS_CHANGED",
        entity="Bed",
        entity_id=bed.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=old_status,
        new_value=payload.status,
        details=f"Bed status updated to {payload.status}. Notes: {payload.notes or 'None'}"
    )

    check_and_update_alerts(db)

    # Broadcast WebSocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "BED_STATUS_CHANGED",
                "data": {
                    "bed_id": bed.id,
                    "old_status": old_status,
                    "new_status": bed.status,
                    "department_id": bed.department_id,
                    "current_patient_id": bed.current_patient_id
                }
            }))
    except Exception:
        pass

    return get_bed(bed.id, db)

@router.post("/{id}/assign", response_model=BedResponse)
def assign_bed(
    id: str,
    payload: BedAssignRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    now = datetime.now(timezone.utc)
    old_status = bed.status
    bed.status = BedStatus.OCCUPIED.value
    bed.current_patient_id = patient.id
    bed.last_updated = now

    patient.assigned_bed_id = bed.id
    patient.current_status = PatientStatus.ADMITTED.value
    patient.admitted_at = now

    assignment = BedAssignment(
        patient_id=patient.id,
        bed_id=bed.id,
        assigned_by_id=current_user.id,
        assigned_at=now,
        status="Active",
        notes=payload.notes or f"Assigned by {current_user.name}"
    )
    db.add(assignment)
    db.commit()

    log_action(
        db=db,
        action="BED_ASSIGNED",
        entity="Bed",
        entity_id=bed.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=old_status,
        new_value=BedStatus.OCCUPIED.value,
        details=f"Assigned patient {patient.name} ({patient.id}) to bed {bed.id}."
    )

    check_and_update_alerts(db)

    # Broadcast WebSocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "BED_STATUS_CHANGED",
                "data": {
                    "bed_id": bed.id,
                    "old_status": old_status,
                    "new_status": bed.status,
                    "current_patient_id": patient.id
                }
            }))
    except Exception:
        pass

    return get_bed(bed.id, db)

@router.post("/{id}/release", response_model=BedResponse)
def release_bed(
    id: str,
    target_status: str = Query("Cleaning", enum=["Cleaning", "Available"]),
    current_user: User = Depends(require_role(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    bed = db.query(Bed).filter(Bed.id == id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    now = datetime.now(timezone.utc)
    old_status = bed.status
    old_patient_id = bed.current_patient_id

    if old_patient_id:
        patient = db.query(Patient).filter(Patient.id == old_patient_id).first()
        if patient:
            patient.assigned_bed_id = None
            if patient.current_status == PatientStatus.ADMITTED.value:
                patient.current_status = PatientStatus.DISCHARGED.value
                patient.discharged_at = now

    bed.status = target_status
    bed.current_patient_id = None
    bed.last_updated = now

    # Close active assignments
    assignment = db.query(BedAssignment).filter(
        BedAssignment.bed_id == bed.id,
        BedAssignment.status == "Active"
    ).first()
    if assignment:
        assignment.released_at = now
        assignment.status = "Completed"

    db.commit()

    log_action(
        db=db,
        action="BED_RELEASED",
        entity="Bed",
        entity_id=bed.id,
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=old_status,
        new_value=target_status,
        details=f"Bed {bed.id} released from patient {old_patient_id or 'none'}, transitioned to {target_status}."
    )

    check_and_update_alerts(db)

    # Broadcast WebSocket update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "BED_STATUS_CHANGED",
                "data": {
                    "bed_id": bed.id,
                    "old_status": old_status,
                    "new_status": bed.status,
                    "current_patient_id": None
                }
            }))
    except Exception:
        pass

    return get_bed(bed.id, db)
