"""Comprehensive Automated Test Suite for AURA Voice & NLU Engine
Tests all 100+ natural questions and variations across 18 intent categories,
conversational context follow-ups, and live simulation telemetry data bindings.
"""
import pytest
from backend.agents.voice_agent import VoiceAgent
from backend.agents.coordinator import AuraCoordinator
from backend.simulation.sim_engine import SimulationEngine

@pytest.fixture
def voice_agent():
    return VoiceAgent()

@pytest.fixture
def mock_context():
    return {
        "mission_status": "EN_ROUTE_PATIENT",
        "phase": "TO_PATIENT",
        "speed_kmh": 54.0,
        "ambulance_lat": 17.4172,
        "ambulance_lng": 78.5412,
        "current_route_name": "Uppal-Habsiguda Corridor",
        "active_route_type": "PRIMARY",
        "next_waypoint_name": "Habsiguda Metro Junction",
        "distance_remaining_km": 3.8,
        "eta_minutes": 5.2,
        "active_hospital_name": "Gandhi Hospital",
        "hospital_emergency_beds": 14,
        "hospital_trauma_status": "READY",
        "active_road_alerts": 1,
        "suppressed_building_alerts": 2,
        "bottlenecks_detected": 1,
        "route_changed_reason": "Heavy traffic detected at Uppal Crossroads.",
        "patient_name": "Rajeshwar Rao",
        "patient_location": "Secunderabad Rail Nilayam Entrance",
        "patient_condition": "Severe acute chest pain, suspected myocardial infarction"
    }

# 1. EMERGENCY QUESTIONS (1-18)
@pytest.mark.parametrize("query,expected_intent", [
    ("What is the current emergency status?", "emergency_status"),
    ("Is emergency mode active?", "emergency_status"),
    ("Are we currently in emergency mode?", "emergency_status"),
    ("Is this mission active?", "emergency_status"),
    ("What's happening with the emergency?", "emergency_status"),
    ("What's our current emergency state?", "emergency_status"),
    ("Is AURA handling the emergency?", "emergency_status"),
    ("Has the emergency been activated?", "emergency_status"),
    ("What type of emergency is this?", "emergency_type"),
    ("What emergency was registered?", "emergency_type"),
    ("What is the case type?", "emergency_type"),
    ("What kind of medical emergency are we handling?", "emergency_type"),
    ("Activate emergency mode.", "emergency_control_activate"),
    ("Start emergency mode.", "emergency_control_activate"),
    ("Begin the emergency mission.", "emergency_control_activate"),
    ("Cancel the emergency.", "emergency_control_cancel"),
    ("Stop emergency mode.", "emergency_control_cancel"),
    ("Confirm the emergency mission.", "emergency_control_confirm"),
])
def test_emergency_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent
    assert res["speak"] is True
    assert len(res["response_text"].split()) <= 25  # Concise driver friendly

# 2. CURRENT LOCATION QUESTIONS (19-26)
@pytest.mark.parametrize("query", [
    "Where are we now?",
    "What's our current location?",
    "Where is the ambulance?",
    "Where are we currently?",
    "What road are we on?",
    "Which area are we in?",
    "What is our current position?",
    "Tell me where we are.",
])
def test_location_questions(voice_agent, mock_context, query):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == "current_location"
    assert "Habsiguda" in res["response_text"] or "Corridor" in res["response_text"]
    assert "data" in res
    assert res["data"]["speed"] == 54.0

# 3. PATIENT QUESTIONS (27-45)
@pytest.mark.parametrize("query,expected_intent", [
    ("Where is the patient?", "patient_location"),
    ("Where is the pickup location?", "patient_location"),
    ("Where are we picking up the patient?", "patient_location"),
    ("What's the patient location?", "patient_location"),
    ("Where do we need to go for pickup?", "patient_location"),
    ("Show me the patient location.", "patient_location"),
    ("How far is the patient?", "patient_distance"),
    ("How many kilometers to the patient?", "patient_distance"),
    ("How far are we from pickup?", "patient_distance"),
    ("How long until we reach the patient?", "patient_distance"),
    ("What's the pickup ETA?", "patient_distance"),
    ("Are we close to the patient?", "patient_distance"),
    ("Have we reached the patient?", "patient_status"),
    ("Are we near the pickup location?", "patient_status"),
    ("Has the patient been picked up?", "patient_status"),
    ("Is patient pickup confirmed?", "patient_status"),
    ("What's the pickup status?", "patient_status"),
    ("Start pickup mode.", "patient_status_confirm"),
    ("Confirm patient pickup.", "patient_status_confirm"),
])
def test_patient_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent

