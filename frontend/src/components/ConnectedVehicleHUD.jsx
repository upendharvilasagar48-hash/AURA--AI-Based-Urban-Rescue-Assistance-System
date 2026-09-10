import React from 'react';
import { useAura } from '../context/AuraContext';
import { sirenSynth } from '../utils/audioSynth';
import { 
  AlertTriangle, 
  Car, 
  Volume2, 
  ShieldCheck, 
  Building2, 
  Radio, 
  Compass, 
  ArrowDownCircle, 
  Layers,
  Info
} from 'lucide-react';

export default function ConnectedVehicleHUD() {
  const { telemetry } = useAura();

  if (!telemetry) {
    return <div className="p-8 text-center text-slate-400">Initializing In-Cabin Connected Vehicle HUD...</div>;
  }

  const { ambulance, road_safety, mission_status } = telemetry;
  const devices = road_safety?.devices || [];

  // Primary simulated road-user vehicle: TS-08-EV-2024
  const targetVehicle = devices.find(d => d.device_id === 'V-101-CAR') || devices[0];
  const isTargetAlerted = targetVehicle?.alert_status === 'ALERT_DISPATCHED';
  const targetDistance = targetVehicle?.distance_to_ambulance_m || 999;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      
      {/* HUD Header */}
      <div className="bg-white border border-red-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-sm">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">In-Vehicle Connected Road-User Interface</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 font-bold">
                Simulated Telematics HUD
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Simulating Vehicle: <b className="text-slate-900">TS-08-EV-2024 (Hyundai Ioniq)</b> &bull; Location: Uppal-Habsiguda Corridor
            </p>
          </div>
        </div>

        <button
          onClick={() => sirenSynth.playSiren(6.0)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
        >
          <Volume2 className="w-4 h-4" />
          <span>Play 6s Siren Test</span>
        </button>
      </div>

      {/* Primary In-Cabin Heads-Up Warning Display */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-xl relative overflow-hidden ${
        isTargetAlerted 
          ? 'bg-gradient-to-b from-red-600 to-rose-700 border-red-700 text-white animate-pulse' 
          : 'bg-white border border-red-200'
      }`}>
        
        {isTargetAlerted ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white text-red-600 font-black text-xs uppercase tracking-widest animate-bounce shadow-md">
              <AlertTriangle className="w-4 h-4" /> 50-Meter Emergency Warning Zone Active
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-3">
              <span>🚨</span> AMBULANCE APPROACHING <span>🚨</span>
            </h1>
            
            <p className="text-xl font-bold text-red-100 uppercase tracking-wider">
              Please Clear the Route &bull; Pull to the Left Lane
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-3 text-left">
              <div className="bg-black/20 border border-white/20 p-3.5 rounded-xl backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-wider text-red-200 font-bold">Ambulance Distance</div>
                <div className="text-2xl font-black text-white font-mono">{targetDistance} <span className="text-sm font-normal">meters</span></div>
              </div>

              <div className="bg-black/20 border border-white/20 p-3.5 rounded-xl backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-wider text-red-200 font-bold">Relative Direction</div>
                <div className="text-base font-bold text-white font-mono mt-1">Approaching from Behind</div>
              </div>

              <div className="bg-black/20 border border-white/20 p-3.5 rounded-xl backdrop-blur-sm">
                <div className="text-[11px] uppercase tracking-wider text-red-200 font-bold">Emergency Vehicle Speed</div>
                <div className="text-2xl font-black text-white font-mono">{ambulance.speed_kmh} <span className="text-sm font-normal">km/h</span></div>
              </div>
            </div>

            <div className="text-xs text-red-100 pt-2 font-mono flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              Emergency siren active (synthesized 6-second chime broadcasting to in-cabin audio)
            </div>
          </div>
        ) : (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Emergency Warning Zone Clear</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              No emergency vehicles within your 50-meter road carriageway zone. Nearest ambulance is{' '}
              <b className="text-red-700 font-mono font-bold">{targetDistance}m</b> away.
            </p>
          </div>
        )}

      </div>

      {/* Critical Feature: Road-Only 50m Geofencing Inspector */}
      <div className="bg-white border border-red-200 rounded-xl p-5 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-red-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-red-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Road-Only 50-Meter Geofencing Algorithm Inspector
              </h3>
              <p className="text-xs text-slate-600">
                Verification that devices inside residential/commercial buildings are filtered out while road vehicles are alerted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-red-50 px-2.5 py-1 rounded border border-red-200 text-red-700 font-bold">
              Road Alerts: <b>{road_safety?.stats?.active_road_alerts || 0}</b>
            </div>
            <div className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-600">
              Suppressed (Buildings): <b>{road_safety?.stats?.suppressed_building_alerts || 0}</b>
            </div>
          </div>
        </div>

        {/* Devices Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {devices.map((dev) => {
            const isRoad = dev.is_on_road;
            const isAlerted = dev.alert_status === 'ALERT_DISPATCHED';
            const isSuppressed = dev.alert_status === 'FILTERED_OUT_BUILDING';

            return (
              <div 
                key={dev.device_id}
                className={`p-3.5 rounded-xl border transition ${
                  isAlerted 
                    ? 'bg-red-50 border-2 border-red-600 shadow-md' 
                    : (isSuppressed ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200')
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{isRoad ? '🚗' : '🏢'}</span>
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {dev.label}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                          isRoad ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {isRoad ? 'ROAD USER' : 'IN BUILDING'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">{dev.road_name || dev.building_name}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isAlerted 
                      ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' 
                      : (isSuppressed ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-50 text-slate-500 border-slate-200')
                  }`}>
                    {dev.alert_status}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-mono">
                  <div className="text-slate-600">
                    Distance: <b className="text-slate-900">{dev.distance_to_ambulance_m}m</b>{' '}
                    <span className="text-[10px] text-slate-500">
                      ({dev.in_50m_zone ? '<= 50m IN ZONE' : '> 50m OUTSIDE'})
                    </span>
                  </div>
                  <div className={`text-[11px] font-sans font-bold ${isAlerted ? 'text-red-600' : 'text-slate-500'}`}>
                    {isAlerted ? '🚨 SIREN SOUNDING' : (isSuppressed ? '🛡️ FALSE ALARM SUPPRESSED' : 'MONITORING')}
                  </div>
                </div>

                {dev.log_reason && (
                  <div className="mt-1 text-[10px] text-slate-500 italic">
                    Log: {dev.log_reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Technical Architecture Note */}
        <div className="bg-red-50/50 border border-red-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold text-red-800">Why Road-Only Filtering Matters: </span>
            A naive 50m circular geofence would wake up sleeping citizens in roadside apartment buildings and disturb hospital wards. AURA evaluates vehicle velocity, bearing, and road carriageway geometry to ensure only actively driving road users receive audio-visual pre-emption alerts.
          </div>
        </div>

      </div>

    </div>
  );
}
