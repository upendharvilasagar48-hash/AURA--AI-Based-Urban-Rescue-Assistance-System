import React from 'react';
import { useAura } from '../context/AuraContext';
import { 
  ShieldAlert, 
  Radio, 
  TrafficCone, 
  Clock, 
  Navigation, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Eye,
  Activity
} from 'lucide-react';

export default function TrafficPoliceConsole() {
  const { telemetry, toggleGreenCorridor, injectTraffic } = useAura();

  if (!telemetry) {
    return <div className="p-8 text-center text-slate-400">Loading Traffic Police Feed...</div>;
  }

  const { ambulance, navigation, traffic, mission_status } = telemetry;
  const isEmergency = mission_status !== 'IDLE' && mission_status !== 'MISSION_COMPLETED';

  return (
    <div className="p-4 space-y-4 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white border border-red-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Hyderabad Traffic Police Command Console</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                Green Corridor Dispatch
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Autonomous Signal Pre-emption & Emergency Vehicle Escort System (Simulated Infrastructure)
            </p>
          </div>
        </div>

        {/* Live Active Mission Badge */}
        <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 text-xs">
          <span className={`w-2 h-2 rounded-full ${isEmergency ? 'bg-red-600 animate-ping' : 'bg-emerald-500'}`}></span>
          <span className="text-slate-600">Corridor Status:</span>
          <span className="font-bold text-red-700">{isEmergency ? 'PRIORITY AMBULANCE IN TRANSIT' : 'ALL CLEAR (STANDBY)'}</span>
        </div>
      </div>

      {/* Priority Ambulance Tracking Card */}
      <div className="bg-white border border-red-200 rounded-xl p-5 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-red-100 pb-3 gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🚑</span>
            <div>
              <div className="text-sm font-black text-slate-900 font-mono flex items-center gap-2">
                AMBULANCE {ambulance.ambulance_id} ({ambulance.call_sign})
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 animate-pulse">
                  PRIORITY LEVEL 1
                </span>
              </div>
              <div className="text-xs text-slate-500">Crew: {ambulance.paramedic_name} &bull; Base: {ambulance.base_station}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500">SPEED: </span>
              <span className="font-bold text-red-600">{ambulance.speed_kmh} km/h</span>
            </div>
            <div>
              <span className="text-slate-500">BEARING: </span>
              <span className="font-bold text-slate-800">{ambulance.heading_deg}&deg;</span>
            </div>
            <div>
              <span className="text-slate-500">MISSION: </span>
              <span className="font-bold text-red-700">{mission_status}</span>
            </div>
          </div>
        </div>

        {/* Rapid Telemetry Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[11px] mb-1">Active Rescue Route</div>
            <div className="text-sm font-bold text-red-700 font-mono truncate">{navigation.route_name}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[11px] mb-1">Approaching Waypoint</div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">{navigation.next_waypoint_name}</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[11px] mb-1">Corridor Distance Remaining</div>
            <div className="text-sm font-bold text-slate-900 font-mono">{navigation.distance_remaining_km} km</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-slate-500 text-[11px] mb-1">Estimated Arrival (ETA)</div>
            <div className="text-sm font-bold text-red-600 font-mono">{navigation.eta_minutes} mins</div>
          </div>
        </div>
      </div>

      {/* Traffic Junctions & Green Corridor Override Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrafficCone className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Hyderabad Corridor Junction Signal Control
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Live Synchronization with AURA Traffic Intelligence Agent
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {traffic?.junctions && Object.values(traffic.junctions).map((j) => {
            const isGreen = j.green_corridor_active;
            const isHeavy = j.congestion_level === 'HEAVY' || j.congestion_level === 'GRIDLOCK';

            return (
              <div 
                key={j.id} 
                className={`bg-white border rounded-xl p-4 transition shadow-md space-y-3 ${
                  isGreen 
                    ? 'border-emerald-500 shadow-emerald-500/10' 
                    : (isHeavy ? 'border-red-400 shadow-red-500/10' : 'border-slate-200')
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">🚦</span>
                      <h4 className="font-bold text-sm text-slate-900">{j.name}</h4>
                    </div>
                    <div className="text-xs text-slate-500">{j.traffic_police_station}</div>
                  </div>

                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${
                    isGreen 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 animate-pulse' 
                      : (isHeavy ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200')
                  }`}>
                    {isGreen ? 'GREEN WAVE ACTIVE' : j.congestion_level}
                  </span>
                </div>

                {/* Metrics bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Congestion Density:</span>
                    <span className="font-mono font-bold text-slate-800">{j.congestion_index}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isGreen ? 'bg-emerald-500' : (isHeavy ? 'bg-red-600' : 'bg-amber-500')
                      }`} 
                      style={{ width: `${Math.max(j.congestion_index, 5)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Signal Delay: +{j.delay_minutes} min</span>
                    <span>Action: {isGreen ? 'Route Cleared' : (isHeavy ? 'Clear Emergency Route' : 'Normal Cycle')}</span>
                  </div>
                </div>

                {/* Interactive Signal Override Buttons */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleGreenCorridor(j.id, !isGreen)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                      isGreen 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    {isGreen ? 'REVOKE GREEN CORRIDOR' : 'GRANT GREEN CORRIDOR'}
                  </button>

                  {/* Manual Traffic Surge Injection for presenter */}
                  <button
                    onClick={() => injectTraffic(j.id, 'GRIDLOCK', 90, 4.5)}
                    className="py-2 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-mono transition cursor-pointer"
                    title="Simulate sudden traffic gridlock at this junction"
                  >
                    Simulate Jam
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Simulated Infrastructure Disclaimer Notice */}
      <div className="bg-red-50/50 border border-red-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
        <Activity className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-red-800">Academic Prototype Notice: </span>
          This console provides a realistic demonstration of emergency signal pre-emption and traffic police synchronization. In full municipal deployments, this connects via authenticated NTCIP / SCATS protocol gateways to municipal traffic controllers.
        </div>
      </div>

    </div>
  );
}
