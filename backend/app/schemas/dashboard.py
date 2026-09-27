from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DepartmentOccupancy(BaseModel):
    id: int
    name: str
    code: str
    type: str
    total_beds: int
    available_beds: int
    occupied_beds: int
    cleaning_beds: int
    maintenance_beds: int
    occupancy_rate: float

class DashboardSummaryResponse(BaseModel):
    total_beds: int
    available_beds: int
    occupied_beds: int
    cleaning_beds: int
    maintenance_beds: int
    reserved_beds: int
    
    overall_occupancy_rate: float
    icu_occupancy_rate: float
    emergency_occupancy_rate: float
    general_ward_occupancy_rate: float
    isolation_occupancy_rate: float
    
    icu_total: int
    icu_available: int
    icu_occupied: int
    
    emergency_total: int
    emergency_available: int
    emergency_occupied: int
    
    total_patients: int
    waiting_patients: int
    critical_patients_waiting: int
    average_wait_time_minutes: float
    
    departments: List[DepartmentOccupancy]
