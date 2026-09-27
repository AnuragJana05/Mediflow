from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class TriageAssessment(Base):
    __tablename__ = "triage_assessments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    calculated_priority = Column(String(20), nullable=False) # Critical, High, Medium, Low
    final_priority = Column(String(20), nullable=False)
    factors = Column(Text, nullable=False) # JSON encoded list of factors
    override_reason = Column(Text, nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="triage_assessments")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

class BedRecommendation(Base):
    __tablename__ = "bed_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    bed_id = Column(String(20), ForeignKey("beds.id"), nullable=False)
    score = Column(Integer, nullable=False) # 0 to 100
    is_compatible = Column(Boolean, default=True, nullable=False)
    reasons = Column(Text, nullable=False) # JSON encoded list of positive reasons
    rejected_reasons = Column(Text, nullable=True) # JSON encoded list of why incompatible / drawbacks
    status = Column(String(20), default="Recommended", nullable=False) # Recommended, Approved, Rejected, Expired
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime, nullable=True)

    patient = relationship("Patient", back_populates="recommendations")
    bed = relationship("Bed", back_populates="recommendations")
    reviewer = relationship("User", foreign_keys=[reviewed_by_id])

class BedAssignment(Base):
    __tablename__ = "bed_assignments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    bed_id = Column(String(20), ForeignKey("beds.id"), nullable=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    released_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="Active", nullable=False) # Active, Completed, Cancelled
    notes = Column(Text, nullable=True)

    patient = relationship("Patient", back_populates="assignments")
    bed = relationship("Bed", back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
