from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"

class UserStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.DOCTOR.value, nullable=False)
    department = Column(String(100), nullable=True)
    status = Column(String(20), default=UserStatus.ACTIVE.value, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
