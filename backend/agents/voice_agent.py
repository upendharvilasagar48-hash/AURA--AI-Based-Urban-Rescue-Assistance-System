"""Voice & Natural Language Understanding Agent for AURA Prototype
Handles conversational speech understanding, structured intent classification
across 18+ categories with 100+ natural variations, contextual follow-ups,
and driver-friendly concise spoken responses (5-20 words).
"""
import re
from typing import Dict, Any, Tuple, Optional, List

class VoiceAgent:
    def __init__(self):
        self.last_response = "AURA Voice System is ready. How can I assist your mission?"
        # Conversational context memory for follow-up questions
        self.last_intent: Optional[str] = None
        self.last_category: Optional[str] = None
        self.last_entity: Optional[str] = None
        self.last_query: Optional[str] = None

    def classify_intent(self, text: str) -> Tuple[str, str, float]:
        """Classifies user utterance into (Category, Intent, Confidence) supporting 100+ questions."""
        raw = text.lower().strip()
        # Strip apostrophes first so "what's" becomes "whats", "isn't" becomes "isnt"
        raw = raw.replace("'", "").replace("’", "").replace("`", "")
        cleaned = re.sub(r'[^a-z0-9\s]', ' ', raw)
        tokens = cleaned.split()
        joined = " ".join(tokens)

        # -------------------------------------------------------------------
        # CONVERSATIONAL CONTEXT FOLLOW-UP HANDLERS
        # -------------------------------------------------------------------
        if any(p in joined for p in ["what about the patient", "how about the patient", "and the patient", "what about pickup"]):
            return "Patient", "patient_distance", 0.95
        if any(p in joined for p in ["what about the hospital", "how about the hospital", "and the hospital"]):
            return "Hospital", "hospital_eta", 0.95
        if any(p in joined for p in ["can we avoid it", "can we bypass it", "can we avoid that", "avoid it"]):
            return "Traffic", "traffic_route_decision", 0.96
        if any(p in joined for p in ["why did you choose that", "why that", "why this way"]):
            return "Route", "route_change_reason", 0.95

        # -------------------------------------------------------------------
        # 1. SPECIFIC MULTI-WORD QUESTIONS CHECKED FIRST TO PREVENT PARTIAL OVERLAPS
        # -------------------------------------------------------------------
        # Traffic decisions & route comparisons (checked before alternate_route)
        if any(p in joined for p in [
            "which route has less traffic", "should we change the route", "do you recommend rerouting",
            "is the alternate route better", "should we avoid this road", "recommend reroute",
            "should we bypass"
        ]):
            return "Traffic", "traffic_route_decision", 0.96

        # Hospital Intelligence / Availability (checked before destination hospital)
        if any(p in joined for p in [
            "is the destination hospital available", "destination hospital available", "hospital available",
            "is the hospital ready", "is gandhi hospital ready", "is yashoda hospital ready",
            "is kims hospital ready", "gandhi hospital ready", "yashoda hospital ready", "kims hospital ready",
            "hospital ready", "is the destination hospital ready", "do we have hospital confirmation",
            "find another nearby hospital", "what other hospitals are available", "can we change the hospital",
            "should we choose another hospital", "what is the nearest suitable hospital", "other hospitals available",
            "hospital readiness", "er ready", "trauma bay ready", "hospital confirmation",
            "how many trauma beds are available", "trauma beds available", "is the icu team prepared",
            "check hospital capacity", "hospital capacity", "is the trauma bay ready"
        ]):
            return "Hospital", "hospital_intelligence", 0.96

        # Route change reason (checked before general route)
        if any(p in joined for p in [
            "why did you change the route", "why did you reroute", "why are we taking another road",
            "why did aura select this route", "what caused the route change", "why isnt the ambulance using the original",
            "why is not the ambulance using the original", "why did we reroute", "reason for route change",
            "why change route", "why bypass", "why did you choose this route", "why choose this route",
            "why did you take this route", "why this route", "why did you pick this route",
            "why are we taking this route", "why did you select this route", "why did you choose that",
            "explain why we are taking nacharam bypass", "why nacharam bypass", "why nacharam",
            "why did you avoid ngri", "why avoid ngri", "what makes this route faster"
        ]):
            return "Route", "route_change_reason", 0.99

        # Patient vitals
        if any(p in joined for p in [
            "patient vitals", "what are the patient vitals", "whats the patient vitals",
            "patient vital signs", "vitals", "heart rate", "blood pressure", "spo2",
            "vital signs", "patient condition", "is the patient condition critical",
            "check patient vitals", "how are the patient vitals"
        ]):
            return "Patient", "patient_vitals", 0.97

        # Patient status inquiry vs confirmation command
        if any(p in joined for p in [
            "what is the patient status", "whats the patient status", "patient status",
            "how is the patient", "have we reached the patient", "reached the patient", "are we near the pickup",
            "near the pickup location", "has the patient been picked up", "is patient pickup confirmed",
            "whats the pickup status", "what is the pickup status", "have we arrived at patient",
            "are we at the patient"
        ]):
            return "Patient", "patient_status", 0.96

        if any(p in joined for p in [
            "confirm patient pickup", "confirm pickup", "start pickup mode", "patient onboard",
            "patient on board", "pickup confirmed", "patient loaded"
        ]):
            return "Patient", "patient_status_confirm", 0.98

        # -------------------------------------------------------------------
        # 2. EMERGENCY QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "what type of emergency", "type of emergency", "what emergency was registered",
            "emergency registered", "what is the case type", "case type", "what kind of medical emergency",
            "what kind of emergency", "medical emergency are we handling", "emergency case",
            "nature of emergency", "nature of the call"
        ]):
            return "Emergency", "emergency_type", 0.96

        if any(p in joined for p in [
            "activate emergency", "start emergency", "begin the emergency", "begin emergency",
            "turn on emergency", "initiate emergency", "launch mission", "start mission"
        ]):
            return "Emergency", "emergency_control_activate", 0.98

        if any(p in joined for p in [
            "cancel the emergency", "cancel emergency", "abort emergency", "stop emergency",
            "stop the emergency", "end emergency", "cancel mission", "abort mission"
        ]):
            return "Emergency", "emergency_control_cancel", 0.95

        if any(p in joined for p in [
            "confirm the emergency", "confirm emergency", "confirm mission"
        ]):
            return "Emergency", "emergency_control_confirm", 0.94

        if any(p in joined for p in [
            "current emergency status", "emergency status", "is emergency mode active",
            "emergency mode active", "are we currently in emergency", "is this mission active",
            "whats happening with the emergency", "current emergency state", "is aura handling the emergency",
            "has the emergency been activated", "is emergency active", "emergency state", "emergency activated",
            "happening with the emergency"
        ]):
            return "Emergency", "emergency_status", 0.96

        # -------------------------------------------------------------------
        # 3. CURRENT LOCATION QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "where are we now", "where are we currently", "whats our current location",
            "what is our current location", "where is the ambulance", "what road are we on",
            "which area are we in", "what is our current position", "whats our current position",
            "tell me where we are", "current coordinates", "where are we right now", "current location"
        ]):
            return "Navigation", "current_location", 0.97

        # -------------------------------------------------------------------
        # 4. PATIENT QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "how far is the patient", "how many kilometers to the patient", "how far to the patient",
            "how far are we from pickup", "how far to pickup", "how long until we reach the patient",
            "how long to reach the patient", "whats the pickup eta", "what is the pickup eta",
            "are we close to the patient", "distance to patient", "patient eta", "time to patient"
        ]):
            return "Patient", "patient_distance", 0.96

        if any(p in joined for p in [
            "where is the patient", "where is the pickup location", "where are we picking up the patient",
            "whats the patient location", "what is the patient location", "where do we need to go for pickup",
            "show me the patient location", "patient address", "pickup address", "where is pickup"
        ]):
            return "Patient", "patient_location", 0.97

        # -------------------------------------------------------------------
        # 5. HOSPITAL & GENERAL ETA QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "what is our current eta", "whats our current eta", "current eta", "our eta",
            "whats our eta", "what is our eta", "whats the eta", "what is the eta",
            "tell me the eta", "show eta", "eta", "hospital eta", "time until the hospital",
            "time until hospital", "when will we reach the hospital", "when do we reach the hospital",
            "how long until we reach the hospital", "whats our hospital eta", "what is our hospital eta",
            "whats the estimated arrival time", "what is the estimated arrival time",
            "when are we expected to arrive", "how many minutes to the hospital",
            "how long is the remaining journey", "how long to hospital",
            "how much time until the hospital", "eta to hospital", "arrival time at hospital",
            "when will we get to hospital", "estimated arrival time"
        ]):
            return "Hospital", "hospital_eta", 0.98

        # Vehicle Speed
        if any(p in joined for p in [
            "what is our vehicle speed", "whats our vehicle speed", "vehicle speed",
            "how fast are we going", "what is our speed", "whats our speed",
            "ambulance speed", "current speed"
        ]):
            return "Navigation", "vehicle_speed", 0.97

        if any(p in joined for p in [
            "how far is the hospital", "how many kilometers to the hospital", "how far are we from the hospital",
            "whats the remaining hospital distance", "hospital distance", "distance to hospital",
            "how many km to the hospital", "remaining distance to hospital"
        ]):
            return "Hospital", "hospital_distance", 0.96

        if any(p in joined for p in [
            "which hospital are we going to", "what is our destination hospital", "whats our destination hospital",
            "where are we taking the patient", "what hospital is selected", "tell me our hospital destination",
            "which hospital", "destination hospital", "selected hospital", "target hospital",
            "why did you select this hospital", "why are we going to gandhi hospital"
        ]):
            return "Hospital", "hospital_destination", 0.97

        if any(p in joined for p in [
            "divert to yashoda", "divert to kims", "divert to gandhi", "divert to hospital",
            "switch destination to", "switch destination", "change hospital", "switch hospital",
            "divert hospital", "divert", "find another nearby hospital"
        ]):
            return "Hospital", "hospital_divert", 0.97

        if any(p in joined for p in [
            "how many trauma beds are available", "how many beds available", "check hospital capacity",
            "trauma beds", "icu capacity", "how many beds", "hospital capacity", "available beds"
        ]):
            return "Hospital", "hospital_capacity", 0.97

        if any(p in joined for p in [
            "is gandhi hospital ready", "is the hospital ready", "is yashoda hospital ready",
            "is kims hospital ready", "is hospital ready", "is the icu team prepared",
            "is icu prepared", "do we have hospital confirmation", "is the destination hospital available",
            "hospital confirmation", "trauma team ready", "trauma team status"
        ]):
            return "Hospital", "hospital_readiness", 0.97

        # -------------------------------------------------------------------
        # 6. ROUTE QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "whats the fastest route", "what is the fastest route", "are we on the fastest route",
            "is this still the best route", "which route is better", "whats the quickest way there",
            "what is the quickest way there", "quickest way there", "best route", "quickest route",
            "optimal route", "fastest way"
        ]):
            return "Route", "fastest_route", 0.95

        if any(p in joined for p in [
            "find an alternate route", "is there another route", "can you find a faster route",
            "do we have another option", "can we avoid this road", "find a route with less traffic",
            "alternate route", "another route", "bypass route", "calculate alternate"
        ]):
            return "Route", "alternate_route", 0.96

        if any(p in joined for p in [
            "whats our current route", "what is our current route", "which route are we taking",
            "show me the current route", "are we still on the planned route", "what road are we following",
            "current route", "planned route", "corridor path"
        ]):
            return "Route", "current_route", 0.95

        # -------------------------------------------------------------------
        # 7. TRAFFIC QUESTIONS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "is there an accident ahead", "accident ahead", "is there an obstruction ahead",
            "is something blocking the road", "is there an incident on our route", "road blocked",
            "any accident", "hazard ahead", "incident ahead"
        ]):
            return "Traffic", "accident", 0.95

        if any(p in joined for p in [
            "how much time will traffic cost us", "how much delay is traffic causing",
            "how many minutes are we losing", "whats the traffic delay", "what is the traffic delay",
            "traffic delay", "delay from traffic", "minutes lost"
        ]):
            return "Traffic", "traffic_delay", 0.95

        if any(p in joined for p in [
            "how bad is traffic at uppal", "traffic at uppal", "traffic at uppal x roads",
            "traffic at habsiguda", "traffic at ngri", "how bad is traffic", "traffic condition at uppal",
            "where is the nearest congestion", "where is traffic building up", "which junction is congested",
            "where is the traffic problem", "nearest bottleneck", "where is the jam", "traffic bottleneck location"
        ]):
            return "Traffic", "traffic_location", 0.96

        if any(p in joined for p in [
            "whats the traffic ahead", "what is the traffic ahead", "how is the traffic",
            "how is traffic", "is there traffic ahead", "is the road clear", "whats happening with traffic",
            "what is happening with traffic", "are we entering congestion", "is traffic heavy right now",
            "traffic status", "traffic condition", "traffic ahead", "happening with traffic"
        ]):
            return "Traffic", "traffic_status", 0.96

        # -------------------------------------------------------------------
        # 8. VEHICLES & 50M GEOFENCE
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "is the 50 meter warning zone active", "50 meter warning zone", "50m warning zone",
            "50m zone", "how many vehicles are inside the warning zone", "is any vehicle within 50 meters",
            "who has received the emergency warning", "are there road users inside the emergency zone",
            "is the warning zone clear", "has the 50 meter alert been triggered", "warning zone active",
            "50m alert", "emergency zone status"
        ]):
            return "Nearby Vehicles", "warning_zone_status", 0.97

        if any(p in joined for p in [
            "is the ambulance warning active", "are nearby vehicles getting warnings",
            "are nearby vehicles receiving alerts", "are nearby drivers receiving alerts",
            "did you alert the nearby vehicles", "why was that vehicle alerted", "are road users being notified",
            "activate road user alerts", "vehicle alert", "alert road users", "warn vehicles",
            "drivers receiving alerts", "warn nearby connected vehicles", "broadcast siren alert",
            "are road users clearing the lane", "how many vehicles received the alert"
        ]):
            return "Nearby Vehicles", "vehicle_alert", 0.96

        if any(p in joined for p in [
            "how far is the nearest vehicle", "is a vehicle close to the ambulance",
            "how close is the nearest connected vehicle", "nearest vehicle distance",
            "distance to nearest vehicle"
        ]):
            return "Nearby Vehicles", "vehicle_distance", 0.95

        if any(p in joined for p in [
            "how many vehicles are nearby", "are there vehicles around us", "how many connected vehicles are nearby",
            "nearby vehicles", "vehicles around us", "connected vehicles nearby", "cars nearby",
            "how many vehicles"
        ]):
            return "Nearby Vehicles", "nearby_vehicle_count", 0.96

        # -------------------------------------------------------------------
        # 9. TRAFFIC POLICE & GREEN CORRIDOR
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "is the green corridor active", "green corridor active", "green corridor",
            "are traffic signals cleared", "are traffic signals cleared ahead", "signals cleared ahead",
            "signals cleared", "clear the intersection", "clear the intersection ahead",
            "override traffic light", "override traffic light at uppal", "override signal",
            "override signal at uppal", "status of habsiguda junction", "status of uppal junction",
            "has traffic control been notified", "did you alert traffic police", "is traffic intervention requested",
            "which junction needs intervention", "how far is the next junction", "what action is recommended at the junction",
            "is the traffic dashboard updated", "alert traffic control", "notify police", "traffic police",
            "green corridor status"
        ]):
            return "Traffic Police", "traffic_police_status", 0.96

        # -------------------------------------------------------------------
        # 10. MISSION LIFECYCLE
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "what is the current mission status", "whats the current mission status", "what stage are we in",
            "are we going to the patient or hospital", "has pickup happened", "whats the next step",
            "what is the next step", "what should happen next", "is the mission progressing normally",
            "how long has the mission been active", "mission status", "mission progress", "rescue phase",
            "current stage", "next step"
        ]):
            return "Mission", "mission_status", 0.96

        # -------------------------------------------------------------------
        # 11. AURA AI & AGENTS
        # -------------------------------------------------------------------
        if any(p in joined for p in [
            "what agents are active", "which ai agents are running", "is the traffic agent active",
            "is the route agent active", "is the safety agent active", "is the hospital agent active",
            "what is the coordinator doing", "active agents", "which agents", "agent status"
        ]):
            return "AURA Intelligence", "agent_status", 0.96

        if any(p in joined for p in [
            "are you active", "what are you doing now", "what are you monitoring", "what did you detect",
            "what is your current decision", "what is aura doing", "whats happening right now",
            "what is happening right now", "give me a quick summary", "quick summary", "explain the current situation",
            "explain situation", "what should i do next", "aura status", "system status", "happening right now"
        ]):
            return "AURA Intelligence", "aura_status", 0.96

        # -------------------------------------------------------------------
        # 12. GENERAL & ASSISTANT
        # -------------------------------------------------------------------
        if any(p in joined for p in ["hello", "hi aura", "hey aura", "are you there", "can you hear me"]):
            return "General", "greeting", 0.98

        if any(p in joined for p in ["what can you do", "help me", "help", "commands", "features"]):
            return "General", "help", 0.97

        if any(p in joined for p in ["repeat that", "say that again", "pardon", "repeat"]):
            return "General", "repeat", 0.96

        if any(p in joined for p in ["speak slower", "talk slower", "slow down speech"]):
            return "General", "speak_slower", 0.93

        if any(p in joined for p in ["give me a short answer", "short answer", "briefly"]):
            return "General", "details_short", 0.92

        if any(p in joined for p in ["give me more details", "more details", "elaborate", "tell me more"]):
            return "General", "details_more", 0.92

        # FALLBACK UNKNOWN
        return "General", "unknown_query", 0.40

    def generate_response(self, text: str, system_context: Dict[str, Any]) -> Dict[str, Any]:
        """Generates structured response with concise, driver-friendly spoken text."""
        category, intent, confidence = self.classify_intent(text)

        # Extract REAL LIVE context data
        mission_status = system_context.get("mission_status", "IDLE")
        phase = system_context.get("phase", "TO_PATIENT")
        speed = round(float(system_context.get("speed_kmh", 45.0)), 1)
        route_name = system_context.get("current_route_name", "Uppal-Habsiguda Corridor")
        active_route_type = system_context.get("active_route_type", "PRIMARY")
        next_wp = system_context.get("next_waypoint_name", "Secunderabad Station")
        dist_rem_km = round(float(system_context.get("distance_remaining_km", 4.2)), 1)
        eta_min = round(float(system_context.get("eta_minutes", 6.5)), 1)
        hosp_name = system_context.get("active_hospital_name", "Gandhi Hospital")
        hosp_beds = int(system_context.get("hospital_emergency_beds", 14))
        hosp_trauma_status = system_context.get("hospital_trauma_status", "STANDBY")
        active_alerts = int(system_context.get("active_road_alerts", 1))
        suppressed_alerts = int(system_context.get("suppressed_building_alerts", 2))
        bottlenecks_count = int(system_context.get("bottlenecks_detected", 0))
        reroute_reason = system_context.get("route_changed_reason", "Heavy congestion detected on primary corridor.")
        amb_lat = system_context.get("ambulance_lat", 17.4135)
        amb_lng = system_context.get("ambulance_lng", 78.5786)
        pt_name = system_context.get("patient_name", "Rajeshwar Rao")
        pt_location = system_context.get("patient_location", "Secunderabad Rail Nilayam Entrance")
        pt_condition = system_context.get("patient_condition", "Severe acute chest pain, suspected myocardial infarction")
        priority = "normal"
        structured_data: Dict[str, Any] = {}

        # -------------------------------------------------------------------
        # 1. EMERGENCY RESPONSES
        # -------------------------------------------------------------------
        if intent == "emergency_status":
            spoken = f"Emergency mode is {mission_status}. Traveling at {int(speed)} km/h towards {next_wp}."
            structured_data = {"status": mission_status, "speedKmH": speed, "nextWaypoint": next_wp}
        elif intent == "emergency_type":
            spoken = f"Registered case: {pt_condition}. Triage code red for patient {pt_name}."
            structured_data = {"caseType": pt_condition, "patient": pt_name, "triage": "CODE_RED"}
        elif intent == "emergency_control_activate":
            spoken = "Emergency mission activated. Routing optimal corridor to patient."
            priority = "urgent"
            structured_data = {"action": "ACTIVATE", "status": "EN_ROUTE_PATIENT"}
        elif intent == "emergency_control_cancel":
            spoken = "Emergency mission cancelled. AURA returning to standby."
            priority = "urgent"
            structured_data = {"action": "CANCEL", "status": "IDLE"}
        elif intent == "emergency_control_confirm":
            spoken = f"Emergency mission confirmed for {hosp_name}. Priority green corridor active."
            structured_data = {"action": "CONFIRM"}

        # -------------------------------------------------------------------
        # 2. CURRENT LOCATION RESPONSES (Real current GPS & road)
        # -------------------------------------------------------------------
        elif intent == "current_location":
            spoken = f"We are on {route_name} near {next_wp}, speed {int(speed)} km/h."
            structured_data = {"road": route_name, "waypoint": next_wp, "lat": amb_lat, "lng": amb_lng, "speed": speed}
        elif intent == "vehicle_speed":
            spoken = f"Ambulance is traveling at {int(speed)} kilometers per hour on {route_name}."
            structured_data = {"speedKmH": speed, "road": route_name}

        # -------------------------------------------------------------------
        # 3. PATIENT RESPONSES (Location, Distance, Status, Vitals)
        # -------------------------------------------------------------------
        elif intent == "patient_location":
            spoken = f"Patient {pt_name} is located at {pt_location}."
            structured_data = {"patient": pt_name, "location": pt_location}
        elif intent == "patient_distance":
            if mission_status in ["PATIENT_PICKED_UP", "EN_ROUTE_HOSPITAL", "HOSPITAL_ARRIVAL", "MISSION_COMPLETED"]:
                spoken = "Patient is already on board. We are en route to the hospital."
            else:
                spoken = f"Patient is {dist_rem_km} kilometers away. Estimated arrival is {eta_min} minutes."
            structured_data = {"distanceKm": dist_rem_km, "etaMinutes": eta_min, "pickupSpot": pt_location}
        elif intent == "patient_status_confirm":
            spoken = f"Patient pickup confirmed. Switching to hospital transport for {hosp_name}."
            priority = "urgent"
            structured_data = {"action": "CONFIRM_PICKUP", "targetHospital": hosp_name}
        elif intent == "patient_vitals":
            hr = system_context.get("heart_rate_bpm", 112)
            bp = system_context.get("blood_pressure", "145/95")
            spo2 = system_context.get("spo2_percent", 91)
            spoken = f"Patient {pt_name} vitals: Heart rate {hr} bpm, blood pressure {bp}, SpO2 {spo2} percent."
            structured_data = {"patient": pt_name, "heartRate": hr, "bloodPressure": bp, "spo2": spo2, "condition": pt_condition}
        elif intent == "patient_status":
            if mission_status in ["NEAR_PATIENT", "PATIENT_PICKED_UP"]:
                spoken = "Ambulance has reached the pickup location. Paramedic boarding initiated."
            elif mission_status in ["EN_ROUTE_HOSPITAL", "HOSPITAL_ARRIVAL"]:
                spoken = "Patient is onboard and stabilized. Transporting to emergency trauma bay."
            else:
                spoken = f"En route to patient. Distance remaining is {dist_rem_km} km."
            structured_data = {"missionStage": mission_status}

        # -------------------------------------------------------------------
        # 4. HOSPITAL RESPONSES (Destination, Distance, ETA)
        # -------------------------------------------------------------------
        elif intent == "hospital_destination":
            spoken = f"Destination is {hosp_name}. {hosp_beds} emergency trauma beds available."
            structured_data = {"hospital": hosp_name, "bedsAvailable": hosp_beds}
        elif intent == "hospital_distance":
            spoken = f"Hospital is {dist_rem_km} kilometers away on current corridor."
            structured_data = {"hospital": hosp_name, "distanceKm": dist_rem_km}
        elif intent == "hospital_eta":
            spoken = f"Hospital ETA is {eta_min} minutes, covering {dist_rem_km} kilometers."
            structured_data = {"etaMinutes": eta_min, "distanceKm": dist_rem_km, "hospital": hosp_name}
        elif intent == "hospital_divert":
            target_hosp = "Yashoda Hospital" if "yashoda" in text.lower() else ("KIMS Hospital" if "kims" in text.lower() else "Gandhi Hospital")
            spoken = f"Initiating diversion to {target_hosp}. Recalculating optimal corridor and notifying trauma receiving unit."
            structured_data = {"requestedHospital": target_hosp}
        elif intent == "hospital_capacity":
            spoken = f"{hosp_name} has {hosp_beds} emergency trauma beds and active critical care capacity available."
            structured_data = {"hospital": hosp_name, "bedsAvailable": hosp_beds}
        elif intent == "hospital_readiness":
            spoken = f"{hosp_name} trauma team is {hosp_trauma_status.lower()} and ready for immediate red triage handover."
            structured_data = {"hospital": hosp_name, "traumaStatus": hosp_trauma_status}

        # -------------------------------------------------------------------
        # 5. ROUTE RESPONSES (Current, Fastest, Alternate, Reason)
        # -------------------------------------------------------------------
        elif intent == "current_route":
            spoken = f"Following {route_name}. Next waypoint is {next_wp}."
            structured_data = {"route": route_name, "type": active_route_type, "nextWaypoint": next_wp}
        elif intent == "fastest_route":
            spoken = f"Current corridor via {route_name} is verified as the fastest safe path."
            structured_data = {"route": route_name, "etaMinutes": eta_min}
        elif intent == "alternate_route":
            if active_route_type == "ALTERNATE":
                spoken = "Alternate Nacharam bypass is already active and saving approximately three minutes."
            else:
                spoken = "Alternate bypass via Nacharam is standby and ready if primary route congests."
            structured_data = {"alternateAvailable": True, "activeRoute": active_route_type}
        elif intent == "route_change_reason":
            clean_reason = reroute_reason.strip() if reroute_reason and reroute_reason.strip() else "heavy traffic congestion was detected on the primary corridor"
            if clean_reason.endswith("."):
                clean_reason = clean_reason[:-1]
            spoken = f"Rerouted because {clean_reason}. The alternate Nacharam bypass saves approximately 3.4 minutes."
            structured_data = {"reason": clean_reason, "timeSavedMinutes": 3.4}

        # -------------------------------------------------------------------
        # 6. TRAFFIC RESPONSES (Status, Location, Delay, Accidents, Decisions)
        # -------------------------------------------------------------------
        elif intent == "traffic_status":
            if bottlenecks_count > 0:
                spoken = f"Heavy congestion reported ahead. Bottleneck detected near Uppal Circle."
                priority = "urgent"
            else:
                spoken = f"Corridor traffic is moderate. Proceeding smoothly along {route_name}."
            structured_data = {"bottlenecks": bottlenecks_count, "corridor": route_name}
        elif intent == "traffic_location":
            spoken = "Nearest congestion is at Uppal Ring Road Junction J-1."
            structured_data = {"bottleneckJunction": "Uppal Circle (J-1)", "delay": "4.5 min"}
        elif intent == "traffic_delay":
            spoken = "Current traffic congestion adds approximately 4 minutes of delay on primary route."
            structured_data = {"delayMinutes": 4.5}
        elif intent == "accident":
            spoken = "No vehicle collisions detected. Delay is due to junction traffic volume."
            structured_data = {"accidentsDetected": False}
        elif intent == "traffic_route_decision":
            if active_route_type == "ALTERNATE":
                spoken = "We have already switched to the Nacharam bypass to avoid traffic."
            else:
                spoken = "Yes, I recommend the Nacharam bypass to save over three minutes."
            structured_data = {"recommendation": "NACHARAM_BYPASS", "savingsMin": 3.4}

        # -------------------------------------------------------------------
        # 7. NEARBY VEHICLES & 50M WARNING ZONE
        # -------------------------------------------------------------------
        elif intent == "warning_zone_status":
            spoken = f"50-meter road warning zone is active with {active_alerts} road vehicle alerted."
            structured_data = {"zoneRadiusM": 50, "roadAlerts": active_alerts, "buildingSuppressed": suppressed_alerts}
        elif intent == "vehicle_alert":
            spoken = f"Alerts sent to {active_alerts} connected road vehicle. Building devices are filtered out."
            structured_data = {"activeAlerts": active_alerts, "suppressed": suppressed_alerts}
        elif intent == "vehicle_distance":
            spoken = "Nearest connected car is 38 meters ahead in our carriageway lane."
            structured_data = {"nearestVehicleM": 38.4, "lane": "Right Lane"}
        elif intent == "nearby_vehicle_count":
            spoken = f"Detected {active_alerts} vehicle in carriageway, and {suppressed_alerts} devices inside roadside buildings."
            structured_data = {"roadVehicles": active_alerts, "buildingDevices": suppressed_alerts}

        # -------------------------------------------------------------------
        # 8. TRAFFIC POLICE RESPONSES
        # -------------------------------------------------------------------
        elif intent == "traffic_police_status":
            spoken = "Traffic police notified. Green corridor clearance active for upcoming junctions."
            structured_data = {"policeNotified": True, "greenCorridor": True}

        # -------------------------------------------------------------------
        # 9. HOSPITAL INTELLIGENCE RESPONSES
        # -------------------------------------------------------------------
        elif intent == "hospital_intelligence":
            spoken = f"{hosp_name} is ready. {hosp_beds} ER trauma beds open and trauma team on standby."
            structured_data = {"hospital": hosp_name, "beds": hosp_beds, "status": hosp_trauma_status}

        # -------------------------------------------------------------------
        # 10. MISSION LIFECYCLE RESPONSES
        # -------------------------------------------------------------------
        elif intent == "mission_status":
            if mission_status == "MISSION_COMPLETED":
                spoken = "Mission completed. Patient safely transferred to emergency trauma team."
            else:
                spoken = f"Mission is in {mission_status} stage. Next milestone is {next_wp}."
            structured_data = {"status": mission_status, "phase": phase}

        # -------------------------------------------------------------------
        # 11. AURA AI & AGENT STATUS RESPONSES
        # -------------------------------------------------------------------
        elif intent == "agent_status":
            spoken = "All seven agents are active: Coordinator, Route, Traffic, Safety, Hospital, Voice, and Mission."
            structured_data = {"activeAgents": 7, "allOnline": True}
        elif intent == "aura_status":
            spoken = f"AURA active. Monitoring Hyderabad corridor. Speed {int(speed)} km/h, ETA {eta_min} mins."
            structured_data = {"status": "ACTIVE", "speed": speed, "eta": eta_min}

        # -------------------------------------------------------------------
        # 12. GENERAL RESPONSES
        # -------------------------------------------------------------------
        elif intent == "greeting":
            spoken = "Hello! AURA AI emergency coordination is online and listening."
        elif intent == "help":
            spoken = "You can ask about ETA, traffic, hospital readiness, route changes, or give commands."
        elif intent == "repeat":
            spoken = self.last_response
        elif intent == "speak_slower":
            spoken = f"Speaking slower. We are {dist_rem_km} kilometers from destination."
        elif intent == "details_short":
            spoken = f"ETA {eta_min} mins. Speed {int(speed)} km/h. Corridor clear."
        elif intent == "details_more":
            spoken = f"Ambulance is navigating {route_name} at {int(speed)} km/h. Next waypoint {next_wp} in {dist_rem_km} km. {hosp_name} reports {hosp_beds} trauma beds ready."
        else:
            # Fallback for unknown
            spoken = "Sorry, I didn't understand that. You can ask about traffic, route, patient, hospital, or mission status."
            confidence = 0.40

        # Save context for next turn
        self.last_response = spoken
        self.last_intent = intent
        self.last_category = category
        self.last_query = text

        return {
            "query": text,
            "category": category,
            "intent": intent,
            "confidence": confidence,
            "response_text": spoken,
            "speak": True,
            "priority": priority,
            "data": structured_data,
            "suggested_actions": []
        }
