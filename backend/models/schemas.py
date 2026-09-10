"""Pydantic Request & Response Schemas for AURA API & WebSockets"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Coordinate(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None
    speed_limit: Optional[int] = 50

class MissionStateUpdate(BaseModel):
    status: str
    ambulance_id: Optional[str] = "AMB-108-HYD"
    patient_id: Optional[str] = "PT-HYD-772"
    hospital_id: Optional[str] = "HOSP-GANDHI"

class TrafficInjectionRequest(BaseModel):
    junction_id: str
    congestion_level: str  # NORMAL, MODERATE, HEAVY, GRIDLOCK
    congestion_index: int  # 0 - 100
    delay_minutes: float

class GreenCorridorRequest(BaseModel):
    junction_id: str
    status: bool

class HospitalChangeRequest(BaseModel):
    hospital_id: str

class VoiceQueryRequest(BaseModel):
    query: str

class VoiceQueryResponse(BaseModel):
    query: str
    intent: str
    category: str
    response_text: str
    confidence: float
    speak: bool = True
    priority: str = "normal"  # normal, urgent, critical
    data: Dict[str, Any] = Field(default_factory=dict)
    suggested_actions: Optional[List[str]] = []

class ConnectedDeviceState(BaseModel):
    device_id: str
    label: str
    lat: float
    lng: float
    is_on_road: bool
    device_type: str
    distance_to_ambulance_m: float
    in_50m_zone: bool
    alert_status: str  # NONE, ALERT_DISPATCHED, FILTERED_OUT_BUILDING
    bearing_relative: Optional[str] = "Ahead"
    road_name: Optional[str] = ""

class TelemetryPayload(BaseModel):
    timestamp: str
    mission_id: str
    mission_status: str
    ambulance_lat: float
    ambulance_lng: float
    heading_deg: float
    speed_kmh: float
    current_route_name: str
    distance_remaining_m: float
    eta_seconds: int
    current_waypoint_index: int
    total_waypoints: int
    next_waypoint_name: str
    active_hospital_id: str
    active_hospital_name: str
    hospital_eta_seconds: int
    patient_reached: bool
    hospital_reached: bool
    traffic_junctions: Dict[str, Any]
    connected_devices: List[Dict[str, Any]]
    active_agents: Dict[str, Any]
    last_reasoning_explanation: str
    recent_alerts: List[Dict[str, Any]]
    recent_agent_logs: List[Dict[str, Any]]

class AmbulanceLocationUpdateRequest(BaseModel):
    missionId: Optional[str] = "MISSION-HYD-001"
    ambulanceId: Optional[str] = "AMB-108-HYD"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    speed: Optional[float] = 0.0
    heading: Optional[float] = 0.0
    accuracy: Optional[float] = None
    timestamp: Optional[str] = None
    trackingMode: Optional[str] = "REAL_GPS"

    def get_lat(self) -> float:
        if self.latitude is not None:
            return float(self.latitude)
        if self.lat is not None:
            return float(self.lat)
        raise ValueError("Latitude is required")

    def get_lng(self) -> float:
        if self.longitude is not None:
            return float(self.longitude)
        if self.lng is not None:
            return float(self.lng)
        raise ValueError("Longitude is required")

class AmbulanceModeRequest(BaseModel):
    mode: str = "REAL_GPS"  # "REAL_GPS" or "DEMO"

class PatientLocationUpdateRequest(BaseModel):
    location_name: str
    lat: float
    lng: float
    name: Optional[str] = None
    condition: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None

class CustomHospitalRequest(BaseModel):
    id: Optional[str] = None
    name: str
    locality: Optional[str] = "Hyderabad"
    lat: float
    lng: float
    type: Optional[str] = "Trauma Care Hospital"
    emergency_beds_available: Optional[int] = 12
    icu_beds_available: Optional[int] = 4

