"""AURA Backend Main Application
FastAPI Server + WebSockets + Multi-Agent Emergency Orchestrator + SQLite Database
"""
import asyncio
import json
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import List, Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.models.database import (
    init_db, 
    get_db, 
    MissionModel, 
    AgentActionModel, 
    AlertLogModel, 
    VoiceInteractionModel,
    AmbulanceLocationLogModel
)
from backend.models.schemas import (
    TrafficInjectionRequest,
    GreenCorridorRequest,
    HospitalChangeRequest,
    VoiceQueryRequest,
    VoiceQueryResponse,
    AmbulanceLocationUpdateRequest,
    AmbulanceModeRequest,
    PatientLocationUpdateRequest,
    CustomHospitalRequest
)
from backend.geospatial.hyderabad_data import HYDERABAD_PICKUP_PRESETS, HOSPITALS
from backend.agents.coordinator import AuraCoordinator
from backend.simulation.sim_engine import SimulationEngine
from backend.simulation.demo_scenario import DemoScenarioRunner

# Initialize Core System Instances
init_db()
coordinator = AuraCoordinator()
sim_engine = SimulationEngine(coordinator)
coordinator.set_sim_engine(sim_engine)
demo_runner = DemoScenarioRunner(sim_engine)

# Active WebSocket Connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for d in disconnected:
            self.disconnect(d)

manager = ConnectionManager()

# Background Simulation Loop
async def background_sim_ticker():
    while True:
        try:
            if sim_engine.is_running and not demo_runner.is_running:
                snapshot = sim_engine.tick()
                await manager.broadcast(snapshot)
            await asyncio.sleep(1.0 / max(sim_engine.simulation_speed, 0.5))
        except Exception as e:
            await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background ticker task
    ticker_task = asyncio.create_task(background_sim_ticker())
    yield
    # Shutdown
    ticker_task.cancel()

