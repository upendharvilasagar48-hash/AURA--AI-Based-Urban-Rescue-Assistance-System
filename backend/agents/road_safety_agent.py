"""Road Safety Agent for AURA Prototype
Implements the 50-meter Emergency Warning Zone with ROAD-ONLY Geofencing Logic.
Distinguishes between connected road users/vehicles and devices located inside buildings/houses.
"""
from typing import List, Dict, Any
from backend.geospatial.hyderabad_data import (
    haversine_distance,
    SIMULATED_CONNECTED_DEVICES
)

class RoadSafetyAgent:
    def __init__(self):
        # Deep copy simulated connected devices
        self.devices: List[Dict[str, Any]] = [dict(d) for d in SIMULATED_CONNECTED_DEVICES]
        self.alert_history: List[Dict[str, Any]] = []
        self.active_road_alerts_count = 0
        self.suppressed_building_alerts_count = 0

    def evaluate_devices(self, ambulance_lat: float, ambulance_lng: float, ambulance_heading: float = 0.0) -> List[Dict[str, Any]]:
        """Evaluates all registered devices against the 50-meter emergency zone and road-only filter."""
        evaluated = []
        active_alerts = 0
        suppressed_count = 0

        for dev in self.devices:
            dist = haversine_distance((ambulance_lat, ambulance_lng), (dev["lat"], dev["lng"]))
            in_zone = dist <= 50.0

            # Determine Road vs Building Geofencing Logic
            if in_zone:
                if dev.get("is_on_road", False):
                    # QUALIFYING ROAD USER: Trigger high-priority warning
                    status = "ALERT_DISPATCHED"
                    active_alerts += 1
                    msg = "🚨 EMERGENCY VEHICLE APPROACHING — PULL TO LEFT"
                    sound = True
                    log_reason = f"Road vehicle {dev['label']} within {round(dist, 1)}m carriageway zone."
                else:
                    # INSIDE BUILDING: Filter out and suppress siren
                    status = "FILTERED_OUT_BUILDING"
                    suppressed_count += 1
                    bld = dev.get("building_name", "residential building")
                    msg = f"Alert suppressed: device located inside {bld}."
                    sound = False
                    log_reason = f"Suppressed false alarm: {dev['label']} located inside {bld} ({round(dist, 1)}m away)."
            else:
                status = "OUT_OF_ZONE"
                msg = "Normal monitoring"
                sound = False
                log_reason = f"Beyond 50m warning boundary ({round(dist, 1)}m away)."

            item = {
                **dev,
                "distance_to_ambulance_m": round(dist, 1),
                "in_50m_zone": in_zone,
                "alert_status": status,
                "warning_message": msg,
                "play_emergency_sound": sound,
                "log_reason": log_reason
            }
            evaluated.append(item)

            # Record transition into history if newly alerted or suppressed
            if in_zone:
                self.alert_history.append({
                    "device_id": dev["device_id"],
                    "label": dev["label"],
                    "is_on_road": dev.get("is_on_road", False),
                    "distance_m": round(dist, 1),
                    "status": status,
                    "reason": log_reason
                })

        self.active_road_alerts_count = active_alerts
        self.suppressed_building_alerts_count = suppressed_count
        return evaluated

    def add_custom_device(self, device_data: Dict[str, Any]) -> Dict[str, Any]:
        self.devices.append(device_data)
        return {"success": True, "device_id": device_data["device_id"]}

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_registered_devices": len(self.devices),
            "active_road_alerts": self.active_road_alerts_count,
            "suppressed_building_alerts": self.suppressed_building_alerts_count,
            "total_alert_events": len(self.alert_history)
        }
