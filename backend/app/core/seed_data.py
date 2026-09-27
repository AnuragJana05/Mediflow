from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User, UserRole, UserStatus
from app.models.department import Department, Ward
from app.models.bed import Bed, BedStatus, BedType
from app.models.patient import Patient, PatientVitals, PriorityLevel, PatientStatus
from app.models.recommendation import BedAssignment, TriageAssessment
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.audit import AuditLog
from app.core.security import hash_password

def seed_database(db: Session):
    """Seed comprehensive realistic hospital operational dataset."""
    # Check if already seeded
    if db.query(User).first() is not None:
        return

    now = datetime.now(timezone.utc)

    # 1. Users (using verified precomputed bcrypt hashes for fast cold starts)
    admin_user = User(
        name="Dr. Sarah Chen",
        email="admin@mediflow.health",
        password_hash="$2b$12$dD1tGe6E7ge.a372ElwycefH5b.B.tG2AwyTcJfUzy2i.qklSPDKS",
        role=UserRole.ADMIN.value,
        department="Hospital Administration",
        status=UserStatus.ACTIVE.value
    )
    doctor_user = User(
        name="Dr. Marcus Smith, MD",
        email="dr.smith@mediflow.health",
        password_hash="$2b$12$vD3/o.1KS4Mz3Qs0wfo7duZgFO6v5Wv7pZy/WDsyQsUkUY2ufsZai",
        role=UserRole.DOCTOR.value,
        department="Intensive Care & Emergency Medicine",
        status=UserStatus.ACTIVE.value
    )
    nurse_user = User(
        name="Clara Evans, BSN RN",
        email="nurse.clara@mediflow.health",
        password_hash="$2b$12$Tf3oDFzjc2XWwhiDoxTsr.uUc8bME0A6wsEs7kM8LkdmAb1STD6zm",
        role=UserRole.NURSE.value,
        department="Triage & Bed Flow Management",
        status=UserStatus.ACTIVE.value
    )
    db.add_all([admin_user, doctor_user, nurse_user])
    db.commit()
    db.refresh(admin_user)
    db.refresh(doctor_user)
    db.refresh(nurse_user)

    # 2. Departments
    dept_icu = Department(code="ICU", name="Intensive Care Unit", type="ICU", capacity=12, head_doctor="Dr. Marcus Smith")
    dept_ed = Department(code="ED", name="Emergency Medicine", type="Emergency", capacity=14, head_doctor="Dr. Elena Rossi")
    dept_ccu = Department(code="CCU", name="Coronary Care Unit", type="Cardiac", capacity=8, head_doctor="Dr. James Patel")
    dept_gw = Department(code="GW", name="General Medical Ward", type="Inpatient", capacity=20, head_doctor="Dr. Robert Taylor")
    dept_iso = Department(code="ISO", name="Isolation & Infection Ward", type="Isolation", capacity=8, head_doctor="Dr. Anya Petrova")
    dept_surg = Department(code="SURG", name="Surgical Recovery", type="Surgical", capacity=10, head_doctor="Dr. David Kim")
    
    db.add_all([dept_icu, dept_ed, dept_ccu, dept_gw, dept_iso, dept_surg])
    db.commit()

    # 3. Wards
    ward_icu_a = Ward(department_id=dept_icu.id, name="ICU Pod Alpha (Critical)", floor="3rd Floor", capacity=6)
    ward_icu_b = Ward(department_id=dept_icu.id, name="ICU Pod Beta (Step-down)", floor="3rd Floor", capacity=6)
    ward_ed_resus = Ward(department_id=dept_ed.id, name="ED Resuscitation Bay", floor="Ground Floor", capacity=6)
    ward_ed_acute = Ward(department_id=dept_ed.id, name="ED Acute Observation", floor="Ground Floor", capacity=8)
    ward_ccu = Ward(department_id=dept_ccu.id, name="Cardiology Care Ward", floor="2nd Floor", capacity=8)
    ward_gw_east = Ward(department_id=dept_gw.id, name="East Medical Wing", floor="1st Floor", capacity=10)
    ward_gw_west = Ward(department_id=dept_gw.id, name="West Medical Wing", floor="1st Floor", capacity=10)
    ward_iso = Ward(department_id=dept_iso.id, name="Negative Pressure Suites", floor="4th Floor", capacity=8)
    ward_surg = Ward(department_id=dept_surg.id, name="Post-Op Recovery Ward", floor="2nd Floor", capacity=10)

    db.add_all([
        ward_icu_a, ward_icu_b, ward_ed_resus, ward_ed_acute, 
        ward_ccu, ward_gw_east, ward_gw_west, ward_iso, ward_surg
    ])
    db.commit()

    # 4. Beds (72 Beds across all departments)
    beds_to_create = []

    # ICU Pod Alpha (ICU-01 to ICU-06)
    for i in range(1, 7):
        status = BedStatus.OCCUPIED.value if i in [1, 2, 4, 5] else (BedStatus.AVAILABLE.value if i == 3 else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"ICU-0{i}",
            ward_id=ward_icu_a.id,
            department_id=dept_icu.id,
            bed_type=BedType.ICU.value,
            status=status,
            floor="3rd Floor",
            room=f"Suite 30{i}",
            has_oxygen=True,
            has_ventilator=True,
            has_cardiac_monitor=True,
            has_isolation=(i == 1),
            has_infusion_pump=True
        ))

    # ICU Pod Beta (ICU-07 to ICU-12)
    for i in range(7, 13):
        # ICU-07 is deliberately available for demo matching!
        status = BedStatus.AVAILABLE.value if i in [7, 10] else (BedStatus.OCCUPIED.value if i in [8, 9, 11] else BedStatus.MAINTENANCE.value)
        beds_to_create.append(Bed(
            id=f"ICU-{i:02d}",
            ward_id=ward_icu_b.id,
            department_id=dept_icu.id,
            bed_type=BedType.ICU.value,
            status=status,
            floor="3rd Floor",
            room=f"Suite 3{i:02d}",
            has_oxygen=True,
            has_ventilator=True,
            has_cardiac_monitor=True,
            has_isolation=False,
            has_infusion_pump=True
        ))

    # ED Resuscitation (ED-01 to ED-06)
    for i in range(1, 7):
        status = BedStatus.OCCUPIED.value if i in [1, 3, 5] else (BedStatus.AVAILABLE.value if i in [2, 4] else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"ED-0{i}",
            ward_id=ward_ed_resus.id,
            department_id=dept_ed.id,
            bed_type=BedType.ER.value,
            status=status,
            floor="Ground Floor",
            room=f"Resus Bay {i}",
            has_oxygen=True,
            has_ventilator=(i in [1, 2, 3]),
            has_cardiac_monitor=True,
            has_isolation=False,
            has_infusion_pump=True
        ))

    # ED Acute Observation (ED-07 to ED-14)
    for i in range(7, 15):
        status = BedStatus.OCCUPIED.value if i in [7, 8, 10, 12] else (BedStatus.AVAILABLE.value if i in [9, 11, 13] else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"ED-{i:02d}",
            ward_id=ward_ed_acute.id,
            department_id=dept_ed.id,
            bed_type=BedType.ER.value,
            status=status,
            floor="Ground Floor",
            room=f"Acute Bay {i}",
            has_oxygen=True,
            has_ventilator=False,
            has_cardiac_monitor=True,
            has_isolation=False,
            has_infusion_pump=True
        ))

    # CCU Ward (CCU-01 to CCU-08)
    for i in range(1, 9):
        status = BedStatus.OCCUPIED.value if i in [1, 2, 4, 6] else (BedStatus.AVAILABLE.value if i in [3, 5] else (BedStatus.RESERVED.value if i == 7 else BedStatus.MAINTENANCE.value))
        beds_to_create.append(Bed(
            id=f"CCU-0{i}",
            ward_id=ward_ccu.id,
            department_id=dept_ccu.id,
            bed_type=BedType.CCU.value,
            status=status,
            floor="2nd Floor",
            room=f"Room 20{i}",
            has_oxygen=True,
            has_ventilator=(i in [1, 2, 5]),
            has_cardiac_monitor=True,
            has_isolation=False,
            has_infusion_pump=True
        ))

    # General Ward East (GW-101 to GW-110)
    for i in range(1, 11):
        status = BedStatus.OCCUPIED.value if i in [1, 2, 3, 6, 7] else (BedStatus.AVAILABLE.value if i in [4, 5, 8, 9] else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"GW-{100+i}",
            ward_id=ward_gw_east.id,
            department_id=dept_gw.id,
            bed_type=BedType.STANDARD.value,
            status=status,
            floor="1st Floor",
            room=f"Ward E-{i}",
            has_oxygen=(i % 2 == 1), # alternating oxygen ports
            has_ventilator=False,
            has_cardiac_monitor=(i in [1, 4]),
            has_isolation=False,
            has_infusion_pump=True
        ))

    # General Ward West (GW-111 to GW-120)
    for i in range(11, 21):
        status = BedStatus.OCCUPIED.value if i in [11, 13, 14, 17, 18] else (BedStatus.AVAILABLE.value if i in [12, 15, 16, 19] else BedStatus.MAINTENANCE.value)
        beds_to_create.append(Bed(
            id=f"GW-{100+i}",
            ward_id=ward_gw_west.id,
            department_id=dept_gw.id,
            bed_type=BedType.STANDARD.value,
            status=status,
            floor="1st Floor",
            room=f"Ward W-{i-10}",
            has_oxygen=True,
            has_ventilator=False,
            has_cardiac_monitor=False,
            has_isolation=False,
            has_infusion_pump=True
        ))

    # Isolation Ward (ISO-01 to ISO-08)
    for i in range(1, 9):
        status = BedStatus.OCCUPIED.value if i in [1, 2, 4] else (BedStatus.AVAILABLE.value if i in [3, 5, 6] else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"ISO-0{i}",
            ward_id=ward_iso.id,
            department_id=dept_iso.id,
            bed_type=BedType.ISOLATION.value,
            status=status,
            floor="4th Floor",
            room=f"Negative Pressure {i}",
            has_oxygen=True,
            has_ventilator=(i in [1, 3, 5]),
            has_cardiac_monitor=True,
            has_isolation=True,
            has_infusion_pump=True
        ))

    # Surgical Recovery (SURG-01 to SURG-10)
    for i in range(1, 11):
        status = BedStatus.OCCUPIED.value if i in [1, 2, 4, 5, 7] else (BedStatus.AVAILABLE.value if i in [3, 6, 8, 9] else BedStatus.CLEANING.value)
        beds_to_create.append(Bed(
            id=f"SURG-{i:02d}",
            ward_id=ward_surg.id,
            department_id=dept_surg.id,
            bed_type=BedType.STEP_DOWN.value,
            status=status,
            floor="2nd Floor",
            room=f"Post-Op {i}",
            has_oxygen=True,
            has_ventilator=(i == 1),
            has_cardiac_monitor=True,
            has_isolation=False,
            has_infusion_pump=True
        ))

    db.add_all(beds_to_create)
    db.commit()

    # 5. Patients (Admitted patients + Waiting patients awaiting bed allocation)
    patients_data = [
        # Admitted ICU patients
        {
            "id": "P-1001",
            "name": "Evelyn Harper",
            "age": 68,
            "gender": "Female",
            "contact": "+1 (555) 234-8901",
            "emergency_contact": "David Harper (Son): +1 (555) 234-8902",
            "arrival_time": now - timedelta(hours=14),
            "symptoms": "Post cardiac bypass surgery, mild hypoxemia, telemetry required",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 84,
            "spo2": 96,
            "blood_pressure_sys": 128,
            "blood_pressure_dia": 78,
            "temperature": 37.1,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "ICU",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "ICU-01",
            "admitted_at": now - timedelta(hours=12)
        },
        {
            "id": "P-1002",
            "name": "Arthur Pendelton",
            "age": 74,
            "gender": "Male",
            "contact": "+1 (555) 345-6712",
            "emergency_contact": "Grace Pendelton (Wife): +1 (555) 345-6713",
            "arrival_time": now - timedelta(hours=22),
            "symptoms": "Acute respiratory distress syndrome (ARDS), mechanical ventilation",
            "oxygen_requirement": "Invasive",
            "heart_rate": 105,
            "spo2": 91,
            "blood_pressure_sys": 110,
            "blood_pressure_dia": 70,
            "temperature": 38.6,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Ventilator, Cardiac Monitor, Infusion Pump",
            "department_requirement": "ICU",
            "priority": PriorityLevel.CRITICAL.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "ICU-02",
            "admitted_at": now - timedelta(hours=20)
        },
        {
            "id": "P-1003",
            "name": "Maria Gonzales",
            "age": 52,
            "gender": "Female",
            "contact": "+1 (555) 456-7890",
            "emergency_contact": "Carlos Gonzales (Brother): +1 (555) 456-7891",
            "arrival_time": now - timedelta(hours=8),
            "symptoms": "Severe septic shock, IV vasopressors running, arterial line",
            "oxygen_requirement": "High Flow",
            "heart_rate": 122,
            "spo2": 93,
            "blood_pressure_sys": 88,
            "blood_pressure_dia": 54,
            "temperature": 39.2,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "ICU",
            "priority": PriorityLevel.CRITICAL.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "ICU-04",
            "admitted_at": now - timedelta(hours=7)
        },

        # Admitted CCU patients
        {
            "id": "P-1004",
            "name": "Robert Vance",
            "age": 61,
            "gender": "Male",
            "contact": "+1 (555) 567-8901",
            "emergency_contact": "Phyllis Vance (Wife): +1 (555) 567-8902",
            "arrival_time": now - timedelta(hours=18),
            "symptoms": "Acute ST-elevation myocardial infarction post stent placement",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 78,
            "spo2": 97,
            "blood_pressure_sys": 122,
            "blood_pressure_dia": 80,
            "temperature": 36.9,
            "mobility_requirement": "Wheelchair",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor",
            "department_requirement": "Cardiology",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "CCU-01",
            "admitted_at": now - timedelta(hours=16)
        },

        # Admitted Isolation patients
        {
            "id": "P-1005",
            "name": "Samuel Zhang",
            "age": 39,
            "gender": "Male",
            "contact": "+1 (555) 678-9012",
            "emergency_contact": "Mei Zhang (Spouse): +1 (555) 678-9013",
            "arrival_time": now - timedelta(hours=15),
            "symptoms": "Active Pulmonary Tuberculosis, hemoptysis, airborne precautions",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 88,
            "spo2": 94,
            "blood_pressure_sys": 118,
            "blood_pressure_dia": 76,
            "temperature": 38.4,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "Airborne",
            "required_equipment": "Infusion Pump",
            "department_requirement": "Isolation",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "ISO-01",
            "admitted_at": now - timedelta(hours=13)
        },

        # Admitted General Ward
        {
            "id": "P-1006",
            "name": "Dorothy Miller",
            "age": 79,
            "gender": "Female",
            "contact": "+1 (555) 789-0123",
            "emergency_contact": "Brian Miller (Son): +1 (555) 789-0124",
            "arrival_time": now - timedelta(days=2),
            "symptoms": "Community-acquired pneumonia, IV ceftriaxone therapy",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 82,
            "spo2": 95,
            "blood_pressure_sys": 130,
            "blood_pressure_dia": 82,
            "temperature": 37.4,
            "mobility_requirement": "Wheelchair",
            "isolation_requirement": "None",
            "required_equipment": "Infusion Pump",
            "department_requirement": "General Ward",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "GW-101",
            "admitted_at": now - timedelta(days=2)
        },

        # WAITING / AWAITING BED PATIENTS (Ready for triage & smart allocation demo!)
        {
            "id": "P-1020",
            "name": "Jordan Hayes",
            "age": 58,
            "gender": "Male",
            "contact": "+1 (555) 890-1234",
            "emergency_contact": "Laura Hayes (Daughter): +1 (555) 890-1235",
            "arrival_time": now - timedelta(minutes=45),
            "symptoms": "Severe acute hypoxic respiratory failure, cyanosis, stridor",
            "oxygen_requirement": "Invasive",
            "heart_rate": 138,
            "spo2": 84,
            "blood_pressure_sys": 175,
            "blood_pressure_dia": 105,
            "temperature": 39.1,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Ventilator, Cardiac Monitor",
            "department_requirement": "ICU",
            "priority": PriorityLevel.CRITICAL.value,
            "current_status": PatientStatus.AWAITING_BED.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1021",
            "name": "Amina Al-Mansoor",
            "age": 45,
            "gender": "Female",
            "contact": "+1 (555) 901-2345",
            "emergency_contact": "Tariq Al-Mansoor (Husband): +1 (555) 901-2346",
            "arrival_time": now - timedelta(minutes=70),
            "symptoms": "Crushing substernal chest pain radiating to left arm, diaphoresis",
            "oxygen_requirement": "High Flow",
            "heart_rate": 115,
            "spo2": 91,
            "blood_pressure_sys": 188,
            "blood_pressure_dia": 112,
            "temperature": 37.2,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "Emergency",
            "priority": PriorityLevel.CRITICAL.value,
            "current_status": PatientStatus.AWAITING_BED.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1022",
            "name": "Leo Sterling",
            "age": 29,
            "gender": "Male",
            "contact": "+1 (555) 012-3456",
            "emergency_contact": "Hannah Sterling (Sister): +1 (555) 012-3457",
            "arrival_time": now - timedelta(minutes=30),
            "symptoms": "Suspected meningococcal infection, high fever, purpuric rash, photophobia",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 112,
            "spo2": 95,
            "blood_pressure_sys": 102,
            "blood_pressure_dia": 68,
            "temperature": 39.8,
            "mobility_requirement": "Wheelchair",
            "isolation_requirement": "Droplet",
            "required_equipment": "Infusion Pump",
            "department_requirement": "Isolation",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.AWAITING_BED.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1023",
            "name": "Beatrice Campbell",
            "age": 64,
            "gender": "Female",
            "contact": "+1 (555) 123-4567",
            "emergency_contact": "Gordon Campbell (Husband): +1 (555) 123-4568",
            "arrival_time": now - timedelta(minutes=90),
            "symptoms": "Uncontrolled type-2 diabetic ketoacidosis, moderate dehydration",
            "oxygen_requirement": "None",
            "heart_rate": 96,
            "spo2": 97,
            "blood_pressure_sys": 134,
            "blood_pressure_dia": 86,
            "temperature": 37.3,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "Infusion Pump",
            "department_requirement": "General Ward",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.WAITING.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1024", # The hero demo patient mentioned in PRD section 7 & 8!
            "name": "Lucas Montgomery",
            "age": 54,
            "gender": "Male",
            "contact": "+1 (555) 876-5432",
            "emergency_contact": "Sarah Montgomery (Wife): +1 (555) 876-5433",
            "arrival_time": now - timedelta(minutes=20),
            "symptoms": "Severe acute respiratory distress, cyanosis, history of COPD exacerbation",
            "oxygen_requirement": "Invasive",
            "heart_rate": 132,
            "spo2": 86,
            "blood_pressure_sys": 168,
            "blood_pressure_dia": 102,
            "temperature": 38.9,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Ventilator, Cardiac Monitor",
            "department_requirement": "ICU",
            "priority": PriorityLevel.CRITICAL.value,
            "current_status": PatientStatus.AWAITING_BED.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1025",
            "name": "Clara Watson",
            "age": 31,
            "gender": "Female",
            "contact": "+1 (555) 987-6543",
            "emergency_contact": "Mark Watson: +1 (555) 987-6544",
            "arrival_time": now - timedelta(minutes=15),
            "symptoms": "Right lower quadrant abdominal pain, nausea, suspected appendicitis",
            "oxygen_requirement": "None",
            "heart_rate": 86,
            "spo2": 99,
            "blood_pressure_sys": 118,
            "blood_pressure_dia": 76,
            "temperature": 37.8,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "",
            "department_requirement": "Surgical Recovery",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.UNDER_ASSESSMENT.value,
            "assigned_bed_id": None
        },
        # Additional Realistic Inpatients & Waiting Cases
        {
            "id": "P-1007",
            "name": "Raymond Flores",
            "age": 47,
            "gender": "Male",
            "contact": "+1 (555) 321-7654",
            "emergency_contact": "Elena Flores: +1 (555) 321-7655",
            "arrival_time": now - timedelta(days=1, hours=4),
            "symptoms": "Post laparoscopic cholecystectomy, stable recovery, oral analgesia",
            "oxygen_requirement": "None",
            "heart_rate": 72,
            "spo2": 98,
            "blood_pressure_sys": 120,
            "blood_pressure_dia": 78,
            "temperature": 36.8,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "Infusion Pump",
            "department_requirement": "Surgical Recovery",
            "priority": PriorityLevel.LOW.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "SURG-01",
            "admitted_at": now - timedelta(days=1, hours=3)
        },
        {
            "id": "P-1008",
            "name": "Grace O'Connor",
            "age": 82,
            "gender": "Female",
            "contact": "+1 (555) 432-8765",
            "emergency_contact": "Patrick O'Connor: +1 (555) 432-8766",
            "arrival_time": now - timedelta(hours=36),
            "symptoms": "Congestive heart failure exacerbation, IV furosemide diuresis",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 86,
            "spo2": 94,
            "blood_pressure_sys": 142,
            "blood_pressure_dia": 88,
            "temperature": 37.0,
            "mobility_requirement": "Wheelchair",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "Cardiology",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "CCU-02",
            "admitted_at": now - timedelta(hours=34)
        },
        {
            "id": "P-1009",
            "name": "Dante Rossi",
            "age": 63,
            "gender": "Male",
            "contact": "+1 (555) 543-9876",
            "emergency_contact": "Lucia Rossi: +1 (555) 543-9877",
            "arrival_time": now - timedelta(hours=10),
            "symptoms": "Acute pancreatitis, epigastric pain radiating to back, NPO, aggressive IV fluids",
            "oxygen_requirement": "None",
            "heart_rate": 92,
            "spo2": 97,
            "blood_pressure_sys": 132,
            "blood_pressure_dia": 84,
            "temperature": 37.6,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "Infusion Pump",
            "department_requirement": "General Ward",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "GW-102",
            "admitted_at": now - timedelta(hours=9)
        },
        {
            "id": "P-1010",
            "name": "Nadia Volkov",
            "age": 27,
            "gender": "Female",
            "contact": "+1 (555) 654-0987",
            "emergency_contact": "Mikhail Volkov: +1 (555) 654-0988",
            "arrival_time": now - timedelta(hours=6),
            "symptoms": "Severe acute asthma exacerbation, refractory to albuterol, wheezing",
            "oxygen_requirement": "High Flow",
            "heart_rate": 118,
            "spo2": 91,
            "blood_pressure_sys": 138,
            "blood_pressure_dia": 88,
            "temperature": 37.2,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "Emergency",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "ED-01",
            "admitted_at": now - timedelta(hours=5)
        },
        {
            "id": "P-1011",
            "name": "Kenneth Wright",
            "age": 70,
            "gender": "Male",
            "contact": "+1 (555) 765-1098",
            "emergency_contact": "Ruth Wright: +1 (555) 765-1099",
            "arrival_time": now - timedelta(days=3),
            "symptoms": "Elective total hip arthroplasty, physical therapy recovery",
            "oxygen_requirement": "None",
            "heart_rate": 74,
            "spo2": 98,
            "blood_pressure_sys": 126,
            "blood_pressure_dia": 80,
            "temperature": 36.7,
            "mobility_requirement": "Wheelchair",
            "isolation_requirement": "None",
            "required_equipment": "",
            "department_requirement": "Surgical Recovery",
            "priority": PriorityLevel.LOW.value,
            "current_status": PatientStatus.ADMITTED.value,
            "assigned_bed_id": "SURG-02",
            "admitted_at": now - timedelta(days=3)
        },
        {
            "id": "P-1012",
            "name": "Sunita Sharma",
            "age": 41,
            "gender": "Female",
            "contact": "+1 (555) 876-2109",
            "emergency_contact": "Raj Sharma: +1 (555) 876-2110",
            "arrival_time": now - timedelta(hours=50),
            "symptoms": "Acute pyelonephritis, IV ampicillin/gentamicin, fever settling",
            "oxygen_requirement": "None",
            "heart_rate": 78,
            "spo2": 99,
            "blood_pressure_sys": 116,
            "blood_pressure_dia": 74,
            "temperature": 37.1,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "Infusion Pump",
            "department_requirement": "General Ward",
            "priority": PriorityLevel.LOW.value,
            "current_status": PatientStatus.DISCHARGED.value,
            "assigned_bed_id": None,
            "discharged_at": now - timedelta(hours=2)
        },
        {
            "id": "P-1013",
            "name": "Hassan Tariq",
            "age": 35,
            "gender": "Male",
            "contact": "+1 (555) 987-3210",
            "emergency_contact": "Fatima Tariq: +1 (555) 987-3211",
            "arrival_time": now - timedelta(minutes=55),
            "symptoms": "Left temporal scalp laceration, brief syncopal episode, GCS 15",
            "oxygen_requirement": "None",
            "heart_rate": 82,
            "spo2": 98,
            "blood_pressure_sys": 128,
            "blood_pressure_dia": 82,
            "temperature": 36.9,
            "mobility_requirement": "Ambulatory",
            "isolation_requirement": "None",
            "required_equipment": "",
            "department_requirement": "Emergency",
            "priority": PriorityLevel.MEDIUM.value,
            "current_status": PatientStatus.WAITING.value,
            "assigned_bed_id": None
        },
        {
            "id": "P-1014",
            "name": "Valerie Jenkins",
            "age": 67,
            "gender": "Female",
            "contact": "+1 (555) 098-4321",
            "emergency_contact": "Thomas Jenkins: +1 (555) 098-4322",
            "arrival_time": now - timedelta(minutes=110),
            "symptoms": "Unexplained syncope, atrial fibrillation with rapid ventricular response",
            "oxygen_requirement": "Low Flow",
            "heart_rate": 128,
            "spo2": 95,
            "blood_pressure_sys": 105,
            "blood_pressure_dia": 68,
            "temperature": 37.0,
            "mobility_requirement": "Stretcher",
            "isolation_requirement": "None",
            "required_equipment": "Cardiac Monitor, Infusion Pump",
            "department_requirement": "Cardiology",
            "priority": PriorityLevel.HIGH.value,
            "current_status": PatientStatus.AWAITING_BED.value,
            "assigned_bed_id": None
        }
    ]

    for pdata in patients_data:
        p = Patient(**pdata)
        db.add(p)
        db.flush()

        # Add initial vitals record
        v = PatientVitals(
            patient_id=p.id,
            timestamp=p.arrival_time,
            spo2=p.spo2,
            heart_rate=p.heart_rate,
            blood_pressure_sys=p.blood_pressure_sys,
            blood_pressure_dia=p.blood_pressure_dia,
            temperature=p.temperature,
            notes="Initial triage intake vitals"
        )
        db.add(v)

        # Update bed current_patient_id if assigned
        if p.assigned_bed_id:
            bed = db.query(Bed).filter(Bed.id == p.assigned_bed_id).first()
            if bed:
                bed.current_patient_id = p.id
                assignment = BedAssignment(
                    patient_id=p.id,
                    bed_id=bed.id,
                    assigned_by_id=doctor_user.id,
                    assigned_at=p.admitted_at or now,
                    status="Active",
                    notes="Direct clinician allocation on admission"
                )
                db.add(assignment)

    db.commit()

    # 6. Active Alerts
    alert1 = Alert(
        type="ICU_CAPACITY",
        severity=AlertSeverity.HIGH.value,
        title="ICU Occupancy Elevated",
        message="ICU bed occupancy has reached 75%. 3 beds currently available in Pod Beta.",
        department="Intensive Care Unit",
        status=AlertStatus.ACTIVE.value,
        created_at=now - timedelta(minutes=40)
    )
    alert2 = Alert(
        type="CRITICAL_WAITING",
        severity=AlertSeverity.CRITICAL.value,
        title="Critical Patient P-1024 Awaiting Bed",
        message="Patient P-1024 (Lucas Montgomery) with SpO2 86% requires urgent ICU bed with ventilator support.",
        department="Hospital Operations",
        status=AlertStatus.ACTIVE.value,
        created_at=now - timedelta(minutes=18)
    )
    alert3 = Alert(
        type="MAINTENANCE_OFFLINE",
        severity=AlertSeverity.MEDIUM.value,
        title="Bed ICU-12 Offline for Scheduled Calibration",
        message="Bed ICU-12 ventilator and pressure sensors undergoing bi-weekly biomedical calibration.",
        department="Biomedical Engineering",
        status=AlertStatus.ACTIVE.value,
        created_at=now - timedelta(hours=3)
    )
    db.add_all([alert1, alert2, alert3])
    db.commit()

    # 7. Initial Audit Trail
    audit_events = [
        AuditLog(
            user_name="Dr. Sarah Chen",
            user_role="admin",
            action="SYSTEM_INITIALIZED",
            entity="System",
            entity_id="SYS-01",
            details="MediFlow hospital capacity and resource tracking system loaded baseline operational data",
            timestamp=now - timedelta(hours=24)
        ),
        AuditLog(
            user_name="Dr. Marcus Smith, MD",
            user_role="doctor",
            action="BED_ASSIGNMENT_APPROVED",
            entity="Bed",
            entity_id="ICU-02",
            old_value="Available",
            new_value="Occupied",
            details="Approved bed allocation for patient P-1002 (Arthur Pendelton, ARDS requiring mechanical ventilation)",
            timestamp=now - timedelta(hours=20)
        ),
        AuditLog(
            user_name="Clara Evans, BSN RN",
            user_role="nurse",
            action="PATIENT_REGISTERED",
            entity="Patient",
            entity_id="P-1024",
            details="Emergency intake registered: Lucas Montgomery, Priority assessed as CRITICAL by triage engine",
            timestamp=now - timedelta(minutes=20)
        )
    ]
    db.add_all(audit_events)
    db.commit()
