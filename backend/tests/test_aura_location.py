"""Test Suite for AURA Live Ambulance Location & Movement Updates"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app, coordinator, sim_engine
from backend.geospatial.hyderabad_data import DEFAULT_PATIENT, HOSPITALS

@pytest.fixture
def client():
    return TestClient(app)

def test_simulation_tracking_mode_toggle():
    sim_engine.reset()
    assert sim_engine.tracking_mode == "DEMO"
    
    sim_engine.set_tracking_mode("REAL_GPS")
    assert sim_engine.tracking_mode == "REAL_GPS"
    assert sim_engine.is_running is False
    
    sim_engine.set_tracking_mode("DEMO")
    assert sim_engine.tracking_mode == "DEMO"

def test_update_real_location_coordinates_and_heading():
    sim_engine.reset()
    # Initial location at Boduppal
    start_lat = 17.4135
    start_lng = 78.5786
    sim_engine.update_real_location(lat=start_lat, lng=start_lng, speed_kmh=0.0, heading_deg=270.0)
    
    # Move towards Uppal
    new_lat = 17.4060
    new_lng = 78.5590
    snapshot = sim_engine.update_real_location(
        lat=new_lat, 
        lng=new_lng, 
        speed_kmh=42.0, 
        heading_deg=250.0, 
        accuracy=4.5,
        tracking_mode="REAL_GPS"
    )
    
    amb = snapshot["ambulance"]
    assert amb["lat"] == new_lat
    assert amb["lng"] == new_lng
    assert amb["speed_kmh"] == 42.0
    assert amb["heading_deg"] == 250.0
    assert amb["tracking_mode"] == "REAL_GPS"
    assert amb["gps_accuracy_m"] == 4.5
    assert amb["last_real_gps_time"] is not None
    
    # Check navigation distance and ETA recalculated
    nav = snapshot["navigation"]
    assert nav["distance_remaining_km"] > 0
    assert nav["eta_minutes"] > 0

def test_milestone_transition_near_patient():
    sim_engine.reset()
    coordinator.activate_emergency()
    assert coordinator.mission_agent.current_state == "EN_ROUTE_PATIENT"
    
    # Provide coordinates within 30 meters of the patient
    patient_lat = DEFAULT_PATIENT["lat"]
    patient_lng = DEFAULT_PATIENT["lng"]
    snapshot = sim_engine.update_real_location(
        lat=patient_lat + 0.0001,
        lng=patient_lng + 0.0001,
        speed_kmh=10.0,
        tracking_mode="REAL_GPS"
    )
    
    assert snapshot["mission_status"] in ["NEAR_PATIENT", "PATIENT_PICKED_UP"]

def test_milestone_transition_hospital_arrival():
    sim_engine.reset()
    coordinator.activate_emergency()
    coordinator.confirm_patient_pickup()
    assert coordinator.route_agent.phase == "TO_HOSPITAL"
    
    # Provide coordinates within 30 meters of Gandhi Hospital
    gandhi = HOSPITALS["HOSP-GANDHI"]
    snapshot = sim_engine.update_real_location(
        lat=gandhi["lat"] + 0.0001,
        lng=gandhi["lng"] + 0.0001,
        speed_kmh=5.0,
        tracking_mode="REAL_GPS"
    )
    
    assert snapshot["mission_status"] == "HOSPITAL_ARRIVAL"

def test_api_ambulance_location_endpoint(client):
    sim_engine.reset()
    payload = {
        "missionId": "MISSION-HYD-001",
        "ambulanceId": "AMB-108-HYD",
        "latitude": 17.4100,
        "longitude": 78.5650,
        "speed": 48.5,
        "heading": 280.0,
        "accuracy": 3.8,
        "trackingMode": "REAL_GPS"
    }
    
    response = client.post("/api/ambulance/location", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["telemetry"]["ambulance"]["lat"] == 17.41
    assert data["telemetry"]["ambulance"]["speed_kmh"] == 48.5

def test_api_ambulance_mode_endpoint(client):
    response = client.post("/api/ambulance/mode", json={"mode": "REAL_GPS"})
    assert response.status_code == 200
    assert response.json()["mode"] == "REAL_GPS"
    
    response2 = client.post("/api/ambulance/mode", json={"mode": "DEMO"})
    assert response2.status_code == 200
    assert response2.json()["mode"] == "DEMO"