app = FastAPI(
    title="AURA Emergency Response Platform API",
    description="Agentic AI-Powered Urban Rescue Assistance System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WEBSOCKET ENDPOINTS -----------------
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Immediately send current state upon connect
        initial_snapshot = sim_engine.get_telemetry_snapshot()
        await websocket.send_json(initial_snapshot)
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
            else:
                try:
                    payload = json.loads(data)
                    event_type = payload.get("event") or payload.get("type")
                    if event_type in ["ambulance:location:update", "location:update"]:
                        loc_data = payload.get("data") or payload
                        lat = float(loc_data.get("latitude") if loc_data.get("latitude") is not None else loc_data.get("lat"))
                        lng = float(loc_data.get("longitude") if loc_data.get("longitude") is not None else loc_data.get("lng"))
                        speed = float(loc_data.get("speed", 0.0) or 0.0)
                        heading = float(loc_data.get("heading", 0.0) or 0.0)
                        accuracy = loc_data.get("accuracy")
                        mode = loc_data.get("trackingMode", "REAL_GPS")

                        snapshot = sim_engine.update_real_location(
                            lat=lat,
                            lng=lng,
                            speed_kmh=speed,
                            heading_deg=heading,
                            accuracy=accuracy,
                            tracking_mode=mode
                        )
                        # Broadcast updated snapshot to all connected clients
                        await manager.broadcast(snapshot)
                        # Broadcast explicit event for Socket.IO style subscribers
                        await manager.broadcast({
                            "event": "ambulance:location:updated",
                            "data": {
                                "missionId": payload.get("missionId", "MISSION-HYD-001"),
                                "ambulanceId": payload.get("ambulanceId", "AMB-108-HYD"),
                                "latitude": lat,
                                "longitude": lng,
                                "speed": speed,
                                "heading": heading,
                                "accuracy": accuracy,
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            }
                        })
                    elif event_type in ["patient:location:update", "patient:update"]:
                        loc_data = payload.get("data") or payload
                        snapshot = sim_engine.update_patient_location(
                            location_name=loc_data.get("location_name") or loc_data.get("name", "Custom Pickup Point"),
                            lat=float(loc_data.get("lat") if loc_data.get("lat") is not None else loc_data.get("latitude")),
                            lng=float(loc_data.get("lng") if loc_data.get("lng") is not None else loc_data.get("longitude")),
                            name=loc_data.get("patient_name") or loc_data.get("name"),
                            condition=loc_data.get("condition"),
                            vitals=loc_data.get("vitals")
                        )
                        await manager.broadcast(snapshot)
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

# ----------------- REST API ENDPOINTS -----------------
@app.post("/api/ambulance/location")
async def update_ambulance_location(req: AmbulanceLocationUpdateRequest, db: Session = Depends(get_db)):
    lat = req.get_lat()
    lng = req.get_lng()
    speed = float(req.speed or 0.0)
    heading = float(req.heading or 0.0)
    accuracy = req.accuracy
    mode = req.trackingMode or "REAL_GPS"

    snapshot = sim_engine.update_real_location(
        lat=lat,
        lng=lng,
        speed_kmh=speed,
        heading_deg=heading,
        accuracy=accuracy,
        tracking_mode=mode
    )

    # Persist latest location to SQLite
    try:
        loc_log = AmbulanceLocationLogModel(
            mission_id=req.missionId or "MISSION-HYD-001",
            ambulance_id=req.ambulanceId or "AMB-108-HYD",
            latitude=lat,
            longitude=lng,
            speed=speed,
            heading=heading,
            accuracy=accuracy,
            tracking_mode=mode
        )
        db.add(loc_log)
        db.commit()
    except Exception:
        pass

    # Broadcast updated state to all connected WebSocket clients
    await manager.broadcast(snapshot)
    await manager.broadcast({
        "event": "ambulance:location:updated",
        "data": {
            "missionId": req.missionId or "MISSION-HYD-001",
            "ambulanceId": req.ambulanceId or "AMB-108-HYD",
            "latitude": lat,
            "longitude": lng,
            "speed": speed,
            "heading": heading,
            "accuracy": accuracy,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    })

    return {
        "success": True,
        "message": "Ambulance location updated",
        "telemetry": snapshot
    }

@app.post("/api/ambulance/mode")
async def set_ambulance_tracking_mode(req: AmbulanceModeRequest):
    sim_engine.set_tracking_mode(req.mode)
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)
    return {
        "success": True,
        "mode": sim_engine.tracking_mode,
        "tracking_mode": sim_engine.tracking_mode,
        "telemetry": snapshot
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ONLINE",
        "system": "AURA Urban Rescue Assistance Platform",
        "version": "1.0.0",
        "agents_active": 7
    }

@app.get("/api/telemetry")
def get_telemetry():
    return sim_engine.get_telemetry_snapshot()

@app.post("/api/mission/activate")
async def activate_emergency():
    res = coordinator.activate_emergency()
    sim_engine.play()
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.post("/api/mission/pickup")
async def confirm_patient_pickup():
    res = coordinator.confirm_patient_pickup()
    sim_engine.segment_idx = 0
    sim_engine.segment_progress = 0.0
    sim_engine.play()
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.post("/api/mission/complete")
async def complete_mission():
    res = coordinator.complete_mission()
    sim_engine.pause()
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.post("/api/mission/reset")
async def reset_mission():
    sim_engine.reset()
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)
    return {"success": True, "status": "RESET_IDLE"}

@app.post("/api/mission/hospital")
async def change_hospital(req: HospitalChangeRequest):
    res = coordinator.change_destination_hospital(req.hospital_id)
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.get("/api/locations/presets")
def get_location_presets():
    """Returns preset Hyderabad patient pickup landmarks and emergency hospitals."""
    return {
        "success": True,
        "pickup_presets": HYDERABAD_PICKUP_PRESETS,
        "hospitals": coordinator.hospital_agent.get_all_hospitals()
    }

