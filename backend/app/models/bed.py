from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class BedStatus(str, enum.Enum):
    AVAILABLE = "Available"
    OCCUPIED = "Occupied"
    CLEANING = "Cleaning"
    RESERVED = "Reserved"
    MAINTENANCE = "Maintenance"

class BedType(str, enum.Enum):
    STANDARD = "Standard"
    ICU = "ICU"
    CCU = "CCU"
    ISOLATION = "Isolation"
    STEP_DOWN = "Step-down"
    ER = "ER"

class Bed(Base):
    __tablename__ = "beds"

    id = Column(String(20), primary_key=True, index=True) # e.g. "ICU-01", "GW-101", "ED-03"
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    bed_type = Column(String(50), default=BedType.STANDARD.value, nullable=False)
    status = Column(String(50), default=BedStatus.AVAILABLE.value, nullable=False)
    floor = Column(String(20), default="1st Floor", nullable=False)
    room = Column(String(20), default="Room 101", nullable=False)
    
    # Capabilities / Equipment
    has_oxygen = Column(Boolean, default=True, nullable=False)
    has_ventilator = Column(Boolean, default=False, nullable=False)
    has_cardiac_monitor = Column(Boolean, default=False, nullable=False)
    has_isolation = Column(Boolean, default=False, nullable=False)
    has_infusion_pump = Column(Boolean, default=True, nullable=False)

    current_patient_id = Column(String(20), ForeignKey("patients.id", use_alter=True, name="fk_bed_patient"), nullable=True)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)

    ward = relationship("Ward", back_populates="beds")
    department = relationship("Department", back_populates="beds")
    current_patient = relationship("Patient", foreign_keys=[current_patient_id], post_update=True)
    assignments = relationship("BedAssignment", back_populates="bed")
    recommendations = relationship("BedRecommendation", back_populates="bed")
