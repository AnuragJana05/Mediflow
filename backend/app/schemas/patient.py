from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class PatientVitalsCreate(BaseModel):
    spo2: int = Field(..., ge=50, le=100)
    heart_rate: int = Field(..., ge=20, le=250)
    blood_pressure_sys: int = Field(..., ge=50, le=280)
    blood_pressure_dia: int = Field(..., ge=30, le=160)
    temperature: float = Field(..., ge=30.0, le=45.0)
    respiratory_rate: Optional[int] = 16
    notes: Optional[str] = None

class PatientVitalsResponse(PatientVitalsCreate):
    id: int
    patient_id: str
    timestamp: datetime

    class Config:
        from_attributes = True

class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=0, le=125)
    gender: str = Field(..., pattern="^(Male|Female|Other)$")
    contact: Optional[str] = None
    emergency_contact: Optional[str] = None
    symptoms: str = Field(..., min_length=3)
    oxygen_requirement: str = "None" # None, Low Flow, High Flow, Invasive
    heart_rate: int = Field(75, ge=20, le=250)
    spo2: int = Field(98, ge=50, le=100)
    blood_pressure_sys: int = Field(120, ge=50, le=280)
    blood_pressure_dia: int = Field(80, ge=30, le=160)
    temperature: float = Field(37.0, ge=30.0, le=45.0)
    mobility_requirement: str = "Ambulatory" # Ambulatory, Wheelchair, Stretcher
    isolation_requirement: str = "None" # None, Airborne, Droplet, Contact
    required_equipment: Optional[str] = "" # e.g. "Ventilator, Cardiac Monitor"
    department_requirement: str = "General Ward"

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact: Optional[str] = None
    emergency_contact: Optional[str] = None
    symptoms: Optional[str] = None
    oxygen_requirement: Optional[str] = None
    heart_rate: Optional[int] = None
    spo2: Optional[int] = None
    blood_pressure_sys: Optional[int] = None
    blood_pressure_dia: Optional[int] = None
    temperature: Optional[float] = None
    mobility_requirement: Optional[str] = None
    isolation_requirement: Optional[str] = None
    required_equipment: Optional[str] = None
    department_requirement: Optional[str] = None
    current_status: Optional[str] = None

class PriorityOverrideRequest(BaseModel):
    priority: str # Critical, High, Medium, Low
    reason: str = Field(..., min_length=5, description="Mandatory clinician override justification")

class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    contact: Optional[str] = None
    emergency_contact: Optional[str] = None
    arrival_time: datetime
    symptoms: str
    oxygen_requirement: str
    heart_rate: int
    spo2: int
    blood_pressure_sys: int
    blood_pressure_dia: int
    temperature: float
    mobility_requirement: str
    isolation_requirement: str
    required_equipment: str
    department_requirement: str
    priority: str
    priority_override_reason: Optional[str] = None
    current_status: str
    assigned_bed_id: Optional[str] = None
    assigned_bed_room: Optional[str] = None
    admitted_at: Optional[datetime] = None
    discharged_at: Optional[datetime] = None
    is_simulation: bool
    created_at: datetime
    triage_factors: Optional[List[str]] = []

    class Config:
        from_attributes = True
