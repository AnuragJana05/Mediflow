from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
from typing import Optional

from app.core.database import get_db
from app.models.patient import Patient, PatientStatus
from app.models.bed import Bed, BedStatus
from app.models.recommendation import BedRecommendation, BedAssignment
from app.models.user import User
from app.schemas.recommendation import (
    RecommendationResponse, RecommendationApprovalRequest, RecommendationRejectRequest
)
from app.algorithms.bed_matching_engine import match_beds_for_patient
from app.services.audit_service import log_action
from app.services.alert_service import check_and_update_alerts
from app.api.deps import get_current_user, require_role
from app.websocket.manager import manager
import asyncio

router = APIRouter(prefix="/recommendations", tags=["Smart Bed Matching"])

@router.get("", response_model=RecommendationResponse)
def get_bed_recommendations(
    patient_id: str = Query(..., description="ID of patient awaiting bed matching e.g. P-1024"),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get all beds in the hospital (both available and unavailable for comprehensive matching analysis)
    all_beds = db.query(Bed).all()
    
    # Run the Smart Matching Engine
    result = match_beds_for_patient(patient, all_beds)
    return result

@router.post("/approve")
def approve_recommendation(
    patient_id: str,
    payload: RecommendationApprovalRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    bed = db.query(Bed).filter(Bed.id == payload.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    if bed.status != BedStatus.AVAILABLE.value and bed.status != BedStatus.RESERVED.value:
        raise HTTPException(
            status_code=400,
            detail=f"Bed {bed.id} is currently {bed.status}. Only Available or Reserved beds can be approved."
        )

    now = datetime.now(timezone.utc)
    old_bed_status = bed.status
    old_patient_status = patient.current_status

    # Update bed
    bed.status = BedStatus.OCCUPIED.value
    bed.current_patient_id = patient.id
    bed.last_updated = now

    # Update patient
    patient.assigned_bed_id = bed.id
    patient.current_status = PatientStatus.ADMITTED.value
    patient.admitted_at = now

    # Create BedAssignment
    assignment = BedAssignment(
        patient_id=patient.id,
        bed_id=bed.id,
        assigned_by_id=current_user.id,
        assigned_at=now,
        status="Active",
        notes=payload.notes or f"Approved recommendation by {current_user.name}"
    )
    db.add(assignment)

    # Save Recommendation Decision Record
    rec_record = BedRecommendation(
        patient_id=patient.id,
        bed_id=bed.id,
        score=95,
        is_compatible=True,
        reasons=json.dumps([
            f"Approved by {current_user.name} ({current_user.role})",
            f"Department: {bed.department.name if bed.department else 'Ward'}",
            f"Room: {bed.room}"
        ]),
        status="Approved",
        reviewed_by_id=current_user.id,
        reviewed_at=now
    )
    db.add(rec_record)
    db.commit()

    # Log to Audit trail
    log_action(
        db=db,
        action="RECOMMENDATION_APPROVED",
        entity="Allocation",
        entity_id=f"{patient.id}->{bed.id}",
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value=old_bed_status,
        new_value=BedStatus.OCCUPIED.value,
        details=f"Doctor {current_user.name} approved allocation of patient {patient.name} ({patient.id}) to bed {bed.id}. Notes: {payload.notes}"
    )

    check_and_update_alerts(db)

    # Broadcast real-time update
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast({
                "type": "RECOMMENDATION_APPROVED",
                "data": {
                    "patient_id": patient.id,
                    "patient_name": patient.name,
                    "bed_id": bed.id,
                    "approved_by": current_user.name,
                    "timestamp": now.isoformat()
                }
            }))
    except Exception:
        pass

    return {
        "success": True,
        "message": f"Successfully allocated Bed {bed.id} to Patient {patient.name}",
        "bed_id": bed.id,
        "patient_id": patient.id,
        "status": "Admitted",
        "approved_by": current_user.name,
        "timestamp": now.isoformat()
    }

@router.post("/reject")
def reject_recommendation(
    patient_id: str,
    payload: RecommendationRejectRequest,
    current_user: User = Depends(require_role(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    now = datetime.now(timezone.utc)
    rec_record = BedRecommendation(
        patient_id=patient.id,
        bed_id=payload.bed_id,
        score=0,
        is_compatible=False,
        reasons=json.dumps([]),
        rejected_reasons=json.dumps([f"Rejected by {current_user.name}: {payload.reason}"]),
        status="Rejected",
        reviewed_by_id=current_user.id,
        reviewed_at=now
    )
    db.add(rec_record)
    db.commit()

    log_action(
        db=db,
        action="RECOMMENDATION_REJECTED",
        entity="Allocation",
        entity_id=f"{patient.id}->{payload.bed_id}",
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        old_value="Recommended",
        new_value="Rejected",
        details=f"Doctor {current_user.name} rejected recommendation for bed {payload.bed_id}. Reason: {payload.reason}"
    )

    return {
        "success": True,
        "message": f"Recommendation for Bed {payload.bed_id} rejected",
        "patient_id": patient.id,
        "rejected_by": current_user.name
    }
