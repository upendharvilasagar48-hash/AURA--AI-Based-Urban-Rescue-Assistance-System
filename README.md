# AURA — AI-Based Urban Rescue Assistance System
### Autonomous Multi-Agent AI Emergency Mobility, Smart Corridors & Urban Rescue Ecosystem
**Hyderabad Smart Demonstration Corridor (Boduppal → Uppal → Habsiguda → Tarnaka → Secunderabad → Gandhi Hospital)**

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev)
[![React Native](https://img.shields.io/badge/ReactNative-Expo%2052-black.svg)](https://expo.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Executive Summary & Core Problem

During medical emergencies in dense Indian metropolises such as Hyderabad, ambulances lose life-critical minutes (*the Golden Hour*) due to:
- Severe corridor congestion and junction gridlocks (e.g. Uppal X-Roads, Tarnaka Flyover)
- Lack of advance warning among connected road users in the ambulance carriageway
- Indiscriminate alerting systems that trigger false alarms inside roadside apartments and residential houses
- Delayed coordination with municipal traffic police for manual signal clearance
- Driver distraction when attempting to manually consult maps while driving at high speed
- Disconnected transitions across the rescue lifecycle: Ambulance Base → Patient Triage → Receiving Emergency Room

**AURA** resolves these bottlenecks by operating as an autonomous Multi-Agent AI system that continuously executes the **Observe → Analyze → Decide → Act → Monitor → Re-evaluate (O-A-D-A-M-R)** cycle across:
1. **Interactive Web Operations Hub**: High-contrast White & Red Emergency Medical Command Dashboard.
2. **FastAPI Multi-Agent Backend**: 7 autonomous AI domain agents communicating in real time over WebSockets.
3. **Ambulance Driver Mobile App**: Cross-platform React Native / Expo cockpit HUD with live GPS navigation and voice assistant.

---

## 2. System Architecture & Agent Specialization

```
+-------------------------------------------------------------------------------+
|                            AURA COORDINATOR AGENT                             |
|          Master Orchestrator - Observe -> Analyze -> Decide -> Act            |
|          Explainable AI (XAI) Synthesis & Multi-Agent Synchronization         |
+-------+--------------+---------------+---------------+----------------+-------+
        |              |               |               |                |
        v              v               v               v                v
+---------------+ +------------+ +------------+ +-------------+ +---------------+
| ROUTE INTEL   | |  TRAFFIC   | | ROAD SAFETY| |  HOSPITAL   | |  VOICE / NLU  |
| AGENT         | |   AGENT    | |   AGENT    | |    AGENT    | |     AGENT     |
| Dynamic nav   | | Congestion | | 50m zone   | | Trauma bay  | | 7 categories  |
| Boduppal-Sec  | | J-1..J-4   | | Road-only  | | Gandhi Hosp | | Web Speech    |
| Nacharam bypass| | Green wave | | vs Building| | Yashoda/KIMS| | Intent parser |
+---------------+ +------------+ +------------+ +-------------+ +---------------+
                                       |
                         +-------------+-------------+
                         |    MISSION STATE AGENT    |
                         | 9-Stage FSM Lifecycle     |
                         +---------------------------+
```

### Specialized Agents:
1. **AURA Coordinator Agent**: Central brain driving the O-A-D-A-M-R loop. Aggregates telemetry, triggers rerouting, coordinates with traffic police, and provides plain-English explanations for all decisions.
2. **Route Intelligence Agent**: Calculates primary route vs alternate bypass route (Nacharam-Mallapur bypass avoiding Uppal). Computes speed, bearing, distance, and dynamic ETAs.
3. **Traffic Intelligence Agent**: Continuously tracks Hyderabad junctions (Uppal Circle J-1, Habsiguda Metro J-2, Tarnaka Hub J-3, Sangeeth X-Roads J-4). Dispatches green corridor pre-emption requests to traffic police.
4. **Road Safety Agent (50m Road-Only Geofence)**: Enforces a two-tier geofence. Dispatches directional alerts and emergency sirens to vehicles on the carriageway, while **suppressing alerts for devices inside buildings/apartments**.
5. **Hospital Intelligence Agent**: Monitors receiving trauma care centers (Gandhi Hospital, Yashoda Secunderabad, KIMS), tracks ER and ICU bed capacity, and handles dynamic hospital diversions.
6. **Voice & NLU Agent**: Intent classification engine supporting 7 categories and 40+ variations with voice synthesis (`speechSynthesis`) and voice recognition (`webkitSpeechRecognition`).
7. **Mission State Agent**: 9-stage finite state machine:
   `IDLE` → `EMERGENCY_ACTIVATED` → `ROUTE_PLANNING` → `EN_ROUTE_PATIENT` → `NEAR_PATIENT` → `PATIENT_PICKED_UP` → `EN_ROUTE_HOSPITAL` → `HOSPITAL_ARRIVAL` → `MISSION_COMPLETED`.

---

## 3. Key Advanced Features

### 🚑 High-Definition Animated Moving Ambulance
- **Alternating Roof Strobes**: Emergency red (`#dc2626`) and police cyan (`#0284c7`) light bars alternate strobe flash keyframe animations (`0.35s`).
- **Forward Headlight Beam Projection**: Realistic dual translucent headlight beam projection cones light up the road in the direction of travel.
- **Directional Chevrons (`▲`)**: Vehicle orientation rotates dynamically in real-time (`0°` to `360°`) according to vehicle heading.
- **Concentric Sonar Motion Ripples**: Pulsing wave rings expand outward from the ambulance as it moves.
- **Live Speed HUD Pill**: Floating badge attached to the vehicle displays live speed (e.g. `58 km/h`).

### 📍 Customizable Patient Pickup & Destination Hospital
- **1-Tap Hyderabad Presets**: Boduppal, Uppal Ring Road, Habsiguda, Tarnaka Flyover, Secunderabad, Begumpet, Banjara Hills, Hitec City.
- **Current Ambulance GPS Location**: 1-tap shortcut to set pickup directly at the ambulance's current live coordinates.
- **Manual Coordinate Input**: Enter custom landmark names, latitude (°N), and longitude (°E).
- **Dynamic Rerouting**: The corridor engine automatically recalculates waypoints, distance remaining, and ETA in real time.

### 🛡️ 50-Meter Road-Only Alerting Algorithm
- Calculates distance to nearby connected road users.
- Classifies devices into **Carriageway/Road Users** (triggered with audible 6-second sirens & "Pull Left" alerts) vs **Apartment/Building Residents** (suppressed to prevent noise pollution).

---

## 4. Main Application Interfaces

1. **Ambulance Cockpit (Driver HUD)**:
   - Live Leaflet map with CartoDB Positron tiles, moving ambulance with animated strobes and headlights.
   - High-contrast white and emergency red cards for Speedometer, Target ETA, Distance Left, Waypoints, Patient Profile, and Hospital.
2. **Traffic Police Command Console**:
   - Radar tracking of emergency corridor with junction clearance countdowns.
   - 1-Click `GRANT GREEN CORRIDOR` to pre-empt traffic signals.
3. **Connected Vehicle HUD**:
   - In-cabin warning simulation: `🚨 AMBULANCE APPROACHING — PULL TO LEFT LANE`.
   - Web Audio API dual-tone synthesized emergency siren player.
4. **Multi-Agent Control Center**:
   - Live telemetry and audit log of all 7 AI agents with Explainable AI (XAI) rationale.
5. **Ambulance Driver Mobile App (Expo / React Native)**:
   - Driver Cockpit with phone GPS locking, interactive map, pickup customization, and hands-free voice assistant.

---

## 5. Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, WebSockets, SQLAlchemy, SQLite, Pytest, Pydantic v2.
- **Frontend**: React 18, Vite 5, Tailwind CSS 3, Leaflet 1.9, Lucide React Icons.
- **Mobile**: React Native 0.76, Expo SDK 52, Expo Location, Expo Speech, React Native Maps.
- **Audio & Speech**: Web Audio API (synthesized dual-tone siren), Web Speech API.
- **Geospatial**: Haversine distance matrix, Hyderabad coordinate grid, bearing math.

---

## 6. Installation & How to Run

### Prerequisites
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js v18+](https://nodejs.org/)
- (Optional) [Expo Go](https://expo.dev/client) app on your mobile phone

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd "AURA REAL"
```

### 2. Terminal 1: Run the Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run automated tests (184+ tests)
pytest backend/tests/ -v

# Start FastAPI backend
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 3. Terminal 2: Run the Web Dashboard
```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`

### 4. Terminal 3: Run the Ambulance Mobile App
```bash
cd mobile
npm install
npm start
```
- Metro Bundler: `http://localhost:8081`
- Scan the QR code using the **Expo Go** app on your phone, or press `a` to run on an Android emulator.

---

## 7. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
