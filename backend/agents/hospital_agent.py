"""Hospital Intelligence Agent for AURA Prototype
Manages destination hospital, tracks emergency bay and ICU availability,
coordinates triage readiness and supports dynamic hospital diversions.
"""
from typing import Dict, Any, List
from backend.geospatial.hyderabad_data import HOSPITALS

class HospitalAgent:
    def __init__(self, initial_hospital_id: str = "HOSP-GANDHI"):
        self.hospitals: Dict[str, Dict[str, Any]] = {k: dict(v) for k, v in HOSPITALS.items()}
        self.active_hospital_id = initial_hospital_id

    def get_active_hospital(self) -> Dict[str, Any]:
        return self.hospitals.get(self.active_hospital_id, self.hospitals["HOSP-GANDHI"])

    def get_all_hospitals(self) -> List[Dict[str, Any]]:
        return list(self.hospitals.values())

    def switch_hospital(self, hospital_id: str, reason: str = "Driver or medical team requested alternate facility.") -> Dict[str, Any]:
        if hospital_id not in self.hospitals:
            raise KeyError(f"Unknown hospital ID: {hospital_id}")

        prev_id = self.active_hospital_id
        self.active_hospital_id = hospital_id
        new_hosp = self.hospitals[hospital_id]

        # Update trauma readiness status
        new_hosp["trauma_team_status"] = "MOBILIZED_PREPARING_BAY"

        return {
            "success": True,
            "previous_hospital_id": prev_id,
            "new_hospital_id": hospital_id,
            "hospital_name": new_hosp["name"],
            "distance_km": new_hosp["distance_from_patient_km"],
            "reason": reason
        }

    def update_eta(self, eta_seconds: int) -> Dict[str, Any]:
        current = self.get_active_hospital()
        current["current_eta_seconds"] = eta_seconds
        current["current_eta_minutes"] = round(eta_seconds / 60.0, 1)
        return {
            "hospital_id": self.active_hospital_id,
            "eta_minutes": current["current_eta_minutes"],
            "status": "TRIAGE_ALERT_TRANSMITTED"
        }

    def register_custom_hospital(self, hosp_data: Dict[str, Any]) -> Dict[str, Any]:
        """Allows driver to register and immediately select a custom destination hospital."""
        hosp_id = hosp_data.get("id") or f"HOSP-CUSTOM-{len(self.hospitals) + 1}"
        hosp_entry = {
            "id": hosp_id,
            "name": hosp_data.get("name", "Custom Emergency Hospital"),
            "locality": hosp_data.get("locality", "Hyderabad"),
            "lat": float(hosp_data["lat"]),
            "lng": float(hosp_data["lng"]),
            "type": hosp_data.get("type", "Custom Hospital Facility"),
            "emergency_beds_available": hosp_data.get("emergency_beds_available", 10),
            "icu_beds_available": hosp_data.get("icu_beds_available", 4),
            "trauma_team_status": "READY",
            "distance_from_patient_km": hosp_data.get("distance_from_patient_km", 5.0),
            "normal_eta_min": hosp_data.get("normal_eta_min", 8)
        }
        self.hospitals[hosp_id] = hosp_entry
        self.active_hospital_id = hosp_id
        return hosp_entry

