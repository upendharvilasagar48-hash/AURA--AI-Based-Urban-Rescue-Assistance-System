import React, { useState } from 'react';
import { useAura } from '../context/AuraContext';
import MapComponent from './MapComponent';
import { 
  Compass, 
  Clock, 
  Route, 
  Heart, 
  Activity, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Mic,
  ShieldCheck,
  Zap,
  MapPin,
  X,
  Plus,
  Navigation
} from 'lucide-react';

export default function AmbulanceCockpit() {
  const { 
    telemetry, 
    activateEmergency, 
    confirmPickup, 
    completeMission, 
    changeHospital,
    updatePatientLocation,
    addCustomHospital,
    pickupPresets,
    hospitals,
    setVoiceAssistantOpen,
    sendVoiceQuery,
    voiceState,
    startVoiceListening,
    stopVoiceListening,
    trackingMode,
    setTrackingMode,
    gpsStatus
  } = useAura();

  const [showPickupModal, setShowPickupModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [customLocationName, setCustomLocationName] = useState('');
  const [customLat, setCustomLat] = useState('');
  const [customLng, setCustomLng] = useState('');
  const [customPatientName, setCustomPatientName] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  // Custom hospital modal state
  const [customHospName, setCustomHospName] = useState('');
  const [customHospLocality, setCustomHospLocality] = useState('');
  const [customHospLat, setCustomHospLat] = useState('');
  const [customHospLng, setCustomHospLng] = useState('');
  const [customHospBeds, setCustomHospBeds] = useState('12');

  if (!telemetry) {
    return (
      <div className="flex items-center justify-center min-h-[600px] text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-mono text-sm">Connecting to AURA Telemetry Hub...</p>
        </div>
      </div>
    );
  }

  const { ambulance, patient, hospital, navigation, mission_status, phase } = telemetry;

  const isNearPatient = mission_status === 'NEAR_PATIENT';
  const isHospitalPhase = phase === 'TO_HOSPITAL' || mission_status === 'PATIENT_PICKED_UP';
  const isHospitalArrival = mission_status === 'HOSPITAL_ARRIVAL';

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      
      {/* Telemetry HUD Top Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Speedometer */}
        <div className="bg-white border border-red-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Vehicle Speed</div>
            <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1">
              {ambulance.speed_kmh} <span className="text-xs font-normal text-slate-500">km/h</span>
            </div>
          </div>
        </div>

        {/* Dynamic ETA */}
        <div className="bg-white border border-red-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Target ETA</div>
            <div className="text-xl font-black text-red-600 font-mono flex items-baseline gap-1">
              {navigation.eta_minutes} <span className="text-xs font-normal text-slate-500">min</span>
            </div>
          </div>
        </div>

        {/* Remaining Distance */}
        <div className="bg-white border border-red-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Distance Left</div>
            <div className="text-xl font-black text-slate-900 font-mono flex items-baseline gap-1">
              {navigation.distance_remaining_km} <span className="text-xs font-normal text-slate-500">km</span>
            </div>
          </div>
        </div>

        {/* Next Waypoint */}
        <div className="bg-white border border-red-200 p-3.5 rounded-xl flex items-center gap-3 col-span-2 sm:col-span-1 lg:col-span-2 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold flex-shrink-0">
            <ArrowRight className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Next Corridor Waypoint</div>
            <div className="text-sm font-bold text-slate-900 truncate font-mono">
              {navigation.next_waypoint_name}
            </div>
          </div>
        </div>

        {/* Active Route Identifier */}
        <div className="bg-white border border-red-200 p-3.5 rounded-xl flex items-center gap-3 shadow-sm">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
            navigation.active_route_type === 'ALTERNATE' 
              ? 'bg-amber-50 text-amber-700 border border-amber-200' 
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Route Path</div>
            <div className="text-xs font-bold text-slate-900 font-mono">
              {navigation.active_route_type === 'ALTERNATE' ? 'Nacharam Bypass' : 'Primary Corridor'}
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Map (Left) + Mission Telemetry & Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Map Container (2 Columns on Large Screens) */}
        <div className="lg:col-span-2 flex flex-col h-[540px]">
          <MapComponent telemetry={telemetry} />
          
          {/* Quick Voice Prompt & AI Decision Sub-bar */}
          <div className="mt-2.5 bg-white border border-red-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-[200px]">
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold border border-red-200 flex-shrink-0">
                AURA REASONING
              </span>
              <span className="text-slate-700 truncate font-medium">
                {telemetry.agents?.coordinator?.last_explanation || 'Monitoring traffic corridor and connected vehicles.'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Hands-Free Driver Quick Mic Button */}
              <button
                onClick={() => {
                  if (voiceState === 'LISTENING') {
                    stopVoiceListening();
                  } else {
                    startVoiceListening();
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow ${
                  voiceState === 'LISTENING'
                    ? 'bg-red-600 text-white animate-pulse shadow-red-600/50'
                    : voiceState === 'ANALYZING'
                    ? 'bg-amber-600 text-white animate-pulse'
                    : voiceState === 'SPEAKING'
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                }`}
                title="Hands-free Driver Voice Control (Click to talk)"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>
                  {voiceState === 'LISTENING' ? 'Listening...' :
                   voiceState === 'ANALYZING' ? 'Analyzing...' :
                   voiceState === 'SPEAKING' ? 'Speaking...' : 'Driver Voice'}
                </span>
              </button>

              <button
                onClick={() => setVoiceAssistantOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition"
                title="Open Conversational Dialog & Voice Debug Panel"
              >
                <span>Console</span>
              </button>

              <button
                onClick={() => setTrackingMode(trackingMode === 'REAL_GPS' ? 'DEMO' : 'REAL_GPS')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  trackingMode === 'REAL_GPS'
                    ? 'bg-red-50 text-red-700 border-red-300 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
                title="Toggle between Live Smartphone GPS and Demo Simulation"
              >
                <span className={`w-2 h-2 rounded-full ${trackingMode === 'REAL_GPS' ? 'bg-red-600 animate-pulse' : 'bg-slate-400'}`}></span>
                <span>{trackingMode === 'REAL_GPS' ? '📱 Real GPS' : '🎮 Demo Sim'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Control & Medical Triage */}
        <div className="space-y-4">
          
          {/* Mission Primary Action Card */}
          <div className="bg-white border border-red-200 p-4 rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mission Phase Action</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                {mission_status}
              </span>
            </div>

            {mission_status === 'IDLE' && (
              <button
                onClick={activateEmergency}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <span>🚨</span> ACTIVATE EMERGENCY MISSION
              </button>
            )}

            {(mission_status === 'EN_ROUTE_PATIENT' || isNearPatient) && (
              <button
                onClick={confirmPickup}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition animate-pulse cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" /> CONFIRM PATIENT ONBOARD
              </button>
            )}

            {isHospitalPhase && !isHospitalArrival && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 text-xs flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                <span>En route to {hospital.name}. Trauma bay alerted.</span>
              </div>
            )}

            {isHospitalArrival && (
              <button
                onClick={completeMission}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5" /> COMPLETE TRIAGE HANDOVER
              </button>
            )}

            {mission_status === 'MISSION_COMPLETED' && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center space-y-1">
                <div className="text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> RESCUE MISSION COMPLETED
                </div>
                <div className="text-slate-600 text-[11px]">Patient safely transferred to Emergency Trauma Team.</div>
              </div>
            )}
          </div>

          {/* Patient Card */}
          <div className="bg-white border border-red-200 p-4 rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-red-100 pb-2">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Patient & Triage Profile</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCustomLocationName(patient.location_name || '');
                    setCustomLat(String(patient.lat || ''));
                    setCustomLng(String(patient.lng || ''));
                    setCustomPatientName(patient.name || '');
                    setCustomCondition(patient.condition || '');
                    setShowPickupModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-[11px] font-bold flex items-center gap-1 transition shadow-sm cursor-pointer"
                  title="Customize patient pickup location"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Change Pickup</span>
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 animate-pulse">
                  CODE RED
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Name / Age:</span>
                <span className="font-semibold text-slate-900">{patient.name} ({patient.age}y, {patient.gender})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pickup Spot:</span>
                <span className="font-bold text-red-700 text-right truncate max-w-[200px] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />
                  {patient.location_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coordinates:</span>
                <span className="font-mono text-slate-700 text-[11px]">{patient.lat?.toFixed(4)}, {patient.lng?.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Condition:</span>
                <span className="font-bold text-red-600 text-right">{patient.condition}</span>
              </div>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
              <div className="bg-red-50/50 p-2 rounded-lg border border-red-100">
                <div className="text-[10px] text-slate-500">Heart Rate</div>
                <div className="text-sm font-black text-red-600 font-mono">{patient.vitals.heart_rate_bpm} <span className="text-[9px]">bpm</span></div>
              </div>
              <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                <div className="text-[10px] text-slate-500">Blood Press.</div>
                <div className="text-sm font-black text-amber-700 font-mono">{patient.vitals.blood_pressure}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500">SpO2</div>
                <div className="text-sm font-black text-slate-800 font-mono">{patient.vitals.spo2_percent}%</div>
              </div>
            </div>
          </div>

          {/* Destination Hospital Card */}
          <div className="bg-white border border-red-200 p-4 rounded-xl shadow-md space-y-3">
            <div className="flex items-center justify-between border-b border-red-100 pb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">Destination Hospital</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                {hospital.trauma_team_status}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{hospital.name}</div>
              <div className="text-slate-500 text-[11px]">{hospital.locality} &bull; {hospital.type}</div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Trauma Beds Available:</span>
                <span className="font-bold text-red-600">{hospital.emergency_beds_available} Beds</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ICU Capacity:</span>
                <span className="font-bold text-slate-800">{hospital.icu_beds_available} Critical Care</span>
              </div>
            </div>

            {/* Hospital Divert Switcher */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-slate-600">Select / Divert Hospital:</span>
                <button
                  onClick={() => setShowHospitalModal(true)}
                  className="text-[10px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> More / Custom
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => changeHospital('HOSP-GANDHI')}
                  className={`py-1.5 px-2 rounded-lg border font-semibold transition cursor-pointer ${
                    hospital.id === 'HOSP-GANDHI' 
                      ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20' 
                      : 'bg-slate-50 hover:bg-red-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Gandhi
                </button>
                <button
                  onClick={() => changeHospital('HOSP-YASHODA')}
                  className={`py-1.5 px-2 rounded-lg border font-semibold transition cursor-pointer ${
                    hospital.id === 'HOSP-YASHODA' 
                      ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20' 
                      : 'bg-slate-50 hover:bg-red-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Yashoda
                </button>
                <button
                  onClick={() => changeHospital('HOSP-KIMS')}
                  className={`py-1.5 px-2 rounded-lg border font-semibold transition cursor-pointer ${
                    hospital.id === 'HOSP-KIMS' 
                      ? 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-500/20' 
                      : 'bg-slate-50 hover:bg-red-50 text-slate-700 border-slate-200'
                  }`}
                >
                  KIMS
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: CUSTOM PATIENT PICKUP LOCATION */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-red-500 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Set Patient Pickup Location</h3>
              </div>
              <button
                onClick={() => setShowPickupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-red-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick 1-Tap Hyderabad Presets */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                1-Tap Hyderabad Pickup Presets:
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {(pickupPresets.length > 0 ? pickupPresets : [
                  { id: '1', name: 'Boduppal X Roads', locality: 'Boduppal', lat: 17.4095, lng: 78.5685 },
                  { id: '2', name: 'Uppal Ring Road / Metro', locality: 'Uppal', lat: 17.4019, lng: 78.5602 },
                  { id: '3', name: 'Habsiguda Crossroads', locality: 'Habsiguda', lat: 17.4172, lng: 78.5412 },
                  { id: '4', name: 'Tarnaka Flyover Hub', locality: 'Tarnaka', lat: 17.4278, lng: 78.5303 },
                  { id: '5', name: 'Secunderabad Rail Nilayam', locality: 'Secunderabad', lat: 17.4411, lng: 78.5015 },
                  { id: '6', name: 'Begumpet Airport Road', locality: 'Begumpet', lat: 17.4440, lng: 78.4680 },
                  { id: '7', name: 'Banjara Hills Road No 1', locality: 'Banjara Hills', lat: 17.4156, lng: 78.4350 },
                  { id: '8', name: 'Hitec City Cyber Towers', locality: 'Madhapur', lat: 17.4504, lng: 78.3808 }
                ]).map((preset) => (
                  <button
                    key={preset.id || preset.name}
                    type="button"
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setCustomLocationName(preset.name);
                      setCustomLat(String(preset.lat));
                      setCustomLng(String(preset.lng));
                    }}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedPresetId === preset.id || customLocationName === preset.name
                        ? 'bg-red-50 border-2 border-red-600 text-slate-900 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-red-200 text-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 text-xs truncate">{preset.name}</div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{preset.locality}</span>
                      <span className="font-mono text-red-600 font-bold">📍 Pick</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Coordinates Form */}
            <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Custom Location Details:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomLocationName("Ambulance Current Position");
                    setCustomLat(String(ambulance.lat));
                    setCustomLng(String(ambulance.lng));
                    setSelectedPresetId('');
                  }}
                  className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Navigation className="w-3 h-3" /> Use Ambulance GPS
                </button>
              </div>

              <div>
                <label className="block text-slate-600 text-[11px] mb-1">Pickup Spot / Landmark Name:</label>
                <input
                  type="text"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  placeholder="e.g., Habsiguda Crossroads, Metro Pillar 940"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="17.4172"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="78.5412"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Patient Name (Optional):</label>
                  <input
                    type="text"
                    value={customPatientName}
                    onChange={(e) => setCustomPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Condition (Optional):</label>
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    placeholder="e.g. Acute Cardiac Distress"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPickupModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!customLat || !customLng) {
                    alert("Please enter valid Latitude and Longitude");
                    return;
                  }
                  await updatePatientLocation({
                    location_name: customLocationName || "Custom Pickup Point",
                    lat: parseFloat(customLat),
                    lng: parseFloat(customLng),
                    name: customPatientName || patient.name,
                    condition: customCondition || patient.condition
                  });
                  setShowPickupModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Save & Recalculate Route</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HOSPITAL SELECTION & CUSTOM HOSPITAL */}
      {showHospitalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-red-500 rounded-2xl w-full max-w-xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-red-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900 text-base">Select or Add Destination Hospital</h3>
              </div>
              <button
                onClick={() => setShowHospitalModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-red-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Available Emergency Hospitals */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Available Hyderabad Emergency Centers:
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(hospitals.length > 0 ? hospitals : [
                  { id: 'HOSP-GANDHI', name: 'Gandhi Hospital & Emergency Trauma Care', locality: 'Musheerabad', emergency_beds_available: 14, icu_beds_available: 5 },
                  { id: 'HOSP-YASHODA', name: 'Yashoda Hospital Secunderabad', locality: 'Alexander Road', emergency_beds_available: 8, icu_beds_available: 3 },
                  { id: 'HOSP-KIMS', name: 'KIMS Hospital Secunderabad', locality: 'Minister Road', emergency_beds_available: 12, icu_beds_available: 4 },
                  { id: 'HOSP-APOLLO', name: 'Apollo Hospitals Jubilee Hills', locality: 'Road No 72, Jubilee Hills', emergency_beds_available: 16, icu_beds_available: 6 },
                  { id: 'HOSP-NIMS', name: "Nizam's Institute of Medical Sciences (NIMS)", locality: 'Punjagutta', emergency_beds_available: 20, icu_beds_available: 8 },
                  { id: 'HOSP-CARE', name: 'CARE Hospitals Banjara Hills', locality: 'Road No 1, Banjara Hills', emergency_beds_available: 10, icu_beds_available: 4 },
                  { id: 'HOSP-OSMANIA', name: 'Osmania General Hospital', locality: 'Afzal Gunj, Old City', emergency_beds_available: 25, icu_beds_available: 10 }
                ]).map((hosp) => (
                  <div
                    key={hosp.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition ${
                      hospital.id === hosp.id
                        ? 'bg-red-50 border-2 border-red-600 shadow-sm'
                        : 'bg-slate-50 border-slate-200 hover:border-red-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{hosp.name}</div>
                      <div className="text-[11px] text-slate-500">{hosp.locality} &bull; <span className="text-red-600 font-semibold">{hosp.emergency_beds_available} Trauma Beds</span></div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await changeHospital(hosp.id);
                        setShowHospitalModal(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        hospital.id === hosp.id
                          ? 'bg-red-600 text-white'
                          : 'bg-white hover:bg-red-50 text-red-600 border border-red-300'
                      }`}
                    >
                      {hospital.id === hosp.id ? 'Selected' : 'Divert Here'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Hospital Form */}
            <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Or Register Custom Destination Hospital:
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Hospital Name:</label>
                  <input
                    type="text"
                    value={customHospName}
                    onChange={(e) => setCustomHospName(e.target.value)}
                    placeholder="e.g., Sunshine Hospital"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Locality / Area:</label>
                  <input
                    type="text"
                    value={customHospLocality}
                    onChange={(e) => setCustomHospLocality(e.target.value)}
                    placeholder="e.g., Secunderabad"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Latitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customHospLat}
                    onChange={(e) => setCustomHospLat(e.target.value)}
                    placeholder="17.4350"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Longitude:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={customHospLng}
                    onChange={(e) => setCustomHospLng(e.target.value)}
                    placeholder="78.4980"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1">Beds Available:</label>
                  <input
                    type="number"
                    value={customHospBeds}
                    onChange={(e) => setCustomHospBeds(e.target.value)}
                    placeholder="10"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-red-600 font-mono placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!customHospName || !customHospLat || !customHospLng) {
                    alert("Please fill Hospital Name, Latitude, and Longitude.");
                    return;
                  }
                  await addCustomHospital({
                    name: customHospName,
                    locality: customHospLocality || "Hyderabad",
                    lat: parseFloat(customHospLat),
                    lng: parseFloat(customHospLng),
                    emergency_beds_available: parseInt(customHospBeds || "10", 10)
                  });
                  setShowHospitalModal(false);
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register & Divert to Custom Hospital</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
