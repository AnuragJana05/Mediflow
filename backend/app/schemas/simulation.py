from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SurgeSimulationRequest(BaseModel):
    scenario: str = "highway_collision" # highway_collision, chemical_hazard, respiratory_outbreak, mass_gathering
    patient_count: int = 12
    critical_ratio: float = 0.5 # 50% critical

class SurgeSimulationResponse(BaseModel):
    scenario: str
    scenario_title: str
    scenario_description: str
    incoming_patients_count: int
    critical_patients_added: int
    high_patients_added: int
    medium_patients_added: int
    beds_occupied_automatically: int
    icu_utilization_after: float
    emergency_utilization_after: float
    overall_hospital_capacity_after: float
    capacity_status: str # "Normal", "Elevated", "Severe Pressure", "Critical Surge"
    estimated_waiting_time_minutes: int
    alerts_triggered: List[str]
    resource_shortages: List[str]
    disclaimer: str = "Surge simulation generates reversible synthetic scenarios and does not alter real patient care records."
