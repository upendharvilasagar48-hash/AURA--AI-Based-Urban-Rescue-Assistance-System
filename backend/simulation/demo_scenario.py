"""AURA 1-Click Automated Demo Scenario Runner
Automates the full academic demonstration narrative:
Emergency Call -> Boduppal Departure -> Uppal Congestion Event ->
AURA Reroute via Nacharam -> Police Alert -> 50m Road-User Siren Alert ->
Inside-Building Suppression -> Patient Pickup -> Hospital Transit -> Mission Completed!
"""
import asyncio
from typing import Dict, Any, Callable, Optional
from backend.simulation.sim_engine import SimulationEngine

class DemoScenarioRunner:
    def __init__(self, sim_engine: SimulationEngine):
        self.sim_engine = sim_engine
        self.coordinator = sim_engine.coordinator
        self.is_running = False
        self.current_step = 0
        self.demo_task: Optional[asyncio.Task] = None

    async def run_scenario(self, broadcast_callback: Callable[[Dict[str, Any]], Any]):
        """Executes the complete scenario step-by-step with realistic timing."""
        self.is_running = True
        self.sim_engine.demo_mode_active = True
        self.sim_engine.reset()

        try:
            # STEP 1: Emergency Activated
            self.coordinator.record_event("DEMO", "DEMO STARTED: Emergency call received for critical cardiac patient at Secunderabad.")
            self.coordinator.activate_emergency()
            self.sim_engine.play()
            self.sim_engine.set_speed(2.0)
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(3.0)

            # STEP 2: Moving along Boduppal Main Road
            self.coordinator.record_event("DEMO", "Ambulance en route through Boduppal. Speed: 50 km/h.")
            for _ in range(3):
                await broadcast_callback(self.sim_engine.tick())
                await asyncio.sleep(1.0)

            # STEP 3: Inject Traffic Congestion at Uppal Crossroads (J-1)
            self.coordinator.record_event("DEMO", "SCENARIO INJECTION: Heavy traffic gridlock appears at Uppal Circle (J-1) due to signal failure.")
            self.coordinator.traffic_agent.set_junction_traffic(
                junction_id="J1_UPPAL",
                congestion_level="GRIDLOCK",
                congestion_index=95,
                delay_minutes=4.5
            )
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(2.0)

            # STEP 4: AURA Coordinator detects congestion and reroutes via Nacharam bypass
            self.coordinator.record_event("DEMO", "AI AGENT INTERVENTION: Route Intelligence detected +4.5 min delay. Switched to Nacharam Bypass!")
            self.coordinator.voice_agent.generate_response(
                "Why did you change the route?",
                {"route_changed_reason": "Gridlock at Uppal Circle. Rerouted via Nacharam bypass saving 3.4 minutes."}
            )
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(2.0)

            # STEP 5: Traffic Police Green Corridor Alert
            self.coordinator.record_event("DEMO", "POLICE COORDINATION: Traffic Police command console alerted. Green corridor priority granted at Tarnaka Hub.")
            self.coordinator.traffic_agent.grant_green_corridor("J3_TARNAKA")
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(2.0)

            # STEP 6: Connected Vehicle Warning Zone (50m Road-only check)
            self.coordinator.record_event("DEMO", "50M GEOFENCE TRIGGER: Connected car TS-08-EV-2024 alerted on carriageway. Siren sounding.")
            self.coordinator.record_event("DEMO", "GEOFENCE SUPPRESSION: Sneha Enclave apartment smartphone filtered out (inside building).")
            for _ in range(4):
                await broadcast_callback(self.sim_engine.tick())
                await asyncio.sleep(1.0)

            # Fast forward to Patient location
            while self.sim_engine.segment_idx < len(self.coordinator.route_agent.active_waypoints) - 1:
                await broadcast_callback(self.sim_engine.tick())
                await asyncio.sleep(0.5)

            # STEP 7: Reached Patient Location
            self.coordinator.record_event("DEMO", "PATIENT REACHED: Ambulance at Secunderabad Rail Nilayam pickup point.")
            self.coordinator.mission_agent.mark_near_patient(0.0)
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(3.0)

            # STEP 8: Paramedic Confirms Pickup
            self.coordinator.record_event("DEMO", "PATIENT ONBOARD: Critical cardiac patient stabilized. Switching to Gandhi Hospital Trauma Bay route.")
            self.coordinator.confirm_patient_pickup()
            self.sim_engine.play()
            self.sim_engine.segment_idx = 0
            self.sim_engine.segment_progress = 0.0
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(2.0)

            # STEP 9: Hospital Transit Phase
            while self.sim_engine.segment_idx < len(self.coordinator.route_agent.active_waypoints) - 1:
                await broadcast_callback(self.sim_engine.tick())
                await asyncio.sleep(0.6)

            # STEP 10: Arrive at Hospital
            self.coordinator.record_event("DEMO", "HOSPITAL ARRIVAL: Reached Gandhi Hospital Emergency Trauma Bay.")
            self.coordinator.mission_agent.mark_hospital_arrival()
            await broadcast_callback(self.sim_engine.tick())
            await asyncio.sleep(3.0)

            # STEP 11: Mission Completed
            self.coordinator.record_event("DEMO", "MISSION COMPLETED: Handover to trauma team complete. Total rescue time optimized by 35%.")
            self.coordinator.complete_mission()
            self.sim_engine.pause()
            self.sim_engine.demo_mode_active = False
            await broadcast_callback(self.sim_engine.tick())

        except asyncio.CancelledError:
            self.coordinator.record_event("DEMO", "Demo scenario was cancelled.")
        finally:
            self.is_running = False
            self.sim_engine.demo_mode_active = False
