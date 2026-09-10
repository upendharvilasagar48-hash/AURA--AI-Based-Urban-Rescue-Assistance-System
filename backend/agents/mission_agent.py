"""Mission State Agent for AURA Prototype
Maintains and transitions the 9-state finite state machine:
IDLE
-> EMERGENCY_ACTIVATED
-> ROUTE_PLANNING
-> EN_ROUTE_PATIENT
-> NEAR_PATIENT
-> PATIENT_PICKED_UP
-> EN_ROUTE_HOSPITAL
-> HOSPITAL_ARRIVAL
-> MISSION_COMPLETED
"""
from typing import Dict, Any, List

class MissionAgent:
    STATES = [
        "IDLE",
        "EMERGENCY_ACTIVATED",
        "ROUTE_PLANNING",
        "EN_ROUTE_PATIENT",
        "NEAR_PATIENT",
        "PATIENT_PICKED_UP",
        "EN_ROUTE_HOSPITAL",
        "HOSPITAL_ARRIVAL",
        "MISSION_COMPLETED"
    ]

    def __init__(self, initial_state: str = "IDLE"):
        self.current_state = initial_state
        self.state_history: List[Dict[str, Any]] = []
        self.log_transition("SYSTEM_INIT", "Mission agent initialized in IDLE state.")

    def log_transition(self, trigger: str, notes: str = ""):
        self.state_history.append({
            "state": self.current_state,
            "trigger": trigger,
            "notes": notes
        })

    def transition_to(self, new_state: str, trigger: str = "", notes: str = "") -> bool:
        if new_state not in self.STATES:
            raise ValueError(f"Invalid state: {new_state}")

        old_state = self.current_state
        self.current_state = new_state
        self.log_transition(trigger or f"Transition to {new_state}", notes or f"Shifted from {old_state} to {new_state}")
        return True

    def activate_emergency(self, notes: str = "Driver or 108 Dispatch activated emergency mode.") -> bool:
        self.transition_to("EMERGENCY_ACTIVATED", "EMERGENCY_BUTTON_PRESSED", notes)
        self.transition_to("ROUTE_PLANNING", "AUTONOMOUS_PLANNING", "Route Intelligence agent calculating optimal Hyderabad route.")
        self.transition_to("EN_ROUTE_PATIENT", "ROUTE_READY", "Ambulance en route from Boduppal to Secunderabad patient location.")
        return True

    def mark_near_patient(self, distance_m: float) -> bool:
        if self.current_state == "EN_ROUTE_PATIENT":
            self.transition_to("NEAR_PATIENT", "GEOFENCE_PROXIMITY", f"Ambulance is within {distance_m:.1f}m of patient pickup point.")
            return True
        return False

    def confirm_patient_pickup(self, notes: str = "Patient onboarded, vitals stabilized.") -> bool:
        self.transition_to("PATIENT_PICKED_UP", "PARAMEDIC_CONFIRMATION", notes)
        self.transition_to("EN_ROUTE_HOSPITAL", "HOSPITAL_TRANSIT_BEGINS", "Transporting patient to Gandhi Hospital Emergency Trauma Bay.")
        return True

    def mark_hospital_arrival(self) -> bool:
        self.transition_to("HOSPITAL_ARRIVAL", "TRAUMA_BAY_REACHED", "Arrived at destination hospital emergency triage bay.")
        return True

    def complete_mission(self) -> bool:
        self.transition_to("MISSION_COMPLETED", "TRIAGE_HANDOVER", "Patient successfully handed over to Emergency Trauma Team.")
        return True

    def reset_to_idle(self) -> bool:
        self.transition_to("IDLE", "MISSION_RESET", "System returned to idle standby.")
        return True

    def get_status(self) -> Dict[str, Any]:
        return {
            "current_state": self.current_state,
            "is_emergency_active": self.current_state not in ["IDLE", "MISSION_COMPLETED"],
            "phase": "TO_PATIENT" if self.current_state in ["EMERGENCY_ACTIVATED", "ROUTE_PLANNING", "EN_ROUTE_PATIENT", "NEAR_PATIENT"] else ("TO_HOSPITAL" if self.current_state in ["PATIENT_PICKED_UP", "EN_ROUTE_HOSPITAL", "HOSPITAL_ARRIVAL"] else "STANDBY"),
            "total_transitions": len(self.state_history)
        }
