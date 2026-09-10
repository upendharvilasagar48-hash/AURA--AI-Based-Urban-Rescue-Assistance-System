"""AURA Real-Time Simulation Engine
Manages clock ticks, smooth vehicle interpolation, speed multiplier,
live telemetry generation, and agent cycle triggering.
"""
import math
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Callable

from backend.agents.coordinator import AuraCoordinator
from backend.geospatial.hyderabad_data import (
    haversine_distance,
    PRIMARY_ROUTE_TO_PATIENT,
    DEFAULT_PATIENT,
    DEFAULT_AMBULANCE
)

class SimulationEngine:
    def __init__(self, coordinator: AuraCoordinator):
        self.coordinator = coordinator
        self.is_running = False
        self.simulation_speed = 1.0  # 1x, 2x, 5x
        self.tick_rate_seconds = 1.0  # Real-world base tick interval
        self.demo_mode_active = False
        self.tracking_mode = "DEMO"  # "DEMO" or "REAL_GPS"
        self.last_real_gps_time: Optional[str] = None
        self.gps_accuracy_m: Optional[float] = None

        # Current Ambulance Dynamic State
        start_wp = PRIMARY_ROUTE_TO_PATIENT[0]
        self.ambulance_lat = start_wp["lat"]
        self.ambulance_lng = start_wp["lng"]
        self.heading_deg = 270.0
        self.speed_kmh = 0.0

        # Waypoint Progression
        self.segment_idx = 0
        self.segment_progress = 0.0  # 0.0 to 1.0 between waypoint[i] and waypoint[i+1]
        self.step_size = 0.15        # Fraction of segment covered per tick

        # Dynamic Patient State (Customizable by Driver)
        self.patient = dict(DEFAULT_PATIENT)

        # Callbacks for telemetry broadcast
        self.telemetry_callbacks: List[Callable[[Dict[str, Any]], Any]] = []

    def register_telemetry_callback(self, cb: Callable[[Dict[str, Any]], Any]):
        self.telemetry_callbacks.append(cb)

    def set_speed(self, speed: float):
        self.simulation_speed = max(0.5, min(speed, 10.0))

    def set_tracking_mode(self, mode: str):
        """Sets tracking mode to either 'REAL_GPS' or 'DEMO'."""
        self.tracking_mode = "REAL_GPS" if mode.upper() == "REAL_GPS" else "DEMO"
        if self.tracking_mode == "REAL_GPS":
            self.is_running = False
            self.demo_mode_active = False

    def update_real_location(
        self,
        lat: float,
        lng: float,
        speed_kmh: float = 0.0,
        heading_deg: Optional[float] = None,
        accuracy: Optional[float] = None,
        tracking_mode: str = "REAL_GPS"
    ) -> Dict[str, Any]:
        """Receives live smartphone / device GPS updates and synchronizes AURA state."""
        self.tracking_mode = tracking_mode
        self.last_real_gps_time = datetime.now(timezone.utc).isoformat()
        self.gps_accuracy_m = accuracy

        # If heading wasn't provided or is 0, calculate from last position if moved
        if heading_deg is not None and heading_deg > 0:
            self.heading_deg = round(float(heading_deg), 1)
        elif abs(lat - self.ambulance_lat) > 0.00005 or abs(lng - self.ambulance_lng) > 0.00005:
            self.heading_deg = round(self.calculate_heading(self.ambulance_lat, self.ambulance_lng, lat, lng), 1)

        self.ambulance_lat = float(lat)
        self.ambulance_lng = float(lng)
        self.speed_kmh = max(0.0, round(float(speed_kmh), 1))

        # Update Route Agent's nearest waypoint
        self.coordinator.route_agent.update_nearest_waypoint(self.ambulance_lat, self.ambulance_lng)

        # Automatic milestone transitions based on proximity to dynamic patient or hospital
        patient_lat = self.patient["lat"]
        patient_lng = self.patient["lng"]
        dist_to_patient = haversine_distance((self.ambulance_lat, self.ambulance_lng), (patient_lat, patient_lng))

        active_hosp = self.coordinator.hospital_agent.get_active_hospital()
        dist_to_hospital = haversine_distance((self.ambulance_lat, self.ambulance_lng), (active_hosp["lat"], active_hosp["lng"]))

        if self.coordinator.route_agent.phase == "TO_PATIENT":
            if dist_to_patient <= 60.0:
                self.coordinator.mission_agent.mark_near_patient(dist_to_patient)
        elif self.coordinator.route_agent.phase == "TO_HOSPITAL":
            if dist_to_hospital <= 60.0:
                self.coordinator.mission_agent.mark_hospital_arrival()

        # Run Coordinator cycle
        cycle_result = self.coordinator.run_cycle(self.ambulance_lat, self.ambulance_lng, self.speed_kmh)
        snapshot = self.get_telemetry_snapshot(cycle_result)
        return snapshot

    def update_patient_location(
        self,
        location_name: str,
        lat: float,
        lng: float,
        name: Optional[str] = None,
        condition: Optional[str] = None,
        vitals: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Updates patient pickup coordinates & details, and recalculates navigation corridor."""
        self.patient["location_name"] = location_name
        self.patient["lat"] = float(lat)
        self.patient["lng"] = float(lng)
        if name:
            self.patient["name"] = name
        if condition:
            self.patient["condition"] = condition
        if vitals:
            self.patient["vitals"] = {**self.patient.get("vitals", {}), **vitals}

        # Dynamically re-plan route from ambulance's current location to this new pickup spot
        route_res = self.coordinator.route_agent.set_custom_patient_destination(
            patient_lat=self.patient["lat"],
            patient_lng=self.patient["lng"],
            location_name=location_name,
            current_amb_lat=self.ambulance_lat,
            current_amb_lng=self.ambulance_lng
        )
        self.segment_idx = 0
        self.segment_progress = 0.0

        # Log decision in coordinator
        self.coordinator.log_decision(
            "Driver & RouteAgent",
            "UPDATE_PATIENT_PICKUP_LOCATION",
            f"Pickup location updated to '{location_name}' ({lat:.4f}, {lng:.4f}). Route recalculated ({route_res['distance_km']} km, ETA ~{route_res['eta_minutes']} min)."
        )

        return self.get_telemetry_snapshot()

    def play(self):
        self.is_running = True

    def pause(self):
        self.is_running = False

    def reset(self):
        self.patient = dict(DEFAULT_PATIENT)
        self.is_running = False
        self.demo_mode_active = False
        self.tracking_mode = "DEMO"
        self.coordinator.reset_mission()
        start_wp = PRIMARY_ROUTE_TO_PATIENT[0]
        self.ambulance_lat = start_wp["lat"]
        self.ambulance_lng = start_wp["lng"]
        self.heading_deg = 270.0
        self.speed_kmh = 0.0
        self.segment_idx = 0
        self.segment_progress = 0.0

    def calculate_heading(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        dlon = math.radians(lon2 - lon1)
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        y = math.sin(dlon) * math.cos(lat2_rad)
        x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(dlon)
        initial_bearing = math.atan2(y, x)
        return (math.degrees(initial_bearing) + 360.0) % 360.0

    def tick(self) -> Dict[str, Any]:
        """Advances simulation by one tick."""
        waypoints = self.coordinator.route_agent.active_waypoints
        mission_state = self.coordinator.mission_agent.current_state

        if self.is_running and mission_state not in ["IDLE", "MISSION_COMPLETED"]:
            # Check if there is another waypoint to travel towards
            if self.segment_idx < len(waypoints) - 1:
                p1 = waypoints[self.segment_idx]
                p2 = waypoints[self.segment_idx + 1]

                # Update heading towards next waypoint
                self.heading_deg = round(self.calculate_heading(p1["lat"], p1["lng"], p2["lat"], p2["lng"]), 1)
                self.speed_kmh = float(p1.get("speed_limit", 45))

                # Advance progress along line segment
                self.segment_progress += self.step_size * self.simulation_speed
                if self.segment_progress >= 1.0:
                    self.segment_progress = 0.0
                    self.segment_idx += 1
                    self.coordinator.route_agent.current_waypoint_idx = self.segment_idx

                    # If reached last waypoint of patient phase
                    if self.coordinator.route_agent.phase == "TO_PATIENT" and self.segment_idx >= len(waypoints) - 1:
                        self.coordinator.mission_agent.mark_near_patient(0.0)
                        self.speed_kmh = 0.0
                    # If reached hospital
                    elif self.coordinator.route_agent.phase == "TO_HOSPITAL" and self.segment_idx >= len(waypoints) - 1:
                        self.coordinator.mission_agent.mark_hospital_arrival()
                        self.speed_kmh = 0.0

                # Current interpolated lat/lng
                if self.segment_idx < len(waypoints) - 1:
                    next_p = waypoints[self.segment_idx + 1]
                    curr_p = waypoints[self.segment_idx]
                    self.ambulance_lat = curr_p["lat"] + (next_p["lat"] - curr_p["lat"]) * self.segment_progress
                    self.ambulance_lng = curr_p["lng"] + (next_p["lng"] - curr_p["lng"]) * self.segment_progress
                else:
                    self.ambulance_lat = waypoints[-1]["lat"]
                    self.ambulance_lng = waypoints[-1]["lng"]
            else:
                self.speed_kmh = 0.0
        else:
            self.speed_kmh = 0.0

        # Trigger AURA Coordinator O-A-D-A-M-R cycle with current position
        cycle_result = self.coordinator.run_cycle(self.ambulance_lat, self.ambulance_lng, self.speed_kmh)

        # Build comprehensive live telemetry state
        telemetry = self.get_telemetry_snapshot(cycle_result)
        return telemetry

    def get_telemetry_snapshot(self, cycle_result: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if cycle_result is None:
            cycle_result = self.coordinator.run_cycle(self.ambulance_lat, self.ambulance_lng, self.speed_kmh)

        route_info = cycle_result["route_info"]
        active_hosp = self.coordinator.hospital_agent.get_active_hospital()

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "mission_id": "MISSION-HYD-001",
            "mission_status": self.coordinator.mission_agent.current_state,
            "phase": self.coordinator.route_agent.phase,
            "ambulance": {
                **DEFAULT_AMBULANCE,
                "lat": round(self.ambulance_lat, 6),
                "lng": round(self.ambulance_lng, 6),
                "heading_deg": self.heading_deg,
                "speed_kmh": round(self.speed_kmh, 1),
                "warning_zone_radius_m": 50.0,
                "tracking_mode": self.tracking_mode,
                "gps_accuracy_m": self.gps_accuracy_m,
                "last_real_gps_time": self.last_real_gps_time
            },
            "patient": self.patient,
            "hospital": {
                **active_hosp,
                "eta_seconds": route_info["eta_seconds"] if self.coordinator.route_agent.phase == "TO_HOSPITAL" else (route_info["eta_seconds"] + 360)
            },
            "navigation": {
                "active_route_type": self.coordinator.route_agent.active_route_type,
                "route_name": route_info["route_name"],
                "distance_remaining_m": route_info["distance_remaining_m"],
                "distance_remaining_km": route_info["distance_remaining_km"],
                "eta_seconds": route_info["eta_seconds"],
                "eta_minutes": route_info["eta_minutes"],
                "current_waypoint_index": self.coordinator.route_agent.current_waypoint_idx,
                "total_waypoints": route_info["total_waypoints"],
                "next_waypoint_name": route_info["next_waypoint_name"],
                "waypoints": route_info["waypoints"],
                "route_changed_reason": self.coordinator.route_agent.route_changed_reason
            },
            "traffic": {
                "junctions": self.coordinator.traffic_agent.get_all_junctions(),
                "bottlenecks": cycle_result["bottlenecks"]
            },
            "road_safety": {
                "devices": cycle_result["devices_eval"],
                "stats": self.coordinator.road_safety_agent.get_stats()
            },
            "agents": {
                "coordinator": {
                    "status": "ACTIVE",
                    "cycle": "OBSERVE_ANALYZE_DECIDE_ACT",
                    "last_explanation": self.coordinator.last_decision_explanation
                },
                "route_agent": {"status": "OPTIMIZING", "mode": self.coordinator.route_agent.active_route_type},
                "traffic_agent": {"status": "MONITORING_JUNCTIONS", "bottlenecks_detected": len(cycle_result["bottlenecks"])},
                "road_safety_agent": {"status": "SCANNING_50M_ZONE", "active_alerts": self.coordinator.road_safety_agent.active_road_alerts_count},
                "hospital_agent": {"status": "COORDINATING_TRAUMA_BAY", "target_hospital": active_hosp["name"]},
                "voice_agent": {"status": "LISTENING_INTENTS", "last_response": self.coordinator.voice_agent.last_response},
                "mission_agent": {"status": self.coordinator.mission_agent.current_state}
            },
            "simulation": {
                "is_running": self.is_running,
                "speed": self.simulation_speed,
                "demo_mode_active": self.demo_mode_active,
                "tracking_mode": self.tracking_mode
            },
            "recent_audit_decisions": self.coordinator.decision_audit_trail[-10:],
            "system_events": self.coordinator.system_events[-15:]
        }
