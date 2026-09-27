from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.bed import Bed, BedStatus
from app.models.patient import Patient, PatientStatus, PriorityLevel
from app.models.department import Department
from app.schemas.dashboard import DashboardSummaryResponse, DepartmentOccupancy
from app.services.alert_service import check_and_update_alerts

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # Run threshold checks
    check_and_update_alerts(db)

    beds = db.query(Bed).all()
    total_beds = len(beds)
    available_beds = sum(1 for b in beds if b.status == BedStatus.AVAILABLE.value)
    occupied_beds = sum(1 for b in beds if b.status == BedStatus.OCCUPIED.value)
    cleaning_beds = sum(1 for b in beds if b.status == BedStatus.CLEANING.value)
    maintenance_beds = sum(1 for b in beds if b.status == BedStatus.MAINTENANCE.value)
    reserved_beds = sum(1 for b in beds if b.status == BedStatus.RESERVED.value)

    overall_occ_rate = round((occupied_beds / total_beds * 100), 1) if total_beds > 0 else 0.0

    # Department breakdown
    departments = db.query(Department).all()
    dept_summaries = []

    icu_total = icu_avail = icu_occ = 0
    ed_total = ed_avail = ed_occ = 0
    gw_total = gw_avail = gw_occ = 0
    iso_total = iso_avail = iso_occ = 0

    for d in departments:
        d_beds = [b for b in beds if b.department_id == d.id]
        t = len(d_beds)
        a = sum(1 for b in d_beds if b.status == BedStatus.AVAILABLE.value)
        o = sum(1 for b in d_beds if b.status == BedStatus.OCCUPIED.value)
        c = sum(1 for b in d_beds if b.status == BedStatus.CLEANING.value)
        m = sum(1 for b in d_beds if b.status == BedStatus.MAINTENANCE.value)
        rate = round((o / t * 100), 1) if t > 0 else 0.0

        dept_summaries.append(DepartmentOccupancy(
            id=d.id,
            name=d.name,
            code=d.code,
            type=d.type,
            total_beds=t,
            available_beds=a,
            occupied_beds=o,
            cleaning_beds=c,
            maintenance_beds=m,
            occupancy_rate=rate
        ))

        if d.code == "ICU":
            icu_total, icu_avail, icu_occ = t, a, o
        elif d.code == "ED":
            ed_total, ed_avail, ed_occ = t, a, o
        elif d.code == "GW":
            gw_total, gw_avail, gw_occ = t, a, o
        elif d.code == "ISO":
            iso_total, iso_avail, iso_occ = t, a, o

    icu_rate = round((icu_occ / icu_total * 100), 1) if icu_total > 0 else 0.0
    ed_rate = round((ed_occ / ed_total * 100), 1) if ed_total > 0 else 0.0
    gw_rate = round((gw_occ / gw_total * 100), 1) if gw_total > 0 else 0.0
    iso_rate = round((iso_occ / iso_total * 100), 1) if iso_total > 0 else 0.0

    # Patients statistics
    all_patients = db.query(Patient).all()
    waiting_patients_list = [
        p for p in all_patients 
        if p.current_status in [PatientStatus.WAITING.value, PatientStatus.AWAITING_BED.value, PatientStatus.UNDER_ASSESSMENT.value]
    ]
    waiting_count = len(waiting_patients_list)
    critical_waiting = sum(1 for p in waiting_patients_list if p.priority == PriorityLevel.CRITICAL.value)

    # Average wait time in minutes
    now = datetime.now(timezone.utc)
    wait_minutes_list = []
    for p in waiting_patients_list:
        arr_time = p.arrival_time
        if arr_time.tzinfo is None:
            arr_time = arr_time.replace(tzinfo=timezone.utc)
        diff = (now - arr_time).total_seconds() / 60
        wait_minutes_list.append(max(0, diff))
    
    avg_wait = round(sum(wait_minutes_list) / len(wait_minutes_list), 1) if wait_minutes_list else 0.0

    return DashboardSummaryResponse(
        total_beds=total_beds,
        available_beds=available_beds,
        occupied_beds=occupied_beds,
        cleaning_beds=cleaning_beds,
        maintenance_beds=maintenance_beds,
        reserved_beds=reserved_beds,
        overall_occupancy_rate=overall_occ_rate,
        icu_occupancy_rate=icu_rate,
        emergency_occupancy_rate=ed_rate,
        general_ward_occupancy_rate=gw_rate,
        isolation_occupancy_rate=iso_rate,
        icu_total=icu_total,
        icu_available=icu_avail,
        icu_occupied=icu_occ,
        emergency_total=ed_total,
        emergency_available=ed_avail,
        emergency_occupied=ed_occ,
        total_patients=len(all_patients),
        waiting_patients=waiting_count,
        critical_patients_waiting=critical_waiting,
        average_wait_time_minutes=avg_wait,
        departments=dept_summaries
    )
