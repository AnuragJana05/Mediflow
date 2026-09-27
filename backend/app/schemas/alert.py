from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    message: str
    department: Optional[str] = None
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by_id: Optional[int] = None
    acknowledged_by_name: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = "Acknowledged by operations staff"