@app.post("/api/patient/location")
async def update_patient_pickup_location(req: PatientLocationUpdateRequest):
    """Allows driver or dispatcher to customize patient pickup location and recalculate route corridor."""
    snapshot = sim_engine.update_patient_location(
        location_name=req.location_name,
        lat=req.lat,
        lng=req.lng,
        name=req.name,
        condition=req.condition,
        vitals=req.vitals
    )
    await manager.broadcast(snapshot)
    return {
        "success": True,
        "message": f"Patient pickup location set to '{req.location_name}'",
        "telemetry": snapshot
    }

@app.post("/api/hospital/custom")
async def add_custom_destination_hospital(req: CustomHospitalRequest):
    """Allows driver to register a custom hospital and divert destination to it."""
    hosp_data = req.model_dump()
    res = coordinator.change_destination_hospital(req.id or "HOSP-CUSTOM", custom_hosp=hosp_data)
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return {
        "success": True,
        "hospital": res,
        "telemetry": snapshot
    }

@app.post("/api/simulation/play")
async def play_simulation():
    sim_engine.play()
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)
    return {"success": True, "is_running": True}

@app.post("/api/simulation/pause")
async def pause_simulation():
    sim_engine.pause()
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)
    return {"success": True, "is_running": False}

@app.post("/api/simulation/speed/{multiplier}")
async def set_speed(multiplier: float):
    sim_engine.set_speed(multiplier)
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)
    return {"success": True, "speed": sim_engine.simulation_speed}

@app.post("/api/simulation/demo")
async def start_demo_mode():
    if demo_runner.is_running:
        return {"success": False, "message": "Demo mode is already running."}

    async def broadcast_wrapper(state):
        await manager.broadcast(state)

    asyncio.create_task(demo_runner.run_scenario(broadcast_wrapper))
    return {"success": True, "message": "AURA 1-Click Automated Demo initiated."}

@app.post("/api/simulation/traffic")
async def inject_traffic(req: TrafficInjectionRequest):
    res = coordinator.traffic_agent.set_junction_traffic(
        req.junction_id,
        req.congestion_level,
        req.congestion_index,
        req.delay_minutes
    )
    # Check if Coordinator needs to reroute immediately
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.post("/api/simulation/green-corridor")
async def toggle_green_corridor(req: GreenCorridorRequest):
    if req.status:
        res = coordinator.traffic_agent.grant_green_corridor(req.junction_id)
    else:
        res = coordinator.traffic_agent.revoke_green_corridor(req.junction_id)
    snapshot = sim_engine.tick()
    await manager.broadcast(snapshot)
    return res

@app.post("/api/voice/query", response_model=VoiceQueryResponse)
async def handle_voice_query(req: VoiceQueryRequest, db: Session = Depends(get_db)):
    result = coordinator.handle_voice_query(req.query)

    # Save to SQLite database
    try:
        log = VoiceInteractionModel(
            mission_id="MISSION-HYD-001",
            user_query=req.query,
            intent=result["intent"],
            category=result["category"],
            response_text=result["response_text"]
        )
        db.add(log)
        db.commit()
    except Exception:
        pass

    # Broadcast updated voice state
    snapshot = sim_engine.get_telemetry_snapshot()
    await manager.broadcast(snapshot)

    return VoiceQueryResponse(
        query=result["query"],
        intent=result["intent"],
        category=result["category"],
        response_text=result["response_text"],
        confidence=result["confidence"],
        speak=result.get("speak", True),
        priority=result.get("priority", "normal"),
        data=result.get("data", {})
    )

@app.get("/api/explainability")
def get_explainability():
    return {
        "latest_decision_explanation": coordinator.last_decision_explanation,
        "audit_trail": coordinator.decision_audit_trail,
        "system_events": coordinator.system_events
    }

@app.get("/api/hospitals")
def get_hospitals():
    return coordinator.hospital_agent.get_all_hospitals()
