"""Route Intelligence Agent for AURA Prototype
Calculates optimal routes, monitors progress, evaluates alternatives,
and recomputes routes when traffic conditions change.
"""
import math
from typing import List, Dict, Any, Tuple, Optional
from backend.geospatial.hyderabad_data import (
    haversine_distance,
    generate_corridor_waypoints,
    PRIMARY_ROUTE_TO_PATIENT,
    ALTERNATE_ROUTE_TO_PATIENT,
    ROUTE_PATIENT_TO_GANDHI_HOSPITAL,
    ROUTE_PATIENT_TO_YASHODA,
    ROUTE_PATIENT_TO_KIMS,
    HOSPITALS
)

class RouteAgent:
    def __init__(self):
        self.active_route_type = "PRIMARY"  # PRIMARY or ALTERNATE
        self.active_waypoints: List[Dict[str, Any]] = [dict(w) for w in PRIMARY_ROUTE_TO_PATIENT]
        self.current_waypoint_idx = 0
        self.phase = "TO_PATIENT"  # TO_PATIENT or TO_HOSPITAL
        self.active_hospital_id = "HOSP-GANDHI"
        self.route_changed_reason = ""

    def calculate_total_distance(self, waypoints: List[Dict[str, Any]]) -> float:
        total = 0.0
        for i in range(len(waypoints) - 1):
            p1 = (waypoints[i]["lat"], waypoints[i]["lng"])
            p2 = (waypoints[i+1]["lat"], waypoints[i+1]["lng"])
            total += haversine_distance(p1, p2)
        return total

    def estimate_travel_time_seconds(self, waypoints: List[Dict[str, Any]], avg_speed_kmh: float = 45.0, congestion_penalty_sec: float = 0.0) -> int:
        dist_m = self.calculate_total_distance(waypoints)
        speed_mps = (avg_speed_kmh * 1000.0) / 3600.0
        base_seconds = dist_m / max(speed_mps, 1.0)
        return int(base_seconds + congestion_penalty_sec)

    def switch_to_alternate_route(self, reason: str = "Severe congestion detected at Uppal Crossroads (J-1).") -> Dict[str, Any]:
        """Switches from primary route to Nacharam/Mallapur bypass corridor."""
        self.active_route_type = "ALTERNATE"
        self.route_changed_reason = reason
        # Set active waypoints to alternate route
        self.active_waypoints = [dict(w) for w in ALTERNATE_ROUTE_TO_PATIENT]
        self.current_waypoint_idx = min(self.current_waypoint_idx, len(self.active_waypoints) - 1)
        
        primary_time = self.estimate_travel_time_seconds(PRIMARY_ROUTE_TO_PATIENT, avg_speed_kmh=25.0, congestion_penalty_sec=240.0)
        alt_time = self.estimate_travel_time_seconds(ALTERNATE_ROUTE_TO_PATIENT, avg_speed_kmh=50.0, congestion_penalty_sec=0.0)
        time_saved_min = round((primary_time - alt_time) / 60.0, 1)

        return {
            "success": True,
            "new_route_name": "Nacharam-Mallapur Bypass Corridor",
            "time_saved_minutes": max(time_saved_min, 3.2),
            "reason": reason
        }

    def switch_to_primary_route(self, reason: str = "Traffic cleared on primary corridor.") -> Dict[str, Any]:
        self.active_route_type = "PRIMARY"
        self.route_changed_reason = reason
        self.active_waypoints = [dict(w) for w in PRIMARY_ROUTE_TO_PATIENT]
        return {
            "success": True,
            "new_route_name": "Uppal-Habsiguda Primary Corridor",
            "reason": reason
        }

    def set_custom_patient_destination(
        self, 
        patient_lat: float, 
        patient_lng: float, 
        location_name: str,
        current_amb_lat: float,
        current_amb_lng: float
    ) -> Dict[str, Any]:
        """Dynamically re-routes ambulance to a driver-specified patient pickup location."""
        self.phase = "TO_PATIENT"
        self.active_route_type = "CUSTOM_PICKUP"
        self.route_changed_reason = f"Driver set custom patient pickup: {location_name}"
        
        # Generate optimal corridor waypoints from current ambulance position to custom pickup point
        self.active_waypoints = generate_corridor_waypoints(
            start_lat=current_amb_lat,
            start_lng=current_amb_lng,
            end_lat=patient_lat,
            end_lng=patient_lng,
            end_name=f"Pickup: {location_name}"
        )
        self.current_waypoint_idx = 0
        total_dist_km = round(self.calculate_total_distance(self.active_waypoints) / 1000.0, 2)
        eta_min = round(self.estimate_travel_time_seconds(self.active_waypoints, avg_speed_kmh=45.0) / 60.0, 1)

        return {
            "success": True,
            "route_name": f"Corridor to {location_name}",
            "distance_km": total_dist_km,
            "eta_minutes": eta_min,
            "waypoints": self.active_waypoints
        }

    def switch_to_hospital_phase(
        self, 
        hospital_id: str = "HOSP-GANDHI", 
        from_lat: Optional[float] = None, 
        from_lng: Optional[float] = None,
        custom_hosp: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Transitions route to chosen destination hospital from patient location or current position."""
        self.phase = "TO_HOSPITAL"
        self.active_hospital_id = hospital_id
        hosp_info = custom_hosp or HOSPITALS.get(self.active_hospital_id, {})
        hosp_name = hosp_info.get("name", "Gandhi Hospital")
        hosp_lat = hosp_info.get("lat", 17.4241)
        hosp_lng = hosp_info.get("lng", 78.5034)

        if from_lat is not None and from_lng is not None:
            self.active_waypoints = generate_corridor_waypoints(
                start_lat=from_lat,
                start_lng=from_lng,
                end_lat=hosp_lat,
                end_lng=hosp_lng,
                end_name=f"Hospital: {hosp_name}"
            )
        elif hospital_id == "HOSP-YASHODA":
            self.active_waypoints = [dict(w) for w in ROUTE_PATIENT_TO_YASHODA]
        elif hospital_id == "HOSP-KIMS":
            self.active_waypoints = [dict(w) for w in ROUTE_PATIENT_TO_KIMS]
        elif hospital_id == "HOSP-GANDHI":
            self.active_waypoints = [dict(w) for w in ROUTE_PATIENT_TO_GANDHI_HOSPITAL]
        else:
            # Apollo, NIMS, Care, Osmania or Custom Hospital
            start_p = (from_lat or 17.4411, from_lng or 78.5015)
            self.active_waypoints = generate_corridor_waypoints(
                start_lat=start_p[0],
                start_lng=start_p[1],
                end_lat=hosp_lat,
                end_lng=hosp_lng,
                end_name=f"Hospital: {hosp_name}"
            )
            
        self.current_waypoint_idx = 0
        total_dist_km = round(self.calculate_total_distance(self.active_waypoints) / 1000.0, 2)
        return {
            "success": True,
            "phase": "TO_HOSPITAL",
            "hospital_name": hosp_name,
            "distance_km": total_dist_km or hosp_info.get("distance_from_patient_km", 2.1),
            "waypoints": self.active_waypoints
        }

    def calculate_heading(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
        lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
        dlon = lon2 - lon1
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        initial_bearing = math.atan2(y, x)
        initial_bearing = math.degrees(initial_bearing)
        compass_bearing = (initial_bearing + 360.0) % 360.0
        return round(compass_bearing, 1)

    def update_nearest_waypoint(self, current_lat: float, current_lng: float) -> int:
        """Finds the closest waypoint along the active route to the ambulance's current location."""
        if not self.active_waypoints:
            return 0
        min_dist = float("inf")
        closest_idx = self.current_waypoint_idx
        for i, wp in enumerate(self.active_waypoints):
            dist = haversine_distance((current_lat, current_lng), (wp["lat"], wp["lng"]))
            if dist < min_dist:
                min_dist = dist
                closest_idx = i
        # Advance if very close (< 40m) to current waypoint
        if min_dist < 40.0 and closest_idx < len(self.active_waypoints) - 1:
            self.current_waypoint_idx = closest_idx + 1
        else:
            self.current_waypoint_idx = closest_idx
        return self.current_waypoint_idx

    def get_remaining_distance(self, current_lat: float, current_lng: float) -> float:
        if self.current_waypoint_idx >= len(self.active_waypoints):
            return 0.0
        
        # Distance to next waypoint
        next_wp = self.active_waypoints[self.current_waypoint_idx]
        total = haversine_distance((current_lat, current_lng), (next_wp["lat"], next_wp["lng"]))
        
        # Plus distance between remaining waypoints
        for i in range(self.current_waypoint_idx, len(self.active_waypoints) - 1):
            p1 = (self.active_waypoints[i]["lat"], self.active_waypoints[i]["lng"])
            p2 = (self.active_waypoints[i+1]["lat"], self.active_waypoints[i+1]["lng"])
            total += haversine_distance(p1, p2)
        return round(total, 1)

    def get_route_info(self, current_lat: float, current_lng: float, current_speed_kmh: float = 45.0) -> Dict[str, Any]:
        dist_m = self.get_remaining_distance(current_lat, current_lng)
        speed_mps = max((current_speed_kmh * 1000.0) / 3600.0, 5.0)
        eta_sec = int(dist_m / speed_mps)

        next_wp_name = "Destination Reached"
        if self.current_waypoint_idx < len(self.active_waypoints):
            next_wp_name = self.active_waypoints[self.current_waypoint_idx]["name"]

        return {
            "active_route_type": self.active_route_type,
            "route_name": "Nacharam Bypass" if self.active_route_type == "ALTERNATE" else "Uppal-Habsiguda Corridor",
            "phase": self.phase,
            "distance_remaining_m": dist_m,
            "distance_remaining_km": round(dist_m / 1000.0, 2),
            "eta_seconds": eta_sec,
            "eta_minutes": round(eta_sec / 60.0, 1),
            "current_waypoint_index": self.current_waypoint_idx,
            "total_waypoints": len(self.active_waypoints),
            "next_waypoint_name": next_wp_name,
            "waypoints": self.active_waypoints,
            "route_changed_reason": self.route_changed_reason
        }