# 4. HOSPITAL QUESTIONS (46-62)
@pytest.mark.parametrize("query,expected_intent", [
    ("Which hospital are we going to?", "hospital_destination"),
    ("What is our destination hospital?", "hospital_destination"),
    ("Where are we taking the patient?", "hospital_destination"),
    ("What hospital is selected?", "hospital_destination"),
    ("Tell me our hospital destination.", "hospital_destination"),
    ("How far is the hospital?", "hospital_distance"),
    ("How many kilometers to the hospital?", "hospital_distance"),
    ("How far are we from the hospital?", "hospital_distance"),
    ("What's the remaining hospital distance?", "hospital_distance"),
    ("What's our hospital ETA?", "hospital_eta"),
    ("How much time until the hospital?", "hospital_eta"),
    ("When will we reach the hospital?", "hospital_eta"),
    ("How long until we reach the hospital?", "hospital_eta"),
    ("What's the estimated arrival time?", "hospital_eta"),
    ("When are we expected to arrive?", "hospital_eta"),
    ("How many minutes to the hospital?", "hospital_eta"),
    ("How long is the remaining journey?", "hospital_eta"),
])
def test_hospital_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent
    if expected_intent == "hospital_eta":
        assert "5.2" in res["response_text"] or "minutes" in res["response_text"]

# 5. ROUTE QUESTIONS (63-84)
@pytest.mark.parametrize("query,expected_intent", [
    ("What's our current route?", "current_route"),
    ("Which route are we taking?", "current_route"),
    ("Show me the current route.", "current_route"),
    ("Are we still on the planned route?", "current_route"),
    ("What road are we following?", "current_route"),
    ("What's the fastest route?", "fastest_route"),
    ("Are we on the fastest route?", "fastest_route"),
    ("Is this still the best route?", "fastest_route"),
    ("Which route is better?", "fastest_route"),
    ("What's the quickest way there?", "fastest_route"),
    ("Find an alternate route.", "alternate_route"),
    ("Is there another route?", "alternate_route"),
    ("Can you find a faster route?", "alternate_route"),
    ("Do we have another option?", "alternate_route"),
    ("Can we avoid this road?", "alternate_route"),
    ("Find a route with less traffic.", "alternate_route"),
    ("Why did you change the route?", "route_change_reason"),
    ("Why did you reroute?", "route_change_reason"),
    ("Why are we taking another road?", "route_change_reason"),
    ("Why did AURA select this route?", "route_change_reason"),
    ("What caused the route change?", "route_change_reason"),
    ("Why isn't the ambulance using the original route?", "route_change_reason"),
])
def test_route_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent

# 6. TRAFFIC QUESTIONS (85-108)
@pytest.mark.parametrize("query,expected_intent", [
    ("What's the traffic ahead?", "traffic_status"),
    ("How is the traffic?", "traffic_status"),
    ("Is there traffic ahead?", "traffic_status"),
    ("Is the road clear?", "traffic_status"),
    ("What's happening with traffic?", "traffic_status"),
    ("Are we entering congestion?", "traffic_status"),
    ("Is traffic heavy right now?", "traffic_status"),
    ("Where is the nearest congestion?", "traffic_location"),
    ("Where is traffic building up?", "traffic_location"),
    ("Which junction is congested?", "traffic_location"),
    ("Where is the traffic problem?", "traffic_location"),
    ("How much time will traffic cost us?", "traffic_delay"),
    ("How much delay is traffic causing?", "traffic_delay"),
    ("How many minutes are we losing?", "traffic_delay"),
    ("What's the traffic delay?", "traffic_delay"),
    ("Is there an accident ahead?", "accident"),
    ("Is there an obstruction ahead?", "accident"),
    ("Is something blocking the road?", "accident"),
    ("Is there an incident on our route?", "accident"),
    ("Which route has less traffic?", "traffic_route_decision"),
    ("Should we change the route?", "traffic_route_decision"),
    ("Do you recommend rerouting?", "traffic_route_decision"),
    ("Is the alternate route better?", "traffic_route_decision"),
    ("Should we avoid this road?", "traffic_route_decision"),
])
def test_traffic_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent

