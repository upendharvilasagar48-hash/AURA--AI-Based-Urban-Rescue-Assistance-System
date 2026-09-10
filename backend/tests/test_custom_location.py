"""Unit tests for Customizable Patient Pickup Location and Custom Hospital features"""
import pytest
from fastapi.testclient import TestClient
from backend.main import app, sim_engine
from backend.geospatial.hyderabad_data import generate_corridor_waypoints, HYDERABAD_PICKUP_PRESETS

client = TestClient(app)

def test_location_presets_endpoint():
    res = client.get("/api/locations/presets")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["pickup_presets"]) >= 8
    preset_names = [p["name"] for p in data["pickup_presets"]]
    assert any("Boduppal" in n for n in preset_names)
    assert any("Uppal" in n for n in preset_names)
    assert any("Habsiguda" in n for n in preset_names)
    assert any("Banjara" in n for n in preset_names)

def test_generate_corridor_waypoints():
    wps = generate_corridor_waypoints(
        start_lat=17.4135,
        start_lng=78.5786,
        end_lat=17.4156,
        end_lng=78.4350,
        end_name="Banjara Hills Pickup"
    )
    assert len(wps) >= 3
    assert wps[0]["name"] == "Current Location"
    assert "Banjara Hills" in wps[-1]["name"]
    assert wps[-1]["lat"] == pytest.approx(17.4156, abs=0.001)

def test_update_patient_location_endpoint():
    payload = {
        "location_name": "Uppal Ring Road & Metro Station",
        "lat": 17.4019,
        "lng": 78.5602,
        "name": "K. Srinivas",
        "condition": "Severe Respiratory Distress",
        "vitals": {
            "heart_rate_bpm": 125,
            "blood_pressure": "130/85",
            "spo2_percent": 89
        }
    }
    res = client.post("/api/patient/location", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "Uppal Ring Road" in data["message"]
    
    # Verify telemetry snapshot reflects custom patient
    telemetry = data["telemetry"]
    assert telemetry["patient"]["location_name"] == "Uppal Ring Road & Metro Station"
    assert telemetry["patient"]["lat"] == 17.4019
    assert telemetry["patient"]["lng"] == 78.5602
    assert telemetry["patient"]["name"] == "K. Srinivas"
    assert telemetry["patient"]["vitals"]["spo2_percent"] == 89
    assert len(telemetry["navigation"]["waypoints"]) >= 2

def test_custom_hospital_endpoint():
    payload = {
        "name": "Apollo Hospitals Jubilee Hills",
        "locality": "Jubilee Hills",
        "lat": 17.4258,
        "lng": 78.4116,
        "type": "Super-Specialty Quaternary Care & Trauma",
        "emergency_beds_available": 16,
        "icu_beds_available": 6
    }
    res = client.post("/api/hospital/custom", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["hospital"]["hospital_name"] == "Apollo Hospitals Jubilee Hills"
    assert data["telemetry"]["hospital"]["name"] == "Apollo Hospitals Jubilee Hills"
