from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BedBase(BaseModel):
    id: str
    ward_id: int
    department_id: int
    bed_type: str = "Standard"
    status: str = "Available"
    floor: str = "1st Floor"
    room: str = "Room 101"
    has_oxygen: bool = True
    has_ventilator: bool = False
    has_cardiac_monitor: bool = False
    has_isolation: bool = False
    has_infusion_pump: bool = True
    notes: Optional[str] = None

class BedCreate(BedBase):
    pass

class BedUpdate(BaseModel):
    bed_type: Optional[str] = None
    status: Optional[str] = None
    floor: Optional[str] = None
    room: Optional[str] = None
    has_oxygen: Optional[bool] = None
    has_ventilator: Optional[bool] = None
    has_cardiac_monitor: Optional[bool] = None
    has_isolation: Optional[bool] = None
    has_infusion_pump: Optional[bool] = None
    notes: Optional[str] = None

class BedStatusUpdate(BaseModel):
    status: str # Available, Occupied, Cleaning, Reserved, Maintenance
    notes: Optional[str] = None

class BedAssignRequest(BaseModel):
    patient_id: str
    notes: Optional[str] = None

class BedResponse(BedBase):
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    ward_name: Optional[str] = None
    current_patient_id: Optional[str] = None
    current_patient_name: Optional[str] = None
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True
