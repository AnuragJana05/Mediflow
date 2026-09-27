from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from app.core.database import get_db
from app.models.bed import Bed, BedStatus
from app.models.patient import Patient, PatientStatus, PriorityLevel
from app.models.department import Department

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(
    period: str = Query("today", enum=["today", "7d", "30d", "custom"]),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    now = datetime.now(timezone.utc)
    
    # 1. Occupancy Trends data points
    if period == "today":
        time_points = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"]
        occupancy_history = [
            {"time": "00:00", "overall": 62, "icu": 68, "ed": 55, "general": 65, "admissions": 2, "discharges": 0},
            {"time": "03:00", "overall": 64, "icu": 70, "ed": 58, "general": 66, "admissions": 1, "discharges": 0},
            {"time": "06:00", "overall": 68, "icu": 75, "ed": 64, "general": 68, "admissions": 3, "discharges": 1},
            {"time": "09:00", "overall": 75, "icu": 80, "ed": 78, "general": 73, "admissions": 6, "discharges": 2},
            {"time": "12:00", "overall": 82, "icu": 85, "ed": 84, "general": 81, "admissions": 8, "discharges": 4},
            {"time": "15:00", "overall": 78, "icu": 82, "ed": 80, "general": 76, "admissions": 5, "discharges": 6},
            {"time": "18:00", "overall": 74, "icu": 80, "ed": 75, "general": 72, "admissions": 4, "discharges": 5},
            {"time": "21:00", "overall": 72, "icu": 78, "ed": 70, "general": 71, "admissions": 3, "discharges": 2},
            {"time": "Now", "overall": 73, "icu": 79, "ed": 72, "general": 72, "admissions": 2, "discharges": 1},
        ]
    elif period == "7d":
        occupancy_history = [
            {"time": "Mon", "overall": 68, "icu": 75, "ed": 65, "general": 68, "admissions": 24, "discharges": 20},
            {"time": "Tue", "overall": 72, "icu": 78, "ed": 70, "general": 71, "admissions": 28, "discharges": 22},
            {"time": "Wed", "overall": 76, "icu": 84, "ed": 78, "general": 74, "admissions": 32, "discharges": 25},
            {"time": "Thu", "overall": 81, "icu": 88, "ed": 82, "general": 79, "admissions": 35, "discharges": 28},
            {"time": "Fri", "overall": 85, "icu": 91, "ed": 86, "general": 82, "admissions": 39, "discharges": 30},
            {"time": "Sat", "overall": 79, "icu": 85, "ed": 80, "general": 76, "admissions": 26, "discharges": 24},
            {"time": "Sun (Today)", "overall": 73, "icu": 79, "ed": 72, "general": 72, "admissions": 22, "discharges": 19},
        ]
    else: # 30d or custom
        occupancy_history = [
            {"time": "Week 1", "overall": 69, "icu": 74, "ed": 68, "general": 68, "admissions": 185, "discharges": 165},
            {"time": "Week 2", "overall": 74, "icu": 80, "ed": 75, "general": 73, "admissions": 210, "discharges": 192},
            {"time": "Week 3", "overall": 82, "icu": 89, "ed": 84, "general": 80, "admissions": 245, "discharges": 218},
            {"time": "Week 4", "overall": 75, "icu": 81, "ed": 76, "general": 74, "admissions": 198, "discharges": 184},
        ]

    # 2. Average wait time by priority
    wait_time_by_priority = [
        {"priority": "Critical", "average_minutes": 11.4, "target_minutes": 15, "status": "Within Target"},
        {"priority": "High", "average_minutes": 28.6, "target_minutes": 30, "status": "Within Target"},
        {"priority": "Medium", "average_minutes": 54.2, "target_minutes": 60, "status": "Within Target"},
        {"priority": "Low", "average_minutes": 98.0, "target_minutes": 120, "status": "Within Target"},
    ]

    # 3. Department utilization
    departments = db.query(Department).all()
    beds = db.query(Bed).all()
    dept_utilization = []
    for d in departments:
        d_beds = [b for b in beds if b.department_id == d.id]
        total = len(d_beds)
        occupied = sum(1 for b in d_beds if b.status == BedStatus.OCCUPIED.value)
        rate = round((occupied / total * 100), 1) if total > 0 else 0
        dept_utilization.append({
            "department": d.name,
            "code": d.code,
            "utilization": rate,
            "total_beds": total,
            "occupied_beds": occupied,
            "available_beds": sum(1 for b in d_beds if b.status == BedStatus.AVAILABLE.value)
        })

    # 4. Hourly Peak Load Index (24-hour heatmap / distribution)
    peak_load_distribution = [
        {"hour": "00:00", "inflow": 4, "outflow": 1, "pressure_index": 35},
        {"hour": "02:00", "inflow": 3, "outflow": 0, "pressure_index": 30},
        {"hour": "04:00", "inflow": 2, "outflow": 1, "pressure_index": 25},
        {"hour": "06:00", "inflow": 5, "outflow": 2, "pressure_index": 45},
        {"hour": "08:00", "inflow": 9, "outflow": 3, "pressure_index": 68},
        {"hour": "10:00", "inflow": 14, "outflow": 8, "pressure_index": 82},
        {"hour": "12:00", "inflow": 18, "outflow": 11, "pressure_index": 91},
        {"hour": "14:00", "inflow": 16, "outflow": 14, "pressure_index": 86},
        {"hour": "16:00", "inflow": 15, "outflow": 12, "pressure_index": 84},
        {"hour": "18:00", "inflow": 12, "outflow": 7, "pressure_index": 76},
        {"hour": "20:00", "inflow": 8, "outflow": 4, "pressure_index": 58},
        {"hour": "22:00", "inflow": 6, "outflow": 2, "pressure_index": 48},
    ]

    # 5. Turnover metrics
    turnover_metrics = {
        "bed_turnover_rate": "1.82 patients / bed / day",
        "cleaning_cycle_avg": "38 minutes",
        "admission_rate_hourly": "4.2 patients / hr",
        "discharge_rate_hourly": "3.8 patients / hr",
        "critical_escalation_rate": "2.4%"
    }

    return {
        "period": period,
        "occupancy_history": occupancy_history,
        "wait_time_by_priority": wait_time_by_priority,
        "department_utilization": dept_utilization,
        "peak_load_distribution": peak_load_distribution,
        "turnover_metrics": turnover_metrics
    }