# 7. NEARBY VEHICLES & 50M GEOFENCE (109-128)
@pytest.mark.parametrize("query,expected_intent", [
    ("How many vehicles are nearby?", "nearby_vehicle_count"),
    ("Are there vehicles around us?", "nearby_vehicle_count"),
    ("How many connected vehicles are nearby?", "nearby_vehicle_count"),
    ("Are nearby drivers receiving alerts?", "vehicle_alert"),
    ("How far is the nearest vehicle?", "vehicle_distance"),
    ("Is a vehicle close to the ambulance?", "vehicle_distance"),
    ("How close is the nearest connected vehicle?", "vehicle_distance"),
    ("Is the ambulance warning active?", "vehicle_alert"),
    ("Are nearby vehicles getting warnings?", "vehicle_alert"),
    ("Did you alert the nearby vehicles?", "vehicle_alert"),
    ("Why was that vehicle alerted?", "vehicle_alert"),
    ("Are road users being notified?", "vehicle_alert"),
    ("Activate road-user alerts.", "vehicle_alert"),
    ("Is the 50-meter warning zone active?", "warning_zone_status"),
    ("How many vehicles are inside the warning zone?", "warning_zone_status"),
    ("Is any vehicle within 50 meters?", "warning_zone_status"),
    ("Who has received the emergency warning?", "warning_zone_status"),
    ("Are there road users inside the emergency zone?", "warning_zone_status"),
    ("Is the warning zone clear?", "warning_zone_status"),
    ("Has the 50-meter alert been triggered?", "warning_zone_status"),
])
def test_vehicle_and_geofence_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent

# 8. AURA AI, AGENTS, MISSION, POLICE, HOSPITAL, GENERAL (129-180)
@pytest.mark.parametrize("query,expected_intent", [
    ("Are you active?", "aura_status"),
    ("What are you doing now?", "aura_status"),
    ("What are you monitoring?", "aura_status"),
    ("What did you detect?", "aura_status"),
    ("What is your current decision?", "aura_status"),
    ("What is AURA doing?", "aura_status"),
    ("What's happening right now?", "aura_status"),
    ("Give me a quick summary.", "aura_status"),
    ("Explain the current situation.", "aura_status"),
    ("What should I do next?", "aura_status"),
    ("What agents are active?", "agent_status"),
    ("Which AI agents are running?", "agent_status"),
    ("Is the traffic agent active?", "agent_status"),
    ("Is the route agent active?", "agent_status"),
    ("Is the safety agent active?", "agent_status"),
    ("Is the hospital agent active?", "agent_status"),
    ("What is the coordinator doing?", "agent_status"),
    ("What is the current mission status?", "mission_status"),
    ("What stage are we in?", "mission_status"),
    ("Are we going to the patient or hospital?", "mission_status"),
    ("Has pickup happened?", "mission_status"),
    ("What's the next step?", "mission_status"),
    ("Has traffic control been notified?", "traffic_police_status"),
    ("Did you alert traffic police?", "traffic_police_status"),
    ("Is traffic intervention requested?", "traffic_police_status"),
    ("Which junction needs intervention?", "traffic_police_status"),
    ("How far is the next junction?", "traffic_police_status"),
    ("Is the hospital ready?", "hospital_intelligence"),
    ("Do we have hospital confirmation?", "hospital_intelligence"),
    ("Is the destination hospital available?", "hospital_intelligence"),
    ("Find another nearby hospital.", "hospital_intelligence"),
    ("Hello AURA.", "greeting"),
    ("Hi AURA.", "greeting"),
    ("What can you do?", "help"),
    ("Repeat that.", "repeat"),
    ("Say that again.", "repeat"),
    ("Speak slower.", "speak_slower"),
])
def test_miscellaneous_and_general_questions(voice_agent, mock_context, query, expected_intent):
    res = voice_agent.generate_response(query, mock_context)
    assert res["intent"] == expected_intent

def test_conversational_followups(voice_agent, mock_context):
    # Turn 1: Ask about hospital distance
    res1 = voice_agent.generate_response("How far is the hospital?", mock_context)
    assert res1["intent"] == "hospital_distance"

    # Turn 2: Follow-up "What about the patient?"
    res2 = voice_agent.generate_response("What about the patient?", mock_context)
    assert res2["intent"] == "patient_distance"

    # Turn 3: Follow-up "Can we avoid it?"
    res3 = voice_agent.generate_response("Can we avoid it?", mock_context)
    assert res3["intent"] == "traffic_route_decision"

    # Turn 4: Follow-up "Why did you choose that?"
    res4 = voice_agent.generate_response("Why did you choose that?", mock_context)
    assert res4["intent"] == "route_change_reason"

def test_live_simulation_binding():
    coordinator = AuraCoordinator()
    sim = SimulationEngine(coordinator)
    coordinator.set_sim_engine(sim)

    # Trigger emergency and update speed
    coordinator.activate_emergency()
    sim.speed_kmh = 62.5

    res = coordinator.handle_voice_query("What's our current location?")
    assert res["intent"] == "current_location"
    assert "62" in res["response_text"] or res["data"]["speed"] == 62.5
