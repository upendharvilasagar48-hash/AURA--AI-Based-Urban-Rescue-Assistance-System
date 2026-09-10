"""Traffic Intelligence Agent for AURA Prototype
Monitors junction congestion, detects bottlenecks, estimates delays,
recommends green corridor intervention to the traffic police dashboard.
"""
from typing import Dict, Any, List
from backend.geospatial.hyderabad_data import TRAFFIC_JUNCTIONS, haversine_distance

class TrafficAgent:
    def __init__(self):
        # Deep copy of junctions so simulation can mutate them dynamically
        self.junctions: Dict[str, Dict[str, Any]] = {k: dict(v) for k, v in TRAFFIC_JUNCTIONS.items()}
        self.active_alerts: List[Dict[str, Any]] = []

    def set_junction_traffic(self, junction_id: str, congestion_level: str, congestion_index: int, delay_minutes: float) -> Dict[str, Any]:
        if junction_id not in self.junctions:
            raise KeyError(f"Unknown junction: {junction_id}")

        j = self.junctions[junction_id]
        j["congestion_level"] = congestion_level
        j["congestion_index"] = congestion_index
        j["delay_minutes"] = delay_minutes

        alert = None
        if congestion_level in ["HEAVY", "GRIDLOCK"]:
            alert = {
                "junction_id": junction_id,
                "junction_name": j["name"],
                "congestion_level": congestion_level,
                "delay_minutes": delay_minutes,
                "recommended_action": "ACTIVATE_GREEN_CORRIDOR_OR_REROUTE",
                "message": f"Critical bottleneck detected at {j['name']}! Estimated delay: +{delay_minutes} mins."
            }
            self.active_alerts.append(alert)

        return {"success": True, "junction": j, "alert": alert}

    def grant_green_corridor(self, junction_id: str) -> Dict[str, Any]:
        if junction_id not in self.junctions:
            raise KeyError(f"Unknown junction: {junction_id}")

        j = self.junctions[junction_id]
        j["green_corridor_active"] = True
        j["congestion_level"] = "GREEN_WAVE"
        j["congestion_index"] = 5
        j["delay_minutes"] = 0.0

        return {
            "success": True,
            "junction_id": junction_id,
            "message": f"Traffic Police granted Green Corridor priority at {j['name']}! Signals synchronized green."
        }

    def revoke_green_corridor(self, junction_id: str) -> Dict[str, Any]:
        if junction_id in self.junctions:
            self.junctions[junction_id]["green_corridor_active"] = False
            self.junctions[junction_id]["congestion_level"] = "NORMAL"
            self.junctions[junction_id]["congestion_index"] = 25
            self.junctions[junction_id]["delay_minutes"] = 1.0
        return {"success": True, "junction_id": junction_id}

    def assess_bottlenecks_ahead(self, ambulance_lat: float, ambulance_lng: float) -> List[Dict[str, Any]]:
        """Identifies upcoming junctions within 2.5km of the ambulance with significant delay."""
        bottlenecks = []
        for j_id, j_data in self.junctions.items():
            dist = haversine_distance((ambulance_lat, ambulance_lng), (j_data["lat"], j_data["lng"]))
            if dist <= 3000.0:  # Within 3 km ahead
                if j_data["congestion_level"] in ["HEAVY", "GRIDLOCK"] and not j_data["green_corridor_active"]:
                    bottlenecks.append({
                        "junction_id": j_id,
                        "name": j_data["name"],
                        "distance_m": round(dist, 1),
                        "congestion_level": j_data["congestion_level"],
                        "delay_minutes": j_data["delay_minutes"],
                        "action_needed": "REROUTE_OR_POLICE_OVERRIDE"
                    })
        return bottlenecks

    def get_all_junctions(self) -> Dict[str, Any]:
        return self.junctions
