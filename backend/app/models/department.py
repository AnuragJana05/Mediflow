from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False) # ICU, Emergency, Inpatient, Isolation, Surgical, etc.
    capacity = Column(Integer, default=10, nullable=False)
    head_doctor = Column(String(100), nullable=True)

    wards = relationship("Ward", back_populates="department", cascade="all, delete-orphan")
    beds = relationship("Bed", back_populates="department")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    name = Column(String(100), nullable=False)
    floor = Column(String(20), nullable=False) # "1st Floor", "2nd Floor", "Ground"
    capacity = Column(Integer, default=5, nullable=False)

    department = relationship("Department", back_populates="wards")
    beds = relationship("Bed", back_populates="ward")
