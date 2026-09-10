"""SQLite Database and ORM Models for AURA Prototype"""
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./aura_prototype.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class MissionModel(Base):
    __tablename__ = "missions"

    id = Column(String, primary_key=True, index=True)
    status = Column(String, default="IDLE")  # IDLE, EMERGENCY_ACTIVATED, ROUTE_PLANNING, EN_ROUTE_PATIENT, NEAR_PATIENT, PATIENT_PICKED_UP, EN_ROUTE_HOSPITAL, HOSPITAL_ARRIVAL, MISSION_COMPLETED
    ambulance_id = Column(String, default="AMB-108-HYD")
    patient_id = Column(String, default="PT-HYD-772")
    hospital_id = Column(String, default="HOSP-GANDHI")
    current_lat = Column(Float, default=17.4135)
    current_lng = Column(Float, default=78.5786)
    heading_deg = Column(Float, default=270.0)
    speed_kmh = Column(Float, default=0.0)
    current_route_name = Column(String, default="PRIMARY_CORRIDOR")
    distance_remaining_m = Column(Float, default=0.0)
    eta_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)

class AgentActionModel(Base):
    __tablename__ = "agent_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mission_id = Column(String, index=True)
    agent_name = Column(String)  # Coordinator, Route, Traffic, Safety, Hospital, Voice, Mission
    action_type = Column(String)  # REROUTE, GREEN_CORRIDOR_REQUEST, 50M_ALERT_SENT, STATE_TRANSITION
    rationale = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AlertLogModel(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mission_id = Column(String, index=True)
    device_id = Column(String)
    device_label = Column(String)
    is_on_road = Column(Boolean)
    distance_m = Column(Float)
    alert_status = Column(String)  # ALERT_SENT, SUPPRESSED_BUILDING
    reason = Column(String)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class VoiceInteractionModel(Base):
    __tablename__ = "voice_interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mission_id = Column(String, index=True)
    user_query = Column(String)
    intent = Column(String)
    category = Column(String)
    response_text = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class AmbulanceLocationLogModel(Base):
    __tablename__ = "ambulance_locations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mission_id = Column(String, index=True, default="MISSION-HYD-001")
    ambulance_id = Column(String, default="AMB-108-HYD")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    accuracy = Column(Float, nullable=True)
    tracking_mode = Column(String, default="REAL_GPS")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
