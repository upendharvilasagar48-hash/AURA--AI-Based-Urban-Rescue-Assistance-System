import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { sirenSynth } from '../utils/audioSynth';
import { speechService } from '../utils/speechService';
import fallbackBundle from '../data/fallbackTelemetry.json';

const AuraContext = createContext(null);

// Utility: Distance in meters between two lat/lng coordinates
const calculateDistMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Utility: Bearing in degrees between two points
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = Math.atan2(y, x);
  return Math.round((toDeg(brng) + 360) % 360);
};

export const AuraProvider = ({ children }) => {
  // Telemetry initialized directly with full Hyderabad dataset - never null
  const [telemetry, setTelemetry] = useState(fallbackBundle.initialTelemetry);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('ambulance'); // 'ambulance' | 'traffic' | 'vehicle' | 'control'
  const [audioMuted, setAudioMuted] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [hospitals, setHospitals] = useState(() => Object.values(fallbackBundle.hospitals || {}));
  const [pickupPresets, setPickupPresets] = useState(() => fallbackBundle.pickupPresets || []);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState('READY'); // 'READY' | 'LISTENING' | 'ANALYZING' | 'SPEAKING' | 'ERROR'
  const [voiceDebug, setVoiceDebug] = useState(() => speechService.getDebugSnapshot());
  const [trackingMode, setTrackingModeState] = useState('DEMO'); // 'DEMO' | 'REAL_GPS'
  const [followAmbulance, setFollowAmbulance] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('OFFLINE'); // 'LIVE' | 'RECONNECTING' | 'OFFLINE'
  const [gpsDiagnostics, setGpsDiagnostics] = useState({
    permission: 'prompt',
    isTracking: false,
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    lastUpdateSec: 0,
    errorMessage: null
  });

  // Client Simulation Engine State Refs (for smooth in-browser autonomous execution)
  const isConnectedRef = useRef(false);
  isConnectedRef.current = isConnected;

  const simRunningRef = useRef(true);
  const simSpeedRef = useRef(1.0);
  const segmentIdxRef = useRef(0);
  const segmentProgressRef = useRef(0.0);
  const currentRouteRef = useRef(fallbackBundle.routes?.primary || fallbackBundle.initialTelemetry.navigation.waypoints);
  const activePhaseRef = useRef('TO_PATIENT'); // 'TO_PATIENT' | 'TO_HOSPITAL'
  const demoActiveRef = useRef(false);

  const wsRef = useRef(null);
  const prevAlertedCarRef = useRef(false);
  const watchIdRef = useRef(null);
  const prevPositionRef = useRef(null);
  const lastLocationSentRef = useRef(0);
  const trackingModeRef = useRef('DEMO');
  trackingModeRef.current = trackingMode;

  // Increment lastUpdateSec timer for GPS diagnostics
  useEffect(() => {
    const interval = setInterval(() => {
      setGpsDiagnostics(prev => {
        if (!prev.isTracking) return prev;
        return { ...prev, lastUpdateSec: prev.lastUpdateSec + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync speechService states with React state
  useEffect(() => {
    const unsubState = speechService.onStateChange((st) => setVoiceState(st));
    const unsubDebug = speechService.onDebugChange((dbg) => setVoiceDebug({ ...dbg }));
    return () => {
      unsubState();
      unsubDebug();
    };
  }, []);

  // Try fetching dynamic location presets from backend if available
  useEffect(() => {
    fetch('/api/locations/presets')
      .then(res => res.json())
      .then(data => {
        if (data && data.success) {
          if (data.pickup_presets) setPickupPresets(data.pickup_presets);
          if (data.hospitals) setHospitals(data.hospitals);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize and connect WebSocket (with automatic fallback to client simulation)
  useEffect(() => {
    let reconnectTimeout;
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || 'localhost';
      let wsUrl;
      if (import.meta.env.VITE_WS_URL) {
        wsUrl = `${import.meta.env.VITE_WS_URL}/ws/telemetry`;
      } else if (window.location.port === '3000' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        wsUrl = `${protocol}//${host}:8000/ws/telemetry`;
      } else {
        wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data);

            if (data?.road_safety?.devices) {
              const roadVehicleAlerted = data.road_safety.devices.some(
                d => d.is_on_road && d.alert_status === 'ALERT_DISPATCHED'
              );
              if (roadVehicleAlerted && !prevAlertedCarRef.current && !audioMuted) {
                sirenSynth.playSiren(5.0);
              }
              prevAlertedCarRef.current = roadVehicleAlerted;
            }
          } catch (e) {
            console.error('Error parsing telemetry WebSocket data:', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 5000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 5000);
      }
    };

    connectWs();

    fetch('/api/hospitals')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setHospitals(data);
      })
      .catch(() => {});

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [audioMuted]);

  // -------------------------------------------------------------------------
  // Autonomous Client-Side Simulation Loop
  // (Runs continuously when disconnected so the dashboard is ALWAYS fully functional)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const simInterval = setInterval(() => {
      if (isConnectedRef.current) return;
      if (!simRunningRef.current) return;
      if (trackingModeRef.current !== 'DEMO') return;

      setTelemetry(prev => {
        if (!prev) return fallbackBundle.initialTelemetry;

        const waypoints = currentRouteRef.current || prev.navigation.waypoints;
        if (!waypoints || waypoints.length < 2) return prev;

        let segIdx = segmentIdxRef.current;
        let progress = segmentProgressRef.current;
        const currentSpeedKmh = 52 + Math.sin(Date.now() / 4000) * 10;
        const currentSpeedMs = (currentSpeedKmh * 1000 / 3600) * simSpeedRef.current;

        const p1 = waypoints[segIdx];
        const p2 = waypoints[Math.min(segIdx + 1, waypoints.length - 1)];

        const segDistance = Math.max(10, calculateDistMeters(p1.lat, p1.lng, p2.lat, p2.lng));
        const progressDelta = currentSpeedMs / segDistance;

        progress += progressDelta;
        if (progress >= 1.0) {
          progress = 0.0;
          if (segIdx < waypoints.length - 2) {
            segIdx += 1;
            segmentIdxRef.current = segIdx;
          } else {
            if (activePhaseRef.current === 'TO_PATIENT') {
              prev.mission_status = 'NEAR_PATIENT';
            } else if (activePhaseRef.current === 'TO_HOSPITAL') {
              prev.mission_status = 'HOSPITAL_ARRIVAL';
            }
          }
        }
        segmentProgressRef.current = progress;

        const targetP1 = waypoints[segIdx];
        const targetP2 = waypoints[Math.min(segIdx + 1, waypoints.length - 1)];
        const curLat = targetP1.lat + (targetP2.lat - targetP1.lat) * progress;
        const curLng = targetP1.lng + (targetP2.lng - targetP1.lng) * progress;
        const curHeading = calculateBearing(targetP1.lat, targetP1.lng, targetP2.lat, targetP2.lng);

        let remainingMeters = (1.0 - progress) * segDistance;
        for (let i = segIdx + 1; i < waypoints.length - 1; i++) {
          remainingMeters += calculateDistMeters(waypoints[i].lat, waypoints[i].lng, waypoints[i+1].lat, waypoints[i+1].lng);
        }
        const remainingKm = Math.max(0.1, (remainingMeters / 1000));
        const etaSec = Math.round((remainingMeters / Math.max(5, currentSpeedMs)));
        const etaMin = Math.max(1, Math.round(etaSec / 60));

        let missionStatus = prev.mission_status;
        if (activePhaseRef.current === 'TO_PATIENT') {
          missionStatus = remainingMeters < 80 ? 'NEAR_PATIENT' : 'EN_ROUTE_PATIENT';
        } else if (activePhaseRef.current === 'TO_HOSPITAL') {
          missionStatus = remainingMeters < 80 ? 'HOSPITAL_ARRIVAL' : 'EN_ROUTE_HOSPITAL';
        }

        const updatedJunctions = (prev.traffic?.junctions || []).map(j => {
          const distToJunction = calculateDistMeters(curLat, curLng, j.lat, j.lng);
          if (distToJunction < 350) {
            return {
              ...j,
              signal_state: 'GREEN_CORRIDOR',
              current_phase: 'EMERGENCY_PREEMPTION',
              wait_time_sec: 0,
              green_corridor_active: true
            };
          }
          return {
            ...j,
            signal_state: j.green_corridor_active ? 'GREEN_CORRIDOR' : 'GREEN',
            wait_time_sec: j.green_corridor_active ? 0 : 12
          };
        });

        let vehicleAlerted = false;
        const updatedDevices = (prev.road_safety?.devices || []).map(d => {
          const dist = calculateDistMeters(curLat, curLng, d.lat, d.lng);
          const inZone = dist <= 50.0 && d.is_on_road;
          if (inZone) vehicleAlerted = true;
          return {
            ...d,
            distance_to_ambulance_m: Math.round(dist),
            alert_status: inZone ? 'ALERT_DISPATCHED' : (dist < 100 ? 'IN_RANGE' : 'NORMAL')
          };
        });

        if (vehicleAlerted && !prevAlertedCarRef.current && !audioMuted) {
          sirenSynth.playSiren(4.0);
        }
        prevAlertedCarRef.current = vehicleAlerted;

        return {
          ...prev,
          timestamp: new Date().toISOString(),
          mission_status: missionStatus,
          phase: activePhaseRef.current,
          ambulance: {
            ...prev.ambulance,
            lat: Number(curLat.toFixed(6)),
            lng: Number(curLng.toFixed(6)),
            heading_deg: curHeading,
            speed_kmh: Number(currentSpeedKmh.toFixed(1)),
            warning_zone_radius_m: 50.0
          },
          navigation: {
            ...prev.navigation,
            distance_remaining_m: Math.round(remainingMeters),
            distance_remaining_km: Number(remainingKm.toFixed(2)),
            eta_seconds: etaSec,
            eta_minutes: etaMin,
            current_waypoint_index: segIdx,
            next_waypoint_name: targetP2.name || 'Next Waypoint',
            waypoints: waypoints
          },
          traffic: {
            ...prev.traffic,
            junctions: updatedJunctions
          },
          road_safety: {
            ...prev.road_safety,
            devices: updatedDevices
          },
          simulation: {
            ...prev.simulation,
            is_running: simRunningRef.current,
            speed: simSpeedRef.current,
            demo_mode_active: demoActiveRef.current
          }
        };
      });
    }, 1000);

    return () => clearInterval(simInterval);
  }, [audioMuted]);

  // -------------------------------------------------------------------------
  // Mission Actions (Seamlessly support both Backend REST & Standalone Client)
  // -------------------------------------------------------------------------
  const activateEmergency = async () => {
    simRunningRef.current = true;
    activePhaseRef.current = 'TO_PATIENT';
    setTelemetry(prev => ({
      ...prev,
      mission_status: 'EN_ROUTE_PATIENT',
      phase: 'TO_PATIENT',
      simulation: { ...prev.simulation, is_running: true }
    }));
    try {
      await fetch('/api/mission/activate', { method: 'POST' });
    } catch (e) {}
  };

  const confirmPickup = async () => {
    activePhaseRef.current = 'TO_HOSPITAL';
    segmentIdxRef.current = 0;
    segmentProgressRef.current = 0.0;
    const hospitalRoute = fallbackBundle.routes?.gandhi || fallbackBundle.routes?.primary;
    currentRouteRef.current = hospitalRoute;

    setTelemetry(prev => ({
      ...prev,
      mission_status: 'PATIENT_PICKED_UP',
      phase: 'TO_HOSPITAL',
      navigation: {
        ...prev.navigation,
        route_name: 'Patient Pickup to Gandhi Hospital Trauma Bay',
        waypoints: hospitalRoute,
        current_waypoint_index: 0
      }
    }));

    try {
      await fetch('/api/mission/pickup', { method: 'POST' });
    } catch (e) {}
  };

  const completeMission = async () => {
    simRunningRef.current = false;
    setTelemetry(prev => ({
      ...prev,
      mission_status: 'MISSION_COMPLETED',
      simulation: { ...prev.simulation, is_running: false }
    }));
    try {
      await fetch('/api/mission/complete', { method: 'POST' });
    } catch (e) {}
  };

  const resetMission = async () => {
    simRunningRef.current = true;
    segmentIdxRef.current = 0;
    segmentProgressRef.current = 0.0;
    activePhaseRef.current = 'TO_PATIENT';
    demoActiveRef.current = false;
    currentRouteRef.current = fallbackBundle.routes?.primary || fallbackBundle.initialTelemetry.navigation.waypoints;

    setTelemetry({
      ...fallbackBundle.initialTelemetry,
      timestamp: new Date().toISOString(),
      simulation: {
        is_running: true,
        speed: 1.0,
        demo_mode_active: false
      }
    });

    try {
      await fetch('/api/mission/reset', { method: 'POST' });
    } catch (e) {}
  };

  const changeHospital = async (hospitalId) => {
    const selectedHosp = hospitals.find(h => h.id === hospitalId) || hospitals[0];
    if (selectedHosp) {
      setTelemetry(prev => ({
        ...prev,
        hospital: {
          ...prev.hospital,
          ...selectedHosp,
          eta_seconds: 360
        }
      }));
    }
    try {
      await fetch('/api/mission/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId })
      });
    } catch (e) {}
  };

  const updatePatientLocation = async (patientData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'patient:location:update',
        ...patientData
      }));
    }

    setTelemetry(prev => {
      const updatedWaypoints = [...(currentRouteRef.current || prev.navigation.waypoints)];
      if (updatedWaypoints.length > 0 && patientData.lat && patientData.lng) {
        updatedWaypoints[updatedWaypoints.length - 1] = {
          name: patientData.location_name || 'Custom Patient Location',
          lat: Number(patientData.lat),
          lng: Number(patientData.lng),
          speed_limit: 40
        };
        currentRouteRef.current = updatedWaypoints;
      }

      return {
        ...prev,
        patient: {
          ...prev.patient,
          ...patientData
        },
        navigation: {
          ...prev.navigation,
          waypoints: updatedWaypoints
        }
      };
    });

    try {
      await fetch('/api/patient/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
    } catch (e) {}
  };

  const addCustomHospital = async (hospitalData) => {
    const newHosp = {
      id: 'HOSP-CUSTOM-' + Date.now(),
      name: hospitalData.name || 'Custom Emergency Hospital',
      locality: hospitalData.locality || 'Hyderabad Urban Center',
      lat: Number(hospitalData.lat || 17.4241),
      lng: Number(hospitalData.lng || 78.5034),
      emergency_beds_available: Number(hospitalData.emergency_beds || 10),
      icu_beds_available: Number(hospitalData.icu_beds || 4)
    };

    setHospitals(prev => [newHosp, ...prev]);
    setTelemetry(prev => ({
      ...prev,
      hospital: { ...prev.hospital, ...newHosp }
    }));

    try {
      await fetch('/api/hospital/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospitalData)
      });
    } catch (e) {}
  };

  const playSimulation = async () => {
    simRunningRef.current = true;
    setTelemetry(prev => ({
      ...prev,
      simulation: { ...prev.simulation, is_running: true }
    }));
    try {
      await fetch('/api/simulation/play', { method: 'POST' });
    } catch (e) {}
  };

  const pauseSimulation = async () => {
    simRunningRef.current = false;
    setTelemetry(prev => ({
      ...prev,
      simulation: { ...prev.simulation, is_running: false }
    }));
    try {
      await fetch('/api/simulation/pause', { method: 'POST' });
    } catch (e) {}
  };

  const setSpeed = async (multiplier) => {
    simSpeedRef.current = multiplier;
    setTelemetry(prev => ({
      ...prev,
      simulation: { ...prev.simulation, speed: multiplier }
    }));
    try {
      await fetch('/api/simulation/speed/' + multiplier, { method: 'POST' });
    } catch (e) {}
  };

  const injectTraffic = async (junctionId, level, index, delay) => {
    setTelemetry(prev => ({
      ...prev,
      traffic: {
        ...prev.traffic,
        junctions: (prev.traffic?.junctions || []).map(j => {
          if (j.id === junctionId || j.junction_id === junctionId) {
            return {
              ...j,
              congestion_level: level,
              congestion_index: index,
              delay_minutes: delay
            };
          }
          return j;
        })
      }
    }));
    try {
      await fetch('/api/simulation/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          junction_id: junctionId,
          congestion_level: level,
          congestion_index: index,
          delay_minutes: delay
        })
      });
    } catch (e) {}
  };

  const toggleGreenCorridor = async (junctionId, status) => {
    setTelemetry(prev => ({
      ...prev,
      traffic: {
        ...prev.traffic,
        junctions: (prev.traffic?.junctions || []).map(j => {
          if (j.id === junctionId || j.junction_id === junctionId) {
            return {
              ...j,
              green_corridor_active: status,
              signal_state: status ? 'GREEN_CORRIDOR' : 'GREEN'
            };
          }
          return j;
        })
      }
    }));
    try {
      await fetch('/api/simulation/green-corridor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ junction_id: junctionId, status: status })
      });
    } catch (e) {}
  };

  // 1-Click Complete Academic Demonstration Runner
  const startDemoMode = async () => {
    demoActiveRef.current = true;
    simRunningRef.current = true;
    simSpeedRef.current = 2.0;
    segmentIdxRef.current = 0;
    segmentProgressRef.current = 0.0;
    activePhaseRef.current = 'TO_PATIENT';
    currentRouteRef.current = fallbackBundle.routes?.primary || fallbackBundle.initialTelemetry.navigation.waypoints;

    setTelemetry(prev => ({
      ...prev,
      mission_status: 'EN_ROUTE_PATIENT',
      simulation: { ...prev.simulation, demo_mode_active: true, speed: 2.0, is_running: true }
    }));

    // Step 1: Inject Uppal gridlock after 4 seconds
    setTimeout(() => {
      injectTraffic('J1_UPPAL', 'GRIDLOCK', 95, 4.5);
      
      // Step 2: Reroute via Nacharam bypass after 3 seconds
      setTimeout(() => {
        if (fallbackBundle.routes?.alternate) {
          currentRouteRef.current = fallbackBundle.routes.alternate;
          setTelemetry(prev => ({
            ...prev,
            navigation: {
              ...prev.navigation,
              active_route_type: 'ALTERNATE_BYPASS',
              route_name: 'AURA Dynamic Bypass via Nacharam IDA',
              waypoints: fallbackBundle.routes.alternate,
              route_changed_reason: 'Heavy gridlock at Uppal Circle. Bypassed via Nacharam saving 3.4 minutes.'
            }
          }));
        }
      }, 3000);
    }, 4000);

    try {
      await fetch('/api/simulation/demo', { method: 'POST' });
    } catch (e) {}
  };

  // -------------------------------------------------------------------------
  // GPS & Real Device Geolocation Tracking
  // -------------------------------------------------------------------------
  const sendLocationUpdate = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'ambulance:location:update',
          ...payload
        }));
      } catch (e) {}
    }

    setTelemetry(prev => ({
      ...prev,
      ambulance: {
        ...prev.ambulance,
        lat: payload.lat,
        lng: payload.lng,
        heading_deg: payload.heading,
        speed_kmh: payload.speed,
        gps_accuracy_m: payload.accuracy,
        tracking_mode: 'REAL_GPS'
      }
    }));

    const now = Date.now();
    if (now - lastLocationSentRef.current >= 1000) {
      lastLocationSentRef.current = now;
      fetch('/api/ambulance/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  };

  const startGpsTracking = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsStatus('OFFLINE');
      setGpsDiagnostics(prev => ({
        ...prev,
        permission: 'unavailable',
        errorMessage: 'Geolocation API not supported on this device/browser.'
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setGpsStatus('RECONNECTING');

    const handleSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const now = Date.now();

      let finalHeading = (heading !== null && !isNaN(heading) && heading >= 0) ? Math.round(heading) : 0;
      let finalSpeed = (speed !== null && !isNaN(speed) && speed >= 0) ? Math.round(speed * 3.6) : 0;

      if (prevPositionRef.current) {
        const prev = prevPositionRef.current;
        const distM = calculateDistMeters(prev.lat, prev.lng, latitude, longitude);
        const dtSec = (now - prev.time) / 1000;

        if (distM > 3) {
          finalHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
          if ((speed === null || isNaN(speed) || speed < 0) && dtSec > 0) {
            finalSpeed = Math.min(140, Math.round(((distM / 1000) / (dtSec / 3600))));
          }
        } else {
          finalHeading = prev.heading;
        }
      }

      prevPositionRef.current = { lat: latitude, lng: longitude, time: now, heading: finalHeading };

      setGpsStatus('LIVE');
      setGpsDiagnostics({
        permission: 'granted',
        isTracking: true,
        lat: latitude,
        lng: longitude,
        accuracy: Math.round(accuracy || 0),
        speed: finalSpeed,
        heading: finalHeading,
        lastUpdateSec: 0,
        errorMessage: null
      });

      sendLocationUpdate({
        lat: latitude,
        lng: longitude,
        speed: finalSpeed,
        heading: finalHeading,
        accuracy: Math.round(accuracy || 0),
        timestamp: new Date().toISOString(),
        tracking_mode: 'REAL_GPS'
      });
    };

    const handleError = (error) => {
      let errMsg = 'Unable to retrieve location';
      let perm = 'prompt';
      let st = 'RECONNECTING';

      if (error.code === 1) {
        errMsg = 'Location access denied. Please allow GPS in browser settings.';
        perm = 'denied';
        st = 'OFFLINE';
      } else if (error.code === 2) {
        errMsg = 'GPS signal unavailable. Acquiring satellite lock...';
      } else if (error.code === 3) {
        errMsg = 'Location request timed out. Retrying GPS lock...';
      }

      setGpsStatus(st);
      setGpsDiagnostics(prev => ({
        ...prev,
        permission: perm,
        errorMessage: errMsg
      }));
    };

    try {
      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      });
      watchIdRef.current = watchId;
      setGpsDiagnostics(prev => ({ ...prev, isTracking: true, permission: 'granted' }));
    } catch (err) {
      setGpsStatus('OFFLINE');
      setGpsDiagnostics(prev => ({ ...prev, errorMessage: err.message || 'Error starting GPS' }));
    }
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setGpsDiagnostics(prev => ({ ...prev, isTracking: false }));
    setGpsStatus('OFFLINE');
  };

  const setTrackingMode = async (mode) => {
    setTrackingModeState(mode);
    trackingModeRef.current = mode;

    try {
      await fetch('/api/ambulance/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_mode: mode })
      });
    } catch (e) {}

    if (mode === 'REAL_GPS') {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Voice Assistant with Intelligent In-Browser Local Fallback
  // -------------------------------------------------------------------------
  const generateLocalVoiceResponse = (query) => {
    const q = query.toLowerCase();
    const curTelemetry = telemetry || fallbackBundle.initialTelemetry;

    if (q.includes('reroute') || q.includes('route') || q.includes('why')) {
      return {
        intent: 'EXPLAIN_ROUTE',
        confidence: 0.96,
        response_text: curTelemetry.navigation.route_changed_reason ||
          'Route optimized to avoid congestion at Uppal Circle, proceeding via Nacharam bypass to ensure zero emergency delays.',
        data: { route: curTelemetry.navigation.route_name }
      };
    }
    if (q.includes('patient') || q.includes('vital') || q.includes('condition')) {
      const p = curTelemetry.patient;
      return {
        intent: 'PATIENT_STATUS',
        confidence: 0.98,
        response_text: 'Patient ' + p.name + ', age ' + p.age + ', triaged as critical code red. Current SpO2 is ' + p.vitals.spo2_percent + '%, heart rate ' + p.vitals.heart_rate_bpm + ' beats per minute.',
        data: p.vitals
      };
    }
    if (q.includes('hospital') || q.includes('eta') || q.includes('arrival') || q.includes('time')) {
      const h = curTelemetry.hospital;
      const etaMin = curTelemetry.navigation.eta_minutes;
      return {
        intent: 'HOSPITAL_ETA',
        confidence: 0.95,
        response_text: 'Destination is ' + h.name + '. Estimated arrival in ' + etaMin + ' minutes. Emergency trauma team has been notified.',
        data: { hospital: h.name, eta_minutes: etaMin }
      };
    }
    if (q.includes('traffic') || q.includes('signal') || q.includes('corridor')) {
      return {
        intent: 'TRAFFIC_STATUS',
        confidence: 0.94,
        response_text: 'AURA Dynamic Green Corridor is activated. Approaching traffic signals have granted preemption clearance.',
        data: { green_corridor: true }
      };
    }

    return {
      intent: 'GENERAL_TELEMETRY',
      confidence: 0.88,
      response_text: 'AURA Autonomous Emergency System operational. Speed ' + curTelemetry.ambulance.speed_kmh + ' km/h, distance remaining ' + curTelemetry.navigation.distance_remaining_km + ' km.',
      data: curTelemetry.ambulance
    };
  };

  const sendVoiceQuery = async (queryText, optionalRequestId = null) => {
    if (!queryText || !queryText.trim()) return null;
    const reqId = optionalRequestId || speechService.activeRequestId || ('req-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    speechService.activeRequestId = reqId;

    try {
      speechService.initAudioContext();
      speechService.emitState('ANALYZING');
      speechService.updateDebug({
        requestId: reqId,
        transcript: queryText,
        lastSpokenText: '',
        detectedIntent: 'Analyzing...',
        confidence: 0
      });

      let data;
      try {
        const res = await fetch('/api/voice/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: queryText })
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch (err) {}

      if (!data || !data.response_text) {
        data = generateLocalVoiceResponse(queryText);
      }

      if (speechService.activeRequestId && speechService.activeRequestId !== reqId) {
        return null;
      }

      setVoiceHistory(prev => [data, ...prev]);

      speechService.updateDebug({
        detectedIntent: data.intent || 'unknown',
        confidence: data.confidence || 0,
        auraData: data.data || {},
        lastSpokenText: data.response_text
      });

      if (!audioMuted && data.speak !== false && data.response_text) {
        speechService.speak(data.response_text, { requestId: reqId });
      } else {
        speechService.emitState('READY');
      }
      return data;
    } catch (e) {
      speechService.updateDebug({ errorMessage: e.message || 'Error processing voice query' });
      speechService.emitState('ERROR');
      return null;
    }
  };

  const startVoiceListening = () => {
    speechService.startListening((transcript, requestId) => {
      sendVoiceQuery(transcript, requestId);
    });
  };

  const stopVoiceListening = () => {
    speechService.stopListening();
  };

  const replayLastVoice = (text) => {
    const toSpeak = text || voiceDebug.lastSpokenText || (voiceHistory[0] && voiceHistory[0].response_text);
    if (toSpeak) {
      speechService.speak(toSpeak);
    }
  };

  return (
    <AuraContext.Provider value={{
      telemetry,
      isConnected,
      activeTab,
      setActiveTab,
      audioMuted,
      setAudioMuted,
      voiceAssistantOpen,
      setVoiceAssistantOpen,
      voiceHistory,
      hospitals,
      voiceState,
      voiceDebug,
      speechService,
      trackingMode,
      setTrackingMode,
      followAmbulance,
      setFollowAmbulance,
      gpsStatus,
      gpsDiagnostics,
      startGpsTracking,
      stopGpsTracking,
      startVoiceListening,
      stopVoiceListening,
      replayLastVoice,
      activateEmergency,
      confirmPickup,
      completeMission,
      resetMission,
      changeHospital,
      updatePatientLocation,
      addCustomHospital,
      pickupPresets,
      pickupModalOpen,
      setPickupModalOpen,
      hospitalModalOpen,
      setHospitalModalOpen,
      playSimulation,
      pauseSimulation,
      setSpeed,
      startDemoMode,
      injectTraffic,
      toggleGreenCorridor,
      sendVoiceQuery
    }}>
      {children}
    </AuraContext.Provider>
  );
};

export const useAura = () => useContext(AuraContext);
