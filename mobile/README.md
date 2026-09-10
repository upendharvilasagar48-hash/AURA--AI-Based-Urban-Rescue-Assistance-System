# AURA — Ambulance Driver Mobile App (Android)

The **AURA Ambulance Driver Mobile App** is a dedicated, Android-installable mobile client connected in real-time to the AURA Multi-Agent Emergency Orchestrator backend.

---

## 📱 Mobile Architecture

```
📱 Android Smartphone (Ambulance Driver)
       │
       ├── Expo Location (High-Accuracy Phone GPS Tracking)
       ├── Real-Time Telemetry HUD (Speed, ETA, Distance, Route)
       ├── Embedded Interactive Emergency Map (Leaflet / OSM)
       ├── Driver Hands-Free Voice Assistant (Speech STT & TTS)
       ├── Patient Triage & Vitals Monitor (Code Red Profile)
       └── Hospital Divert Facility Switcher (Trauma Beds & ICU)
       │
       ▼ (REST API & WebSockets @ ws://<HOST_IP>:8000/ws/telemetry)
⚡ AURA Backend (FastAPI @ http://<HOST_IP>:8000)
       ▲
       │ (Real-time synchronization)
💻 AURA Web Dashboards (Traffic Police, Control Center, Vehicle HUD)
```

---

## 🚀 Running on Android Smartphone (Instant with Expo Go)

You can run this application on any physical Android smartphone without installing Android Studio:

### 1. Install Expo Go
- Download **Expo Go** on your Android phone from the **Google Play Store**.

### 2. Connect to the Same Network
- Ensure your Android smartphone and the computer running the AURA backend are connected to the **same Wi-Fi network** or **Mobile Hotspot**.
- Find your computer's local IP address (e.g. `192.168.1.100` via `ipconfig` on Windows).

### 3. Start the Mobile Client
In a terminal, navigate to the `mobile/` directory:
```bash
cd mobile
npm install
npx expo start
```

### 4. Scan QR Code
- Open **Expo Go** on your Android smartphone.
- Tap **Scan QR code** and scan the QR code displayed in your terminal.
- The AURA Ambulance Driver app will open immediately on your phone!

### 5. Connect to Backend Server
- Tap the **⚙️ (Settings)** icon in the top-right corner of the mobile app.
- Enter your computer's IP and port (e.g. `192.168.1.100:8000` or `10.0.2.2:8000` if using an emulator).
- Tap **Connect**. The status pill will turn **🟢 LIVE**.

---

## 📦 Building a Standalone Android Installable APK

To compile an `.apk` file that can be installed on any Android device without Expo Go:

### Option 1: EAS Cloud Build (Recommended — No Android Studio Required)
1. Install the Expo EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in with a free Expo account:
   ```bash
   eas login
   ```
3. Run the Android APK build:
   ```bash
   eas build -p android --profile preview
   ```
4. Once the cloud build completes (typically 3–5 minutes), a download link for your `aura-ambulance.apk` will be printed in the terminal. Download and install it on your Android phone!

---

### Option 2: Local Android Studio Build
If you have Android Studio installed:
```bash
npx expo run:android
```
This generates the native `android/` project folder and compiles the APK to your connected Android device or emulator.

---

## 🌟 Key Features

1. **Continuous Phone GPS Ingest**:
   - Streams live phone coordinates, speed, and heading to the backend via WebSockets (`ambulance:location:update`) and REST (`/api/ambulance/location`).
2. **Interactive Route Map**:
   - Auto-centers on the moving vehicle with 50m warning siren zone.
   - Highlights remaining corridor in bright cyan and completed path behind in dashed slate.
3. **Hands-Free Driver Voice Assistant**:
   - Tap the bottom floating mic button or ask questions (*"What is our ETA?"*, *"Why this route?"*, *"Is Gandhi Hospital ready?"*).
   - Audio feedback spoken directly through the phone's speaker.
4. **Emergency Triage & Hospital Divert**:
   - Live vitals (Heart rate, blood pressure, SpO2).
   - Instant facility diversion to Gandhi, Yashoda, or KIMS hospitals.
