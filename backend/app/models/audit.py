from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), default="System", nullable=False)
    user_role = Column(String(50), default="system", nullable=False)
    action = Column(String(100), nullable=False) # e.g. "PATIENT_REGISTERED", "PRIORITY_OVERRIDDEN", "RECOMMENDATION_APPROVED", "BED_STATUS_CHANGED"
    entity = Column(String(50), nullable=False) # e.g. "Patient", "Bed", "Allocation", "Simulation"
    entity_id = Column(String(50), nullable=False) # e.g. "P-1001", "ICU-02"
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
