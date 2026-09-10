import React from 'react';
import { useAura } from '../context/AuraContext';
import { 
  Brain, 
  Cpu, 
  Activity, 
  Layers, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Building2, 
  MessageSquare,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

export default function ControlCenter() {
  const { 
    telemetry, 
    injectTraffic, 
    toggleGreenCorridor, 
    changeHospital, 
    startDemoMode,
    activateEmergency,
    confirmPickup,
    completeMission,
    resetMission
  } = useAura();

  if (!telemetry) {
    return <div className="p-8 text-center text-slate-400">Booting AURA Multi-Agent Brain...</div>;
  }

  const { agents, simulation, mission_status, navigation, recent_audit_decisions, system_events } = telemetry;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="bg-white border border-red-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">AURA Multi-Agent Orchestration & Control Center</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                O-A-D-A-M-R Cycle
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Coordinating Route, Traffic, Safety, Voice, Hospital, and Mission Lifecycle Agents
            </p>
          </div>
        </div>

        {/* 1-Click Master Demo Runner */}
        <button
          onClick={startDemoMode}
          disabled={simulation?.demo_mode_active}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md cursor-pointer ${
            simulation?.demo_mode_active 
              ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' 
              : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{simulation?.demo_mode_active ? 'DEMO RUNNING...' : 'RUN COMPLETE ACADEMIC DEMO'}</span>
        </button>
      </div>

      {/* 7 Specialized Agents Status Grid */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-red-600" /> Active Specialized AI Agents (7 Nodes Synchronized)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* 1. Coordinator Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>👑</span> Coordinator Agent
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                ACTIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>Cycle:</b> Observe &bull; Analyze &bull; Decide &bull; Act &bull; Monitor &bull; Re-evaluate
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5 truncate">
              Goal: Rescue Mission {mission_status}
            </div>
          </div>

          {/* 2. Route Intelligence Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🗺️</span> Route Intelligence
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                OPTIMIZING
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>Active Corridor:</b> {navigation.route_name}
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              Efficiency: {navigation.active_route_type === 'ALTERNATE' ? 'Bypass Active (+3.4m saved)' : 'Standard Corridor'}
            </div>
          </div>

          {/* 3. Traffic Intelligence Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🚥</span> Traffic Intelligence
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                SURVEILLANCE
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>Junctions Monitored:</b> 4 Key Hyderabad Hubs
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              Bottlenecks: {telemetry.traffic?.bottlenecks?.length || 0} active delay points
            </div>
          </div>

          {/* 4. Road Safety Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🛡️</span> Road Safety Agent
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                50M SCANNER
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>Road Geofence:</b> Road Users vs Buildings
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              Road Alerts: {telemetry.road_safety?.stats?.active_road_alerts || 0} &bull; Suppressed: {telemetry.road_safety?.stats?.suppressed_building_alerts || 0}
            </div>
          </div>

          {/* 5. Hospital Intelligence Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🏥</span> Hospital Agent
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                ER STANDBY
              </span>
            </div>
            <div className="text-[11px] text-slate-700 truncate">
              <b>Target:</b> {telemetry.hospital.name.split(' ')[0]}
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              Trauma Beds: {telemetry.hospital.emergency_beds_available} Available
            </div>
          </div>

          {/* 6. Voice & NLU Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>🎙️</span> Voice Agent
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold">
                LISTENING
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>NLU Categories:</b> 7 Categories (40+ Intents)
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              Speech Synthesis: En-IN Active
            </div>
          </div>

          {/* 7. Mission State Agent */}
          <div className="bg-white border border-red-200 p-3.5 rounded-xl space-y-2 shadow-sm col-span-1 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <span>📋</span> Mission State Agent
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                9-STATE FSM
              </span>
            </div>
            <div className="text-[11px] text-slate-700">
              <b>Current Phase:</b> {telemetry.mission_status} ({telemetry.phase})
            </div>
            <div className="text-[10px] text-slate-500 border-t border-slate-100 pt-1.5">
              IDLE &rarr; ACTIVATED &rarr; EN_ROUTE_PATIENT &rarr; PICKUP &rarr; HOSPITAL &rarr; COMPLETED
            </div>
          </div>

        </div>
      </div>

      {/* Explainable AI Console & Scenario Injection Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Explainable AI Rationale & Audit Trail */}
        <div className="lg:col-span-2 bg-white border border-red-200 p-5 rounded-xl shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-red-100 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Explainable AI (XAI) Decision Trace</h3>
                <p className="text-xs text-slate-600">Contextual rationale behind autonomous routing and alerts</p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
              Live Reasoning
            </span>
          </div>

          {/* Current Active Decision Banner */}
          <div className="bg-red-50/60 border border-red-200 p-4 rounded-xl space-y-1.5">
            <div className="text-[11px] uppercase tracking-wider text-red-700 font-bold flex items-center gap-2">
              <Activity className="w-4 h-4" /> Latest Autonomous Decision Rationale
            </div>
            <p className="text-sm text-slate-900 font-medium leading-relaxed">
              "{telemetry.agents?.coordinator?.last_explanation || 'Monitoring traffic corridor.'}"
            </p>
          </div>

          {/* Audit Trail List */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Decision History (Autonomous System Actions)
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 text-xs">
              {recent_audit_decisions && recent_audit_decisions.length > 0 ? (
                recent_audit_decisions.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 flex-shrink-0 mt-0.5 font-semibold">
                      {item.timestamp}
                    </span>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-[11px]">
                        [{item.agent}] &bull; <span className="text-red-700">{item.decision}</span>
                      </div>
                      <div className="text-slate-600 text-[11px]">{item.reason}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-xs py-4 text-center">No decisions logged yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Scenario & Traffic Hazard Injection Controls */}
        <div className="bg-white border border-red-200 p-5 rounded-xl shadow-md space-y-4">
          <div className="border-b border-red-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>🎛️</span> Demonstration Scenario Controls
            </h3>
            <p className="text-xs text-slate-600">Inject traffic events to test AURA agent reactivity</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => injectTraffic('J1_UPPAL', 'GRIDLOCK', 95, 4.5)}
              className="w-full text-left p-3 rounded-xl bg-red-50 hover:bg-red-100/80 border border-red-200 text-xs transition space-y-1 cursor-pointer"
            >
              <div className="font-bold text-red-700 flex items-center justify-between">
                <span>⚠️ Inject Uppal Gridlock</span>
                <span className="text-[10px] font-mono bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">+4.5m delay</span>
              </div>
              <p className="text-[11px] text-slate-600">Forces AURA Coordinator to reroute via Nacharam bypass.</p>
            </button>

            <button
              onClick={() => toggleGreenCorridor('J1_UPPAL', true)}
              className="w-full text-left p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-xs transition space-y-1 cursor-pointer"
            >
              <div className="font-bold text-emerald-800 flex items-center justify-between">
                <span>⚡ Grant Police Green Wave (Uppal)</span>
                <span className="text-[10px] font-mono bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-bold">0m delay</span>
              </div>
              <p className="text-[11px] text-slate-600">Simulates traffic police clearing signals ahead.</p>
            </button>

            <button
              onClick={() => changeHospital('HOSP-YASHODA')}
              className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs transition space-y-1 cursor-pointer"
            >
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>🏥 Divert to Yashoda Secunderabad</span>
                <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">Cardiac Care</span>
              </div>
              <p className="text-[11px] text-slate-600">Tests dynamic hospital rerouting and trauma communication.</p>
            </button>

            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                onClick={resetMission}
                className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1 border border-slate-300 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset System
              </button>
              <button
                onClick={activateEmergency}
                className="py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1 shadow-md cursor-pointer active:scale-95"
              >
                🚨 Start Mission
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* System Event Stream */}
      <div className="bg-white border border-red-200 p-4 rounded-xl shadow-md space-y-2">
        <div className="flex items-center justify-between border-b border-red-100 pb-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-600" /> Real-Time Telemetry & Agent Event Stream
          </div>
          <span className="text-[10px] font-mono text-slate-500">Auto-updating via WebSockets</span>
        </div>

        <div className="max-h-[140px] overflow-y-auto space-y-1 text-[11px] font-mono text-slate-600 pr-1">
          {system_events && system_events.length > 0 ? (
            system_events.slice().reverse().map((ev, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="text-slate-400 font-semibold">[{ev.timestamp}]</span>
                <span className="px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200 text-[9px] font-bold">{ev.category}</span>
                <span className="text-slate-800">{ev.message}</span>
              </div>
            ))
          ) : (
            <div>No events recorded.</div>
          )}
        </div>
      </div>

    </div>
  );
}
