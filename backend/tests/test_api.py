import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi.testclient import TestClient
from app.main import app
from app.algorithms.triage_engine import assess_patient_triage

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "MediFlow" in data["system"]
    assert "docs_url" in data

def test_login_success():
    response = client.post("/api/auth/login", json={
        "email": "dr.smith@mediflow.health",
        "password": "doctor123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == "doctor"
    assert data["name"] == "Dr. Marcus Smith, MD"

def test_login_invalid():
    response = client.post("/api/auth/login", json={
        "email": "dr.smith@mediflow.health",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_dashboard_kpis():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["total_beds"] >= 50
    assert data["available_beds"] > 0
    assert data["occupied_beds"] > 0
    assert "icu_occupancy_rate" in data
    assert len(data["departments"]) >= 5

def test_triage_engine_rules():
    # Critical case: Severe hypoxemia + invasive ventilation + cardiac arrest symptom
    crit = assess_patient_triage(
        spo2=82,
        heart_rate=145,
        bp_sys=80,
        bp_dia=50,
        temperature=39.2,
        symptoms="Acute respiratory failure, cyanosis",
        oxygen_requirement="Invasive"
    )
    assert crit["priority"] == "Critical"
    assert any("Hypoxemia" in f for f in crit["factors"])
    assert any("mechanical ventilation" in f for f in crit["factors"])

    # Low priority case: Normal vitals
    low = assess_patient_triage(
        spo2=99,
        heart_rate=72,
        bp_sys=120,
        bp_dia=80,
        temperature=36.8,
        symptoms="Minor laceration on finger, no acute distress"
    )
    assert low["priority"] == "Low"

def test_bed_recommendations_hero_case():
    # Hero case patient P-1024 (Lucas Montgomery - Critical COPD, needs ICU + Ventilator)
    response = client.get("/api/recommendations?patient_id=P-1024")
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "P-1024"
    assert len(data["recommendations"]) > 0
    top = data["top_recommendation"]
    assert top is not None
    assert top["has_ventilator"] is True
    assert top["compatibility_score"] >= 80
    assert len(top["reasons"]) > 0

def test_surge_simulation_and_reset():
    # 1. Trigger surge
    surge_res = client.post("/api/simulation/surge", json={
        "scenario": "highway_collision",
        "patient_count": 10,
        "critical_ratio": 0.5
    })
    assert surge_res.status_code == 200
    surge_data = surge_res.json()
    assert surge_data["incoming_patients_count"] == 10
    assert len(surge_data["alerts_triggered"]) > 0

    # 2. Reset surge
    reset_res = client.post("/api/simulation/reset")
    assert reset_res.status_code == 200
    reset_data = reset_res.json()
    assert reset_data["success"] is True

if __name__ == "__main__":
    print("Running MediFlow Test Suite...")
    test_root()
    print("[PASS] test_root")
    test_login_success()
    print("[PASS] test_login_success")
    test_login_invalid()
    print("[PASS] test_login_invalid")
    test_dashboard_kpis()
    print("[PASS] test_dashboard_kpis")
    test_triage_engine_rules()
    print("[PASS] test_triage_engine_rules")
    test_bed_recommendations_hero_case()
    print("[PASS] test_bed_recommendations_hero_case")
    test_surge_simulation_and_reset()
    print("[PASS] test_surge_simulation_and_reset")
    print("\nALL 7 TESTS PASSED SUCCESSFULLY!")
