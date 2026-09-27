from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class AlertSeverity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    INFO = "Info"

class AlertStatus(str, enum.Enum):
    ACTIVE = "Active"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String(50), nullable=False) # ICU_CAPACITY, EMERGENCY_CAPACITY, CRITICAL_WAITING, etc.
    severity = Column(String(20), default=AlertSeverity.MEDIUM.value, nullable=False)
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    department = Column(String(50), nullable=True)
    status = Column(String(20), default=AlertStatus.ACTIVE.value, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    acknowledged_by = relationship("User", foreign_keys=[acknowledged_by_id])
