import React from 'react';
import { useAura } from '../context/AuraContext';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Volume2, 
  VolumeX, 
  Mic, 
  Radio, 
  ShieldAlert, 
  Car, 
  SlidersHorizontal,
  Navigation,
  MapPin
} from 'lucide-react';

export default function Navbar() {
  const { 
    telemetry, 
    isConnected, 
    activeTab, 
    setActiveTab, 
    audioMuted, 
    setAudioMuted, 
    setVoiceAssistantOpen,
    voiceState,
    playSimulation,
    pauseSimulation,
    setSpeed,
    resetMission,
    startDemoMode,
    setPickupModalOpen
  } = useAura();

  const isRunning = telemetry?.simulation?.is_running;
  const currentSpeed = telemetry?.simulation?.speed || 1.0;
  const isDemo = telemetry?.simulation?.demo_mode_active;
  const missionStatus = telemetry?.mission_status || 'IDLE';

  const getStatusBadge = () => {
    switch (missionStatus) {
      case 'EN_ROUTE_PATIENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span> TO PATIENT</span>;
      case 'NEAR_PATIENT':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse flex items-center gap-1.5">📍 NEAR PATIENT</span>;
      case 'PATIENT_PICKED_UP':
      case 'EN_ROUTE_HOSPITAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 animate-pulse flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span> TO HOSPITAL</span>;
      case 'HOSPITAL_ARRIVAL':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">🏥 ARRIVED ER</span>;
      case 'MISSION_COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">✅ COMPLETED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">STANDBY (IDLE)</span>;
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-red-200 sticky top-0 z-50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-500/30">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-red-600">
                AURA
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                HYD v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Urban Rescue Assistance System</div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1"></div>
        {getStatusBadge()}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('ambulance')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'ambulance' 
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
              : 'text-slate-600 hover:text-red-600 hover:bg-white'
          }`}
        >
          <span>🚑</span> Ambulance Cockpit
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'traffic' 
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
              : 'text-slate-600 hover:text-red-600 hover:bg-white'
          }`}
        >
          <span>🚦</span> Traffic Police
        </button>

        <button
          onClick={() => setActiveTab('vehicle')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'vehicle' 
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
              : 'text-slate-600 hover:text-red-600 hover:bg-white'
          }`}
        >
          <span>🚗</span> Road Alert (50m)
        </button>

        <button
          onClick={() => setActiveTab('control')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'control' 
              ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
              : 'text-slate-600 hover:text-red-600 hover:bg-white'
          }`}
        >
          <span>🧠</span> Brain & Agents
        </button>
      </div>

      {/* Global Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Custom Location Picker Button */}
        <button
          onClick={() => setPickupModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
          title="Customize patient pickup location or hospital"
        >
          <MapPin className="w-3.5 h-3.5 text-red-600" />
          <span className="hidden sm:inline">📍 Set Pickup</span>
          <span className="sm:hidden">📍 Pickup</span>
        </button>

        {/* 1-Click Automated DEMO MODE Button */}
        <button
          onClick={startDemoMode}
          disabled={isDemo}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md ${
            isDemo 
              ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' 
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/30 active:scale-95 cursor-pointer'
          }`}
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          {isDemo ? 'DEMO RUNNING...' : 'START DEMO'}
        </button>

        {/* Simulation Play/Pause */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
          <button
            onClick={() => isRunning ? pauseSimulation() : playSimulation()}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition"
            title={isRunning ? "Pause Simulation" : "Play Simulation"}
          >
            {isRunning ? <Pause className="w-4 h-4 text-amber-600" /> : <Play className="w-4 h-4 text-red-600" />}
          </button>

          {/* Speed multipliers */}
          <div className="flex items-center text-[10px] font-mono px-1 gap-1">
            {[1.0, 2.0, 5.0].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-1.5 py-0.5 rounded transition ${
                  currentSpeed === s ? 'bg-red-600 text-white font-bold' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={resetMission}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
            title="Reset Mission to Idle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Voice Assistant Toggle */}
        <button
          onClick={() => setVoiceAssistantOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
            voiceState === 'LISTENING' 
              ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse' 
              : voiceState === 'SPEAKING'
              ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
              : voiceState === 'ANALYZING'
              ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
              : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
          }`}
          title="Open Conversational Voice Assistant & Debug Panel"
        >
          <Mic className="w-3.5 h-3.5 text-red-600" />
          <span>
            {voiceState === 'LISTENING' ? 'Listening...' :
             voiceState === 'SPEAKING' ? 'Speaking...' :
             voiceState === 'ANALYZING' ? 'Analyzing...' : 'Voice AI'}
          </span>
        </button>

        {/* Siren Audio Mute/Unmute */}
        <button
          onClick={() => setAudioMuted(!audioMuted)}
          className={`p-2 rounded-xl border transition ${
            audioMuted 
              ? 'bg-slate-100 text-slate-400 border-slate-200' 
              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
          }`}
          title={audioMuted ? "Unmute Emergency Sirens" : "Mute Sirens"}
        >
          {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        
        {/* WebSocket Connection status */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono pl-1" title={isConnected ? "WebSocket Online" : "WebSocket Reconnecting"}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-red-500 animate-ping'}`}></span>
        </div>
      </div>

    </header>
  );
}
