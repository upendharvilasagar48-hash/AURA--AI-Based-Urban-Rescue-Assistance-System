"""AURA Coordinator Agent
Master Orchestrator implementing the continuous autonomous cycle:
OBSERVE -> ANALYZE -> DECIDE -> ACT -> MONITOR -> RE-EVALUATE
Provides Explainable AI reasoning traces for all system decisions.
"""
from typing import Dict, Any, List
from datetime import datetime, timezone

from backend.agents.mission_agent import MissionAgent
from backend.agents.route_agent import RouteAgent
from backend.agents.traffic_agent import TrafficAgent
from backend.agents.road_safety_agent import RoadSafetyAgent
from backend.agents.hospital_agent import HospitalAgent
from backend.agents.voice_agent import VoiceAgent

class AuraCoordinator:
    def __init__(self):
        self.mission_agent = MissionAgent()
        self.route_agent = RouteAgent()
        self.traffic_agent = TrafficAgent()
        self.road_safety_agent = RoadSafetyAgent()
        self.hospital_agent = HospitalAgent()
        self.voice_agent = VoiceAgent()
        self.sim_engine = None

        self.last_decision_explanation = "AURA initialized and in standby mode. All specialized agents synchronized."
        self.decision_audit_trail: List[Dict[str, Any]] = []
        self.system_events: List[Dict[str, Any]] = []

        self.record_event("SYSTEM", "AURA Multi-Agent Emergency Orchestrator booted successfully.")

    def set_sim_engine(self, sim_engine):
        self.sim_engine = sim_engine

    def record_event(self, category: str, message: str, details: Any = None):
        event = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "category": category,
            "message": message,
            "details": details or {}
        }
        self.system_events.append(event)
        if len(self.system_events) > 50:
            self.system_events.pop(0)

    def log_decision(self, agent: str, decision: str, reason: str):
        record = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "agent": agent,
            "decision": decision,
            "reason": reason
        }
        self.decision_audit_trail.append(record)
        self.last_decision_explanation = reason
        self.record_event("DECISION", f"[{agent}] {decision}: {reason}")
        if len(self.decision_audit_trail) > 30:
            self.decision_audit_trail.pop(0)

    # 1. OBSERVE & ANALYZE CYCLE (Run every simulation tick)
    def run_cycle(self, ambulance_lat: float, ambulance_lng: float, speed_kmh: float) -> Dict[str, Any]:
        """Runs the Observe-Analyze-Decide-Act-Monitor-Re-evaluate loop."""
        
        # A. OBSERVE: Current route status, nearby traffic, road users
        route_info = self.route_agent.get_route_info(ambulance_lat, ambulance_lng, speed_kmh)
        bottlenecks = self.traffic_agent.assess_bottlenecks_ahead(ambulance_lat, ambulance_lng)
        devices_eval = self.road_safety_agent.evaluate_devices(ambulance_lat, ambulance_lng)
        
        # B. ANALYZE: Check if bottlenecks threaten current path
        if bottlenecks and self.route_agent.active_route_type == "PRIMARY":
            severe = [b for b in bottlenecks if b["congestion_level"] in ["HEAVY", "GRIDLOCK"]]
            if severe:
                # C. DECIDE & ACT: Autonomous reroute via alternate corridor
                junction_name = severe[0]["name"]
                reroute_res = self.route_agent.switch_to_alternate_route(
                    f"Traffic Agent detected {severe[0]['congestion_level']} at {junction_name} (+{severe[0]['delay_minutes']} min delay)."
                )
                self.log_decision(
                    "Coordinator & RouteAgent",
                    "REROUTE_TO_ALTERNATE_CORRIDOR",
                    f"Severe congestion detected at {junction_name}. Switched to Nacharam Bypass, saving ~{reroute_res.get('time_saved_minutes', 3.2)} minutes."
                )
                # Also alert traffic police
                self.record_event("POLICE_ALERT", f"Requested emergency clearance for Nacharam bypass corridor.")

        # D. MONITOR GEOFENCE PROXIMITY TO PATIENT OR HOSPITAL
        if self.mission_agent.current_state == "EN_ROUTE_PATIENT":
            if route_info["distance_remaining_m"] < 120.0:
                self.mission_agent.mark_near_patient(route_info["distance_remaining_m"])
                self.log_decision(
                    "MissionAgent",
                    "STATE_CHANGE_NEAR_PATIENT",
                    "Ambulance within 120m of Secunderabad patient location. Initiated pickup prep."
                )
        elif self.mission_agent.current_state == "EN_ROUTE_HOSPITAL":
            if route_info["distance_remaining_m"] < 90.0:
                self.mission_agent.mark_hospital_arrival()
                self.log_decision(
                    "HospitalAgent",
                    "STATE_CHANGE_HOSPITAL_ARRIVAL",
                    f"Arrived at {self.hospital_agent.get_active_hospital()['name']}. Trauma bay standby confirmed."
                )

        return {
            "route_info": route_info,
            "bottlenecks": bottlenecks,
            "devices_eval": devices_eval,
            "mission_status": self.mission_agent.current_state,
            "explanation": self.last_decision_explanation
        }

    # 2. EMERGENCY LIFECYCLE ACTIONS
    def activate_emergency(self) -> Dict[str, Any]:
        self.mission_agent.activate_emergency("Emergency call received from Secunderabad: Code Red Cardiac distress.")
        self.route_agent.switch_to_primary_route("Calculating primary Boduppal -> Secunderabad corridor.")
        self.log_decision("Coordinator", "EMERGENCY_ACTIVATED", "Emergency Mission initialized. Routing to patient.")
        return {"success": True, "status": self.mission_agent.current_state}

    def confirm_patient_pickup(self) -> Dict[str, Any]:
        self.mission_agent.confirm_patient_pickup("Patient onboarded. Commencing transport to destination hospital.")
        from_lat = self.sim_engine.patient["lat"] if self.sim_engine else None
        from_lng = self.sim_engine.patient["lng"] if self.sim_engine else None
        hosp_res = self.route_agent.switch_to_hospital_phase(
            self.hospital_agent.active_hospital_id,
            from_lat=from_lat,
            from_lng=from_lng
        )
        self.log_decision("Coordinator", "PATIENT_PICKED_UP", f"Patient aboard. Route switched to {hosp_res['hospital_name']}.")
        return {"success": True, "status": self.mission_agent.current_state, "hospital": hosp_res}

    def complete_mission(self) -> Dict[str, Any]:
        self.mission_agent.complete_mission()
        self.log_decision("Coordinator", "MISSION_COMPLETED", "Triage handover completed. Mission logged.")
        return {"success": True, "status": self.mission_agent.current_state}

    def reset_mission(self) -> Dict[str, Any]:
        self.mission_agent.reset_to_idle()
        self.route_agent.active_route_type = "PRIMARY"
        self.route_agent.phase = "TO_PATIENT"
        self.route_agent.current_waypoint_idx = 0
        self.hospital_agent.active_hospital_id = "HOSP-GANDHI"
        self.log_decision("Coordinator", "MISSION_RESET", "Reset all agents to initial standby state.")
        return {"success": True, "status": self.mission_agent.current_state}

    def change_destination_hospital(self, hospital_id: str, custom_hosp: Any = None) -> Dict[str, Any]:
        if custom_hosp:
            hosp_info = self.hospital_agent.register_custom_hospital(custom_hosp)
            hospital_id = hosp_info["id"]
        hosp_res = self.hospital_agent.switch_hospital(hospital_id)
        if self.mission_agent.current_state in ["PATIENT_PICKED_UP", "EN_ROUTE_HOSPITAL"]:
            from_lat = self.sim_engine.ambulance_lat if self.sim_engine else None
            from_lng = self.sim_engine.ambulance_lng if self.sim_engine else None
            self.route_agent.switch_to_hospital_phase(hospital_id, from_lat=from_lat, from_lng=from_lng, custom_hosp=custom_hosp)
        self.log_decision("HospitalAgent", "HOSPITAL_DIVERTED", f"Diverted to {hosp_res['hospital_name']}.")
        return hosp_res

    def handle_voice_query(self, query: str) -> Dict[str, Any]:
        # Pull LIVE simulation telemetry if sim_engine is connected
        if self.sim_engine:
            snapshot = self.sim_engine.get_telemetry_snapshot()
            context = {
                "mission_status": snapshot["mission_status"],
                "phase": snapshot["phase"],
                "speed_kmh": snapshot["ambulance"]["speed_kmh"],
                "ambulance_lat": snapshot["ambulance"]["lat"],
                "ambulance_lng": snapshot["ambulance"]["lng"],
                "current_route_name": snapshot["navigation"]["route_name"],
                "active_route_type": snapshot["navigation"]["active_route_type"],
                "next_waypoint_name": snapshot["navigation"]["next_waypoint_name"],
                "distance_remaining_km": snapshot["navigation"]["distance_remaining_km"],
                "eta_minutes": snapshot["navigation"]["eta_minutes"],
                "active_hospital_name": snapshot["hospital"]["name"],
                "hospital_emergency_beds": snapshot["hospital"].get("emergency_beds_available", 12),
                "hospital_trauma_status": snapshot["hospital"].get("trauma_team_status", "STANDBY"),
                "active_road_alerts": snapshot["road_safety"]["stats"]["active_road_alerts"],
                "suppressed_building_alerts": snapshot["road_safety"]["stats"]["suppressed_building_alerts"],
                "bottlenecks_detected": len(snapshot["traffic"].get("bottlenecks", [])),
                "route_changed_reason": snapshot["navigation"].get("route_changed_reason", ""),
                "patient_name": snapshot["patient"]["name"],
                "patient_location": snapshot["patient"]["location_name"],
                "patient_condition": snapshot["patient"]["condition"]
            }
        else:
            active_hosp = self.hospital_agent.get_active_hospital()
            context = {
                "mission_status": self.mission_agent.current_state,
                "phase": self.route_agent.phase,
                "speed_kmh": 45.0,
                "ambulance_lat": 17.4135,
                "ambulance_lng": 78.5786,
                "current_route_name": "Nacharam Bypass" if self.route_agent.active_route_type == "ALTERNATE" else "Uppal-Habsiguda Corridor",
                "active_route_type": self.route_agent.active_route_type,
                "next_waypoint_name": self.route_agent.active_waypoints[min(self.route_agent.current_waypoint_idx, len(self.route_agent.active_waypoints)-1)]["name"],
                "distance_remaining_km": round(self.route_agent.calculate_total_distance(self.route_agent.active_waypoints) / 1000.0, 2),
                "eta_minutes": 5.8,
                "active_hospital_name": active_hosp["name"],
                "hospital_emergency_beds": active_hosp.get("emergency_beds_available", 12),
                "hospital_trauma_status": active_hosp.get("trauma_team_status", "STANDBY"),
                "active_road_alerts": self.road_safety_agent.active_road_alerts_count,
                "suppressed_building_alerts": self.road_safety_agent.suppressed_building_alerts_count,
                "bottlenecks_detected": len(self.traffic_agent.active_alerts),
                "route_changed_reason": self.route_agent.route_changed_reason or "Bottleneck detected at Uppal Junction.",
                "patient_name": "Rajeshwar Rao",
                "patient_location": "Secunderabad Rail Nilayam Entrance",
                "patient_condition": "Severe acute chest pain, suspected myocardial infarction"
            }

        res = self.voice_agent.generate_response(query, context)

        # Autonomous action triggers based on voice
        if res["intent"] == "emergency_control_activate" and self.mission_agent.current_state == "IDLE":
            self.activate_emergency()
        elif res["intent"] == "patient_status_confirm" and self.mission_agent.current_state in ["EN_ROUTE_PATIENT", "NEAR_PATIENT"]:
            self.confirm_patient_pickup()
        elif "change the hospital" in query.lower() or "switch hospital" in query.lower():
            if self.hospital_agent.active_hospital_id == "HOSP-GANDHI":
                self.change_destination_hospital("HOSP-YASHODA")
            else:
                self.change_destination_hospital("HOSP-GANDHI")

        return res
