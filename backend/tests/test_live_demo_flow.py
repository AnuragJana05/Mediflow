import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def run_demo_flow():
    print("==================================================")
    print("      MediFlow End-to-End Live Demonstration     ")
    print("==================================================")

    # 1. Login as Attending Physician / Doctor
    print("\n[Step 1] Authenticating as Dr. Marcus Smith, MD (Attending Physician)...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "dr.smith@mediflow.health",
        "password": "doctor123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token_data = res.json()
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"  -> Authenticated. Role: {token_data['role']}, Name: {token_data['name']}")

    # 2. View Command Center Dashboard
    print("\n[Step 2] Querying Operations Command Center Dashboard KPIs...")
    res = requests.get(f"{BASE_URL}/dashboard", headers=headers)
    assert res.status_code == 200
    dash = res.json()
    print(f"  -> Total Beds: {dash['total_beds']}")
    print(f"  -> Available Beds: {dash['available_beds']}")
    print(f"  -> Occupied Beds: {dash['occupied_beds']}")
    print(f"  -> ICU Occupancy Rate: {dash['icu_occupancy_rate']}%")
    print(f"  -> Emergency Occupancy Rate: {dash['emergency_occupancy_rate']}%")
    print(f"  -> Patients Awaiting Bed: {dash['waiting_patients']} ({dash['critical_patients_waiting']} Critical)")

    # 3. Register New Emergency Patient
    print("\n[Step 3] Registering New Emergency Patient (Arthur Vance - Acute Hypoxemia)...")
    patient_payload = {
        "name": "Arthur Vance",
        "age": 63,
        "gender": "Male",
        "contact": "+1 (555) 789-2211",
        "emergency_contact": "Marian Vance (Wife): +1 (555) 789-2212",
        "symptoms": "Severe cyanosis, respiratory failure, acute respiratory distress syndrome (ARDS)",
        "oxygen_requirement": "Invasive",
        "heart_rate": 136,
        "spo2": 85,
        "blood_pressure_sys": 175,
        "blood_pressure_dia": 105,
        "temperature": 39.1,
        "mobility_requirement": "Stretcher",
        "isolation_requirement": "None",
        "required_equipment": "Ventilator, Cardiac Monitor",
        "department_requirement": "ICU"
    }
    res = requests.post(f"{BASE_URL}/patients", json=patient_payload, headers=headers)
    assert res.status_code == 201, f"Patient registration failed: {res.text}"
    patient = res.json()
    patient_id = patient["id"]
    print(f"  -> Patient Intake Registered: ID = {patient_id}")
    print(f"  -> Triage Engine Output: Priority = {patient['priority']}")
    print(f"  -> Contributing Factors: {patient.get('triage_factors', [])}")

    # 4. Run Smart Bed Matching Recommendation Engine
    print(f"\n[Step 4] Running Smart Bed Matching Recommendation Engine for {patient_id}...")
    res = requests.get(f"{BASE_URL}/recommendations?patient_id={patient_id}", headers=headers)
    assert res.status_code == 200
    recs = res.json()
    top_bed = recs.get("top_recommendation")
    assert top_bed is not None, "Expected at least one compatible bed match"
    print(f"  -> Top Recommended Bed: {top_bed['bed_id']} ({top_bed['ward_name']}, {top_bed['room']})")
    print(f"  -> Compatibility Score: {top_bed['compatibility_score']}%")
    print("  -> Matching Factors Verified:")
    for reason in top_bed["reasons"]:
        print(f"     [+] {reason}")
    print(f"  -> Inspected & Rejected Alternatives: {len(recs['unavailable_alternatives'])} beds")
    if recs["unavailable_alternatives"]:
        rejected_sample = recs["unavailable_alternatives"][0]
        print(f"     [-] Bed {rejected_sample['bed_id']} ({rejected_sample['status']}): {rejected_sample['rejection_reasons']}")

    # 5. Doctor Authorizes / Approves Allocation
    allocated_bed_id = top_bed["bed_id"]
    print(f"\n[Step 5] Doctor Approving Allocation of Bed {allocated_bed_id} to Patient {patient_id}...")
    res = requests.post(
        f"{BASE_URL}/recommendations/approve?patient_id={patient_id}",
        json={"bed_id": allocated_bed_id, "notes": "Approved by Attending Intensivist Marcus Smith"},
        headers=headers
    )
    assert res.status_code == 200, f"Approval failed: {res.text}"
    approval_result = res.json()
    print(f"  -> Allocation Approved! Status: {approval_result['status']}")

    # 6. Verify Bed Status Transition to Occupied
    print(f"\n[Step 6] Verifying Bed {allocated_bed_id} Status Transition...")
    res = requests.get(f"{BASE_URL}/beds/{allocated_bed_id}", headers=headers)
    assert res.status_code == 200
    bed_check = res.json()
    print(f"  -> Bed Status: {bed_check['status']}")
    print(f"  -> Current Patient: {bed_check['current_patient_name']} ({bed_check['current_patient_id']})")
    assert bed_check["status"] == "Occupied"

    # 7. Mass-Casualty / Surge Simulation Trigger
    print("\n[Step 7] Triggering Mass-Casualty Surge Simulator (Highway Collision Incident)...")
    res = requests.post(f"{BASE_URL}/simulation/surge", json={
        "scenario": "highway_collision",
        "patient_count": 14,
        "critical_ratio": 0.5
    }, headers=headers)
    assert res.status_code == 200
    surge_data = res.json()
    print(f"  -> Surge Incident: {surge_data['scenario_title']}")
    print(f"  -> Synthetic Patients Ingested: +{surge_data['incoming_patients_count']}")
    print(f"  -> Overall Hospital Capacity Spike: {surge_data['overall_hospital_capacity_after']}% ({surge_data['capacity_status']})")
    print(f"  -> Emergency Saturation: {surge_data['emergency_utilization_after']}%")
    print(f"  -> ICU Saturation: {surge_data['icu_utilization_after']}%")
    print(f"  -> Triggered Alerts: {len(surge_data['alerts_triggered'])}")
    for a in surge_data["alerts_triggered"]:
        print(f"     [!] {a}")

    # 8. Query Operations Alerts Center
    print("\n[Step 8] Verifying Operations Alert Center Triggered Alerts...")
    res = requests.get(f"{BASE_URL}/alerts", headers=headers)
    assert res.status_code == 200
    alerts = res.json()
    active_alerts = [a for a in alerts if a["status"] == "Active"]
    print(f"  -> Active Operations Alerts: {len(active_alerts)}")
    for a in active_alerts[:3]:
        print(f"     [*] [{a['severity']}] {a['title']}: {a['message']}")

    # 9. Verify Capacity Analytics
    print("\n[Step 9] Verifying Capacity Analytics Engine...")
    res = requests.get(f"{BASE_URL}/analytics?period=today", headers=headers)
    assert res.status_code == 200
    analytics = res.json()
    print(f"  -> Occupancy History Points: {len(analytics['occupancy_history'])}")
    print(f"  -> Department Utilizations Tracked: {len(analytics['department_utilization'])}")
    print(f"  -> Bed Turnover Velocity: {analytics['turnover_metrics']['bed_turnover_rate']}")

    # 10. Verify Immutable Audit Log Trail
    print("\n[Step 10] Checking Operations Audit Trail...")
    res = requests.get(f"{BASE_URL}/audit-logs?limit=5", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    print(f"  -> Recent Logged Events: {len(logs)}")
    for log in logs[:4]:
        print(f"     [LOG] {log['action']} on {log['entity']} {log['entity_id']} by {log['user_name']} ({log['user_role']})")

    # 11. Clean Revert: Reset Surge Simulation
    print("\n[Step 11] Resetting Surge Simulation (Restoring Baseline Demo Hospital State)...")
    res = requests.post(f"{BASE_URL}/simulation/reset", headers=headers)
    assert res.status_code == 200
    reset_data = res.json()
    print(f"  -> Simulation Reset Cleanly! Cleared {reset_data['cleared_patients']} synthetic records.")

    print("\n==================================================")
    print("   ALL 11 END-TO-END DEMO SCENARIO STEPS PASSED!  ")
    print("==================================================")

if __name__ == "__main__":
    run_demo_flow()
