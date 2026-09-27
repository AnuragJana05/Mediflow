from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class PriorityLevel(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class PatientStatus(str, enum.Enum):
    WAITING = "Waiting"
    UNDER_ASSESSMENT = "Under Assessment"
    AWAITING_BED = "Awaiting Bed"
    ADMITTED = "Admitted"
    DISCHARGED = "Discharged"
    TRANSFERRED = "Transferred"

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(20), primary_key=True, index=True) # e.g. "P-1001"
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False) # Male, Female, Other
    contact = Column(String(50), nullable=True)
    emergency_contact = Column(String(50), nullable=True)
    arrival_time = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Clinical presentation
    symptoms = Column(Text, nullable=False)
    oxygen_requirement = Column(String(50), default="None", nullable=False) # None, Low Flow, High Flow, Invasive
    heart_rate = Column(Integer, default=75, nullable=False)
    spo2 = Column(Integer, default=98, nullable=False)
    blood_pressure_sys = Column(Integer, default=120, nullable=False)
    blood_pressure_dia = Column(Integer, default=80, nullable=False)
    temperature = Column(Float, default=37.0, nullable=False)
    
    mobility_requirement = Column(String(50), default="Ambulatory", nullable=False) # Ambulatory, Wheelchair, Stretcher
    isolation_requirement = Column(String(50), default="None", nullable=False) # None, Airborne, Droplet, Contact
    required_equipment = Column(String(255), default="", nullable=False) # comma-separated: Ventilator, Cardiac Monitor, Infusion Pump
    department_requirement = Column(String(100), default="General Ward", nullable=False)

    priority = Column(String(20), default=PriorityLevel.MEDIUM.value, nullable=False)
    priority_override_reason = Column(Text, nullable=True)
    priority_overridden_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    current_status = Column(String(50), default=PatientStatus.WAITING.value, nullable=False)
    assigned_bed_id = Column(String(20), ForeignKey("beds.id", use_alter=True, name="fk_patient_bed"), nullable=True)
    admitted_at = Column(DateTime, nullable=True)
    discharged_at = Column(DateTime, nullable=True)
    
    # Simulation safety isolate
    is_simulation = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    vitals = relationship("PatientVitals", back_populates="patient", cascade="all, delete-orphan")
    triage_assessments = relationship("TriageAssessment", back_populates="patient", cascade="all, delete-orphan")
    recommendations = relationship("BedRecommendation", back_populates="patient", cascade="all, delete-orphan")
    assignments = relationship("BedAssignment", back_populates="patient")

class PatientVitals(Base):
    __tablename__ = "patient_vitals"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    spo2 = Column(Integer, nullable=False)
    heart_rate = Column(Integer, nullable=False)
    blood_pressure_sys = Column(Integer, nullable=False)
    blood_pressure_dia = Column(Integer, nullable=False)
    temperature = Column(Float, nullable=False)
    respiratory_rate = Column(Integer, default=16, nullable=False)
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="vitals")
