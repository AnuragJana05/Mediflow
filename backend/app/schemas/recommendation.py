from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class BedMatchItem(BaseModel):
    bed_id: str
    ward_name: str
    department_name: str
    department_code: str
    floor: str
    room: str
    bed_type: str
    status: str
    has_oxygen: bool
    has_ventilator: bool
    has_cardiac_monitor: bool
    has_isolation: bool
    compatibility_score: int
    is_compatible: bool
    reasons: List[str]
    rejection_reasons: List[str]

class RecommendationResponse(BaseModel):
    patient_id: str
    patient_name: str
    patient_priority: str
    required_department: str
    recommendations: List[BedMatchItem]
    unavailable_alternatives: List[BedMatchItem]
    top_recommendation: Optional[BedMatchItem] = None
    disclaimer: str

class RecommendationApprovalRequest(BaseModel):
    bed_id: str
    notes: Optional[str] = "Clinician approved bed match"

class RecommendationRejectRequest(BaseModel):
    bed_id: str
    reason: str
