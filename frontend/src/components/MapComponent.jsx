import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAura } from '../context/AuraContext';
import { 
  Navigation, 
  Crosshair, 
  Compass, 
  Radio, 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Smartphone,
  Play,
  Cpu,
  MapPin,
  Clock,
  Gauge
} from 'lucide-react';

export default function MapComponent({ telemetry }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const { 
    trackingMode, 
    setTrackingMode, 
    followAmbulance, 
    setFollowAmbulance, 
    gpsStatus, 
    gpsDiagnostics, 
    startGpsTracking, 
    isConnected,
    setPickupModalOpen,
    setHospitalModalOpen,
    activateEmergency
  } = useAura();

  const layersRef = useRef({
    ambulanceMarker: null,
    sirenCircle: null,
    activeRouteLine: null,
    completedRouteLine: null,
    patientMarker: null,
    hospitalMarkers: [],
    junctionMarkers: [],
    deviceMarkers: []
  });

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Boduppal - Habsiguda - Secunderabad corridor
    const map = L.map(mapContainerRef.current, {
      center: [17.4220, 78.5380],
      zoom: 13,
      zoomControl: true
    });

    // High-contrast Light Mode tile layer for White & Red emergency theme
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Hyderabad Emergency Grid',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // If user starts dragging map manually, pause auto-follow
    map.on('dragstart', () => {
      setFollowAmbulance(false);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update dynamic layers when telemetry changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !telemetry) return;

    const layers = layersRef.current;

    // 1. UPDATE AMBULANCE POSITION & 50M WARNING ZONE
    const ambLat = telemetry.ambulance.lat;
    const ambLng = telemetry.ambulance.lng;
    const heading = telemetry.ambulance.heading_deg || 0;
    const isEmergency = telemetry.mission_status !== 'IDLE' && telemetry.mission_status !== 'MISSION_COMPLETED';
    const ambSpeed = telemetry.ambulance.speed_kmh || 0;
    const isMoving = ambSpeed > 1 || (isEmergency && telemetry.mission_status !== 'WAITING_PATIENT') || Boolean(telemetry?.simulation?.is_running);

    const ambulanceIconHtml = `
      <div style="position: relative; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
        <!-- Dynamic Moving Sonar Ripples (Active when vehicle is moving) -->
        ${isMoving ? `
          <div class="amb-motion-ripple-1" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${isEmergency ? 'rgba(255,23,68,0.85)' : 'rgba(0,229,255,0.85)'}; pointer-events: none;"></div>
          <div class="amb-motion-ripple-2" style="position: absolute; width: 44px; height: 44px; border-radius: 50%; border: 2px solid ${isEmergency ? 'rgba(255,23,68,0.7)' : 'rgba(0,229,255,0.7)'}; pointer-events: none;"></div>
        ` : ''}

        <!-- Rotating Ambulance Vehicle Container -->
        <div style="transform: rotate(${heading}deg); transition: transform 0.25s linear; display: flex; align-items: center; justify-content: center; width: 70px; height: 70px; position: absolute;">
          <!-- Forward Headlight Beams (Active when moving) -->
          ${isMoving ? `
            <div class="amb-headlight-shimmer" style="position: absolute; top: -14px; width: 34px; height: 24px; background: linear-gradient(to top, rgba(254, 240, 138, 0.55), rgba(254, 240, 138, 0)); clip-path: polygon(25% 100%, 75% 100%, 100% 0%, 0% 0%); pointer-events: none;"></div>
            <div style="position: absolute; top: -8px; color: ${isEmergency ? '#ff1744' : '#00e5ff'}; font-size: 13px; font-weight: 900; line-height: 1; text-shadow: 0 0 6px ${isEmergency ? '#ff1744' : '#00e5ff'};">▲</div>
          ` : ''}

          <!-- High-Definition Top-Down Emergency Ambulance Vehicle SVG -->
          <svg width="34" height="50" viewBox="0 0 34 50" fill="none" xmlns="http://www.w3.org/2000/svg" class="${isMoving ? 'amb-moving-glow' : ''}" style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.7));">
            <!-- Main Ambulance Body Chassis -->
            <rect x="2" y="5" width="30" height="42" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
            <!-- Cab / Windshield -->
            <path d="M5 16 C5 13 8 11 12 11 L22 11 C26 11 29 13 29 16 L27 21 L7 21 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8"/>
            <!-- Side Emergency Stripes -->
            <rect x="2" y="24" width="4" height="18" fill="#ef4444"/>
            <rect x="28" y="24" width="4" height="18" fill="#ef4444"/>
            <!-- Rear Windows -->
            <rect x="7" y="41" width="8" height="3" rx="1" fill="#1e293b"/>
            <rect x="19" y="41" width="8" height="3" rx="1" fill="#1e293b"/>
            <!-- Red Cross on White Roof -->
            <circle cx="17" cy="31" r="7" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.8"/>
            <rect x="15.5" y="26.5" width="3" height="9" rx="0.8" fill="#ef4444"/>
            <rect x="12.5" y="29.5" width="9" height="3" rx="0.8" fill="#ef4444"/>
            <!-- Front Headlights -->
            <rect x="4" y="5" width="5" height="2.5" rx="1" fill="#fef08a"/>
            <rect x="25" y="5" width="5" height="2.5" rx="1" fill="#fef08a"/>
            <!-- Emergency Roof Strobe Lightbar -->
            <rect x="9" y="21" width="16" height="4" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.5"/>
            <!-- Left Flashing Red Strobe -->
            <circle cx="12" cy="23" r="2" class="${isMoving || isEmergency ? 'amb-strobe-red' : ''}" fill="#ff1744"/>
            <!-- Right Flashing Blue Strobe -->
            <circle cx="22" cy="23" r="2" class="${isMoving || isEmergency ? 'amb-strobe-blue' : ''}" fill="#00e5ff"/>
            <circle cx="17" cy="23" r="1.2" fill="#f59e0b"/>
          </svg>
        </div>

        <!-- Attached Live Speed & Motion Pill (Fixed Orientation) -->
        <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: rgba(10, 13, 20, 0.92); border: 1px solid ${isMoving ? '#00e5ff' : '#475569'}; border-radius: 9999px; padding: 1px 6px; display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 800; color: #ffffff; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.8); pointer-events: none; z-index: 10;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isMoving ? '#00f2fe' : '#94a3b8'}; ${isMoving ? 'box-shadow: 0 0 6px #00f2fe;' : ''}"></span>
          <span>${isMoving ? Math.round(ambSpeed) + ' km/h' : 'IDLE'}</span>
        </div>
      </div>
    `;

    const ambCustomIcon = L.divIcon({
      html: ambulanceIconHtml,
      className: 'custom-amb-marker',
      iconSize: [70, 70],
      iconAnchor: [35, 35]
    });

    if (!layers.ambulanceMarker) {
      layers.ambulanceMarker = L.marker([ambLat, ambLng], { icon: ambCustomIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      layers.ambulanceMarker.setLatLng([ambLat, ambLng]);
      layers.ambulanceMarker.setIcon(ambCustomIcon);
    }

    // Auto-center map on ambulance when followAmbulance is enabled
    if (followAmbulance) {
      map.panTo([ambLat, ambLng], { animate: true, duration: 0.5 });
    }

    // 50-Meter Radius Translucent Warning Zone Circle
    if (!layers.sirenCircle) {
      layers.sirenCircle = L.circle([ambLat, ambLng], {
        radius: 50, // 50 meters
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.16,
        weight: 2,
        dashArray: '4, 4'
      }).addTo(map);
    } else {
      layers.sirenCircle.setLatLng([ambLat, ambLng]);
      layers.sirenCircle.setStyle({
        color: '#dc2626',
        fillColor: '#ef4444'
      });
    }

    // 2. UPDATE ROUTE POLYLINES (SPLIT COMPLETED VS REMAINING PATH)
    if (telemetry.navigation && telemetry.navigation.waypoints && telemetry.navigation.waypoints.length > 0) {
      const wps = telemetry.navigation.waypoints;

      // Find waypoint index nearest to current ambulance position
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < wps.length; i++) {
        const d = (wps[i].lat - ambLat) ** 2 + (wps[i].lng - ambLng) ** 2;
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }

      // Completed route segment behind ambulance
      const completedCoords = [...wps.slice(0, nearestIdx + 1).map(w => [w.lat, w.lng]), [ambLat, ambLng]];
      if (layers.completedRouteLine) {
        map.removeLayer(layers.completedRouteLine);
      }
      if (completedCoords.length > 1) {
        layers.completedRouteLine = L.polyline(completedCoords, {
          color: '#94a3b8',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.7
        }).addTo(map);
      }

      // Active remaining route corridor ahead of ambulance (Vibrant Red)
      const remainingCoords = [[ambLat, ambLng], ...wps.slice(nearestIdx + 1).map(w => [w.lat, w.lng])];
      if (layers.activeRouteLine) {
        map.removeLayer(layers.activeRouteLine);
      }
      if (remainingCoords.length > 1) {
        layers.activeRouteLine = L.polyline(remainingCoords, {
          color: '#dc2626',
          weight: 6,
          opacity: 0.95,
          lineJoin: 'round'
        }).addTo(map);
      }
    }

    // 3. PATIENT MARKER (Dynamically Reposition on Custom Pickup Location Change)
    if (telemetry.patient) {
      const pt = telemetry.patient;
      const patientIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-10 h-10 bg-red-600 border-2 border-white rounded-full shadow-lg shadow-red-500/50 animate-bounce">
            <span class="text-white text-xs font-bold">📍</span>
          </div>
        `,
        className: 'patient-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const popupHtml = `<b>${pt.name}</b><br/>Triage: <span style="color:#ef4444">${pt.condition}</span><br/>Location: <b>${pt.location_name}</b>`;

      if (!layers.patientMarker) {
        layers.patientMarker = L.marker([pt.lat, pt.lng], { icon: patientIcon })
          .bindPopup(popupHtml)
          .addTo(map);
      } else {
        layers.patientMarker.setLatLng([pt.lat, pt.lng]);
        layers.patientMarker.setPopupContent(popupHtml);
      }
    }

    // 4. HOSPITAL MARKERS (Dynamically Reposition on Divert / Custom Destination)
    if (telemetry.hospital) {
      const hosp = telemetry.hospital;
      const hospIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-9 h-9 bg-emerald-600 border-2 border-white rounded-md shadow-md shadow-emerald-500/40">
            <span class="text-white text-sm font-black">🏥</span>
          </div>
        `,
        className: 'hospital-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const hospPopup = `<b>${hosp.name}</b><br/>Locality: ${hosp.locality}<br/>Trauma Beds: <b>${hosp.emergency_beds_available} Available</b>`;

      if (!layers.hospitalMarker) {
        layers.hospitalMarker = L.marker([hosp.lat, hosp.lng], { icon: hospIcon })
          .bindPopup(hospPopup)
          .addTo(map);
      } else {
        layers.hospitalMarker.setLatLng([hosp.lat, hosp.lng]);
        layers.hospitalMarker.setPopupContent(hospPopup);
      }
    }

    // 5. TRAFFIC JUNCTIONS
    if (telemetry.traffic?.junctions) {
      // Clear previous junction markers
      layers.junctionMarkers.forEach(m => map.removeLayer(m));
      layers.junctionMarkers = [];

      Object.values(telemetry.traffic.junctions).forEach(j => {
        const isGreenWave = j.green_corridor_active;
        const isGridlock = j.congestion_level === 'GRIDLOCK' || j.congestion_level === 'HEAVY';
        const color = isGreenWave ? '#10b981' : (isGridlock ? '#ef4444' : '#f59e0b');

        const junctionIcon = L.divIcon({
          html: `
            <div style="background:${color}; padding: 3px 6px; border-radius: 4px; border: 1px solid #fff; font-size: 10px; font-weight: 700; color: #fff; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
              🚦 ${j.name.split(' ')[0]} ${isGreenWave ? '⚡ GREEN' : (isGridlock ? '⚠️ JAM' : '')}
            </div>
          `,
          className: 'junction-marker',
          iconSize: [80, 24],
          iconAnchor: [40, 12]
        });

        const jm = L.marker([j.lat, j.lng], { icon: junctionIcon })
          .bindPopup(`<b>${j.name}</b><br/>Congestion: <b style="color:${color}">${j.congestion_level} (${j.congestion_index}%)</b><br/>Delay: +${j.delay_minutes} min<br/>Green Corridor: <b>${isGreenWave ? 'ACTIVE' : 'STANDBY'}</b>`)
          .addTo(map);
        layers.junctionMarkers.push(jm);
      });
    }

    // 6. CONNECTED ROAD USERS & OFF-ROAD BUILDINGS (50M Geofence Visualizer)
    if (telemetry.road_safety?.devices) {
      layers.deviceMarkers.forEach(m => map.removeLayer(m));
      layers.deviceMarkers = [];

      telemetry.road_safety.devices.forEach(dev => {
        const isRoadUser = dev.is_on_road;
        const isAlerted = dev.alert_status === 'ALERT_DISPATCHED';
        const isBuildingSuppressed = dev.alert_status === 'FILTERED_OUT_BUILDING';

        let markerHtml = '';
        if (isRoadUser) {
          // Connected Road Vehicle
          markerHtml = `
            <div style="background: ${isAlerted ? '#ef4444' : '#3b82f6'}; border: 2px solid #fff; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 0 ${isAlerted ? '14px #ef4444' : '4px rgba(0,0,0,0.5)'}; ${isAlerted ? 'animation: pulse 1s infinite;' : ''}">
              🚗
            </div>
          `;
        } else {
          // Off-road Building Device
          markerHtml = `
            <div style="background: ${isBuildingSuppressed ? '#64748b' : '#334155'}; border: 1px dashed #94a3b8; border-radius: 4px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; opacity: ${isBuildingSuppressed ? '0.9' : '0.6'};">
              🏢
            </div>
          `;
        }

        const devIcon = L.divIcon({
          html: markerHtml,
          className: 'dev-marker',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const dm = L.marker([dev.lat, dev.lng], { icon: devIcon })
          .bindPopup(`
            <b>${dev.label}</b><br/>
            Type: <b>${dev.device_type}</b><br/>
            Location: ${isRoadUser ? '🛣️ Carriageway / Road Lane' : '🏠 Inside Residential / Commercial Structure'}<br/>
            Distance to Ambulance: <b>${dev.distance_to_ambulance_m}m</b><br/>
            Status: <b style="color: ${isAlerted ? '#ef4444' : (isBuildingSuppressed ? '#94a3b8' : '#10b981')}">${dev.alert_status}</b><br/>
            <i>${dev.log_reason || ''}</i>
          `)
          .addTo(map);

        layers.deviceMarkers.push(dm);
      });
    }

  }, [telemetry, followAmbulance]);

  const handleCenterAmbulance = () => {
    setFollowAmbulance(true);
    if (mapInstanceRef.current && telemetry?.ambulance) {
      mapInstanceRef.current.panTo([telemetry.ambulance.lat, telemetry.ambulance.lng], { animate: true, duration: 0.5 });
    }
  };

  const ambLat = telemetry?.ambulance?.lat ?? 17.4220;
  const ambLng = telemetry?.ambulance?.lng ?? 78.5380;
  const ambSpeed = telemetry?.ambulance?.speed_kmh ?? 0;
  const ambHeading = telemetry?.ambulance?.heading_deg ?? 0;
  const missionStatus = telemetry?.mission_status ?? 'IDLE';

  return (
    <div className="relative w-full h-full min-h-[440px] rounded-xl overflow-hidden border border-aura-border shadow-2xl">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* NON-CRASHING GPS ERROR BANNER */}
      {trackingMode === 'REAL_GPS' && gpsDiagnostics.errorMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[450] bg-amber-950/90 border border-amber-500/70 text-amber-200 px-3.5 py-2 rounded-xl shadow-2xl flex items-center gap-3 text-xs max-w-lg backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div className="flex-1 truncate">{gpsDiagnostics.errorMessage}</div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button 
              onClick={startGpsTracking}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium text-[11px]"
            >
              Retry
            </button>
            <button 
              onClick={() => setTrackingMode('DEMO')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium text-[11px] border border-slate-600"
            >
              Demo Mode
            </button>
          </div>
        </div>
      )}

      {/* FLOATING LIVE STATUS PANEL (TOP-LEFT, POSITIONED UNDER LOCATION BAR) */}
      <div className="absolute top-14 left-3 z-[400] bg-white/95 backdrop-blur-md border border-red-200 p-3 rounded-xl shadow-xl text-xs space-y-2 max-w-[270px] text-slate-800">
        {/* Status Header */}
        <div className="flex items-center justify-between gap-2 border-b border-red-100 pb-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse flex-shrink-0"></span>
            <span className="font-bold text-slate-900 tracking-wide uppercase text-[11px] truncate">
              {missionStatus}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex-shrink-0 ${
            trackingMode === 'REAL_GPS'
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {trackingMode === 'REAL_GPS' ? '📱 REAL GPS' : '🎮 DEMO SIM'}
          </span>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-semibold">Speed</div>
            <div className="font-mono font-bold text-slate-900 text-sm">
              {ambSpeed} <span className="text-[10px] font-normal text-slate-500">km/h</span>
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-semibold">Heading</div>
            <div className="font-mono font-bold text-slate-900 text-sm">
              {ambHeading}°
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-semibold">Target ETA</div>
            <div className="font-mono font-bold text-red-600 text-sm">
              {telemetry?.navigation?.eta_minutes ?? '--'} <span className="text-[10px] font-normal text-slate-500">min</span>
            </div>
          </div>
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-semibold">Distance</div>
            <div className="font-mono font-bold text-slate-900 text-sm">
              {telemetry?.navigation?.distance_remaining_km ?? '--'} <span className="text-[10px] font-normal text-slate-500">km</span>
            </div>
          </div>
        </div>

        {/* Coordinates & Target */}
        <div className="pt-1.5 border-t border-slate-200 space-y-1 text-[10px] font-mono">
          <div className="flex justify-between text-slate-700">
            <span className="text-slate-500">Coords:</span>
            <span>{ambLat.toFixed(5)}, {ambLng.toFixed(5)}</span>
          </div>
          <div className="flex justify-between text-slate-700 truncate">
            <span className="text-slate-500">Target:</span>
            <span className="text-red-700 font-bold truncate ml-1">{telemetry?.ambulance?.destination_name || telemetry?.hospital?.name || 'Corridor'}</span>
          </div>
        </div>

        {/* GPS Status Indicator */}
        <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[10px]">
          <span className="text-slate-500">GPS Signal:</span>
          {trackingMode === 'REAL_GPS' ? (
            gpsStatus === 'LIVE' ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span> 🟢 LIVE (±{gpsDiagnostics.accuracy || 5}m)
              </span>
            ) : gpsStatus === 'RECONNECTING' ? (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span> 🟠 RECONNECTING
              </span>
            ) : (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> 🔴 OFFLINE
              </span>
            )
          ) : (
            <span className="text-red-600 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span> 🟢 SIMULATED
            </span>
          )}
        </div>
      </div>

      {/* FLOATING ACTION TOOLBAR (BOTTOM-LEFT) */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-2">
        {/* Follow Ambulance Button */}
        <button
          onClick={handleCenterAmbulance}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition shadow-md cursor-pointer ${
            followAmbulance
              ? 'bg-red-600 text-white border-red-600 shadow-red-600/30'
              : 'bg-white/95 text-slate-700 border-slate-300 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Auto-center map on moving ambulance"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>📍 Follow Ambulance</span>
        </button>

        {/* Real GPS / Demo Toggle Button */}
        <button
          onClick={() => setTrackingMode(trackingMode === 'REAL_GPS' ? 'DEMO' : 'REAL_GPS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition shadow-md cursor-pointer ${
            trackingMode === 'REAL_GPS'
              ? 'bg-red-600 text-white border-red-600'
              : 'bg-white/95 text-slate-700 border-slate-300 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Toggle between Live Phone GPS and Simulated Demo"
        >
          {trackingMode === 'REAL_GPS' ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-white" />
              <span>Mode: Real GPS</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 text-red-600" />
              <span>Mode: Demo Sim</span>
            </>
          )}
        </button>

        {/* Diagnostics Button */}
        <button
          onClick={() => setShowDebugPanel(prev => !prev)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md border transition shadow-md cursor-pointer ${
            showDebugPanel
              ? 'bg-red-100 text-red-800 border-red-300'
              : 'bg-white/95 text-slate-700 border-slate-300 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Toggle GPS & Telemetry Diagnostics Panel"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Diagnostics</span>
          {showDebugPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* COLLAPSIBLE DEVELOPER DEBUG PANEL */}
      {showDebugPanel && (
        <div className="absolute bottom-12 left-3 z-[410] w-80 bg-white/95 backdrop-blur-lg border-2 border-red-400 rounded-xl p-3 shadow-2xl text-[11px] font-mono space-y-2 text-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-red-100 pb-1.5">
            <span className="font-bold text-red-700 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> GPS & Telemetry Diagnostics
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
              {isConnected ? 'WS CONNECTED' : 'WS OFFLINE'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Tracking Mode:</span>
              <span className="font-bold text-red-700">{trackingMode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GPS Permission:</span>
              <span className="text-slate-800">{gpsDiagnostics.permission}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Watch Service:</span>
              <span className={gpsDiagnostics.isTracking ? 'text-emerald-600 font-bold' : 'text-slate-500'}>
                {gpsDiagnostics.isTracking ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Live Latitude:</span>
              <span className="text-slate-800">{(gpsDiagnostics.lat ?? ambLat).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Live Longitude:</span>
              <span className="text-slate-800">{(gpsDiagnostics.lng ?? ambLng).toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Signal Accuracy:</span>
              <span className="text-emerald-600 font-bold">±{gpsDiagnostics.accuracy ?? telemetry?.gps_accuracy_m ?? 5} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Speed:</span>
              <span className="text-slate-900 font-bold">{gpsDiagnostics.speed ?? ambSpeed} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Heading / Azimuth:</span>
              <span className="text-red-700 font-bold">{gpsDiagnostics.heading ?? ambHeading}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last GPS Ingest:</span>
              <span className="text-slate-700">{gpsDiagnostics.lastUpdateSec}s ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mission ID:</span>
              <span className="text-amber-700 truncate max-w-[140px] font-bold">{telemetry?.mission_id || 'MISSION-001'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Next Waypoint:</span>
              <span className="text-slate-900 font-bold truncate max-w-[140px]">{telemetry?.navigation?.next_waypoint_name || 'Habsiguda'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Location & Mission Dispatch Bar (TOP-LEFT) */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Change Pickup Point Button */}
        <button
          onClick={() => setPickupModalOpen(true)}
          className="bg-white/95 hover:bg-red-50 text-slate-900 border-2 border-red-500 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition active:scale-95 group cursor-pointer"
          title="Change patient pickup point to any Hyderabad preset or custom GPS coordinates"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
          <span className="text-slate-500 font-normal">Pickup:</span>
          <span className="text-red-700 font-bold max-w-[150px] sm:max-w-[200px] truncate">
            {telemetry?.patient?.location_name || 'Secunderabad Station'}
          </span>
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-300 group-hover:bg-red-200">
            ✏️ Change
          </span>
        </button>

        {/* Change Hospital Divert Button */}
        <button
          onClick={() => setHospitalModalOpen(true)}
          className="bg-white/95 hover:bg-slate-50 text-slate-900 border-2 border-slate-300 hover:border-red-400 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition active:scale-95 group cursor-pointer"
          title="Select or register custom destination hospital"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-slate-500 font-normal">Hospital:</span>
          <span className="text-slate-800 font-bold max-w-[130px] sm:max-w-[180px] truncate">
            {telemetry?.hospital?.name || 'Gandhi Hospital'}
          </span>
          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-slate-200">
            🏥 Divert
          </span>
        </button>

        {/* Start / Move Ambulance Quick Button if IDLE */}
        {telemetry?.mission_status === 'IDLE' && (
          <button
            onClick={activateEmergency}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg shadow-red-500/30 flex items-center gap-1.5 transition animate-pulse active:scale-95 cursor-pointer"
            title="Start rescue mission and make ambulance move"
          >
            <span>🚨</span>
            <span>Move Ambulance</span>
          </button>
        )}
      </div>

      {/* Map Overlay Legend (TOP-RIGHT) */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-md border border-red-200 p-2.5 rounded-xl text-xs space-y-1.5 shadow-lg text-slate-800">
        <div className="font-bold text-red-600 border-b border-red-100 pb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600"></span> Hyderabad Rescue Grid
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span className="text-base">🚑</span> Ambulance (50m Siren Zone)
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span className="w-3 h-1.5 bg-red-600 rounded"></span> Active Rescue Corridor
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span className="w-3 h-1 border-b-2 border-dashed border-slate-400"></span> Completed Route
        </div>
        <div className="flex items-center gap-2 text-slate-600 font-medium">
          <span className="text-base">🚗</span> Connected Vehicle (Road Alert)
        </div>
      </div>
    </div>
  );
}
