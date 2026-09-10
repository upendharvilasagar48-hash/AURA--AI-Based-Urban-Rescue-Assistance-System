"""Automated Test Suite for AURA Emergency Assistance System
Validates multi-agent coordination, road vs building 50m filtering,
voice intent classification, route switching, and simulation mechanics.
"""
import pytest
from backend.agents.coordinator import AuraCoordinator
from backend.agents.route_agent import RouteAgent
from backend.agents.traffic_agent import TrafficAgent
from backend.agents.road_safety_agent import RoadSafetyAgent
from backend.agents.voice_agent import VoiceAgent
from backend.agents.hospital_agent import HospitalAgent
from backend.agents.mission_agent import MissionAgent
from backend.simulation.sim_engine import SimulationEngine
from backend.geospatial.hyderabad_data import haversine_distance

def test_mission_state_transitions():
    agent = MissionAgent()
    assert agent.current_state == "IDLE"
    
    agent.activate_emergency()
    assert agent.current_state == "EN_ROUTE_PATIENT"
    assert agent.get_status()["is_emergency_active"] is True

    agent.mark_near_patient(45.0)
    assert agent.current_state == "NEAR_PATIENT"

    agent.confirm_patient_pickup()
    assert agent.current_state == "EN_ROUTE_HOSPITAL"

    agent.mark_hospital_arrival()
    assert agent.current_state == "HOSPITAL_ARRIVAL"

    agent.complete_mission()
    assert agent.current_state == "MISSION_COMPLETED"
    assert agent.get_status()["is_emergency_active"] is False

def test_haversine_distance():
    # Boduppal to Uppal is roughly 2.3km
    p1 = (17.4135, 78.5786)
    p2 = (17.4019, 78.5602)
    dist = haversine_distance(p1, p2)
    assert 2000.0 < dist < 2600.0

def test_route_switching_under_congestion():
    coordinator = AuraCoordinator()
    coordinator.activate_emergency()
    assert coordinator.route_agent.active_route_type == "PRIMARY"

    # Inject gridlock at Uppal Circle
    coordinator.traffic_agent.set_junction_traffic(
        "J1_UPPAL",
        congestion_level="GRIDLOCK",
        congestion_index=95,
        delay_minutes=5.0
    )

    # Run coordinator cycle with ambulance approaching Uppal
    uppal_approach_lat = 17.4050
    uppal_approach_lng = 78.5640
    coordinator.run_cycle(uppal_approach_lat, uppal_approach_lng, speed_kmh=45.0)

    # Coordinator should have switched to Nacharam Alternate route
    assert coordinator.route_agent.active_route_type == "ALTERNATE"
    assert "Uppal" in coordinator.last_decision_explanation or "Nacharam" in coordinator.last_decision_explanation

def test_road_only_50m_geofence_logic():
    """CRITICAL TEST: Ensures road users get alerted, while inside-building devices are filtered out."""
    safety_agent = RoadSafetyAgent()

    # Ambulance location near Uppal test coordinate
    amb_lat = 17.4020
    amb_lng = 78.5600

    # Device 1: On-road vehicle (Hyundai Ioniq at 17.4022, 78.5599) - within ~25 meters
    # Device 2: Inside Sneha Enclave building (at 17.4021, 78.5604) - within ~45 meters
    results = safety_agent.evaluate_devices(amb_lat, amb_lng)

    car_device = next(d for d in results if d["device_id"] == "V-101-CAR")
    bld_device = next(d for d in results if d["device_id"] == "BLD-APT-UPPAL")

    # Both are within 50 meters
    assert car_device["distance_to_ambulance_m"] <= 50.0
    assert bld_device["distance_to_ambulance_m"] <= 50.0

    # Car must be alerted
    assert car_device["alert_status"] == "ALERT_DISPATCHED"
    assert car_device["play_emergency_sound"] is True

    # Building resident must be filtered out / suppressed
    assert bld_device["alert_status"] == "FILTERED_OUT_BUILDING"
    assert bld_device["play_emergency_sound"] is False
    assert "suppressed" in bld_device["warning_message"].lower()

def test_voice_agent_intent_categories():
    voice = VoiceAgent()
    context = {
        "mission_status": "EN_ROUTE_PATIENT",
        "speed_kmh": 52.0,
        "current_route_name": "Nacharam Bypass",
        "next_waypoint_name": "Tarnaka Hub",
        "distance_remaining_km": 3.4,
        "eta_minutes": 4.8,
        "active_hospital_name": "Gandhi Hospital",
        "hospital_emergency_beds": 14,
        "active_road_alerts": 1,
        "suppressed_building_alerts": 2,
        "route_changed_reason": "Congestion at Uppal"
    }

    # 1. Emergency
    res = voice.generate_response("activate emergency mode", context)
    assert res["category"] == "Emergency"
    assert res["intent"] == "emergency_control_activate"

    # 2. Navigation / ETA
    res = voice.generate_response("what's our hospital eta?", context)
    assert res["category"] == "Hospital"
    assert res["intent"] == "hospital_eta"
    assert "4.8" in res["response_text"] or "ETA" in res["response_text"] or "minutes" in res["response_text"]

    # 3. Explainability
    res = voice.generate_response("why did you change the route?", context)
    assert res["category"] == "Route"
    assert res["intent"] == "route_change_reason"
    assert "Congestion at Uppal" in res["response_text"] or "bypass" in res["response_text"]

    # 4. Traffic
    res = voice.generate_response("where is the nearest congestion?", context)
    assert res["category"] == "Traffic"
    assert res["intent"] == "traffic_location"

    # 5. Nearby Vehicles
    res = voice.generate_response("how many vehicles are nearby?", context)
    assert res["category"] == "Nearby Vehicles"
    assert res["intent"] == "nearby_vehicle_count"

    # 6. Hospital
    res = voice.generate_response("which hospital are we going to?", context)
    assert res["category"] == "Hospital"
    assert res["intent"] == "hospital_destination"
    assert "Gandhi Hospital" in res["response_text"]

    # 7. Natural language variations
    res1 = voice.generate_response("When will we reach the hospital?", context)
    res2 = voice.generate_response("What's our hospital ETA?", context)
    assert res1["intent"] == "hospital_eta"
    assert res2["intent"] == "hospital_eta"

def test_hospital_diversion():
    hospital_agent = HospitalAgent()
    active = hospital_agent.get_active_hospital()
    assert active["id"] == "HOSP-GANDHI"

    res = hospital_agent.switch_hospital("HOSP-YASHODA")
    assert res["success"] is True
    assert hospital_agent.get_active_hospital()["name"] == "Yashoda Hospital Secunderabad"

def test_simulation_engine_tick():
    coordinator = AuraCoordinator()
    coordinator.activate_emergency()
    sim = SimulationEngine(coordinator)
    sim.play()

    init_lat = sim.ambulance_lat
    init_lng = sim.ambulance_lng

    snapshot = sim.tick()
    assert snapshot["mission_status"] == "EN_ROUTE_PATIENT"
    assert snapshot["ambulance"]["speed_kmh"] > 0
    # Coordinates should have updated or started progressing
    assert "navigation" in snapshot
    assert "road_safety" in snapshot
    assert "agents" in snapshot
