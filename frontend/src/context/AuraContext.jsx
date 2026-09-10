import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sirenSynth } from '../utils/audioSynth';
import { speechService } from '../utils/speechService';

const AuraContext = createContext(null);

export const AuraProvider = ({ children }) => {
  const [telemetry, setTelemetry] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('ambulance'); // 'ambulance' | 'traffic' | 'vehicle' | 'control'
  const [audioMuted, setAudioMuted] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [pickupPresets, setPickupPresets] = useState([]);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [voiceState, setVoiceState] = useState('READY'); // 'READY' | 'LISTENING' | 'ANALYZING' | 'SPEAKING' | 'ERROR'
  const [voiceDebug, setVoiceDebug] = useState(() => speechService.getDebugSnapshot());
  const [trackingMode, setTrackingModeState] = useState('DEMO'); // 'DEMO' | 'REAL_GPS'
  const [followAmbulance, setFollowAmbulance] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('OFFLINE'); // 'LIVE' | 'RECONNECTING' | 'OFFLINE'
  const [gpsDiagnostics, setGpsDiagnostics] = useState({
    permission: 'prompt', // 'prompt' | 'granted' | 'denied' | 'unavailable'
    isTracking: false,
    lat: null,
    lng: null,
    accuracy: null,
    speed: null,
    heading: null,
    lastUpdateSec: 0,
    errorMessage: null
  });

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

  // Fetch preset Hyderabad pickup locations and hospitals
  useEffect(() => {
    fetch('/api/locations/presets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.pickup_presets) setPickupPresets(data.pickup_presets);
          if (data.hospitals) setHospitals(data.hospitals);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize and connect WebSocket
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

            // Check if a road vehicle just entered the 50m alert zone to trigger siren
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
            console.error("Error parsing telemetry WebSocket data:", e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 2000);
        };

        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connectWs, 2500);
      }
    };

    connectWs();

    // Fetch hospital list
    fetch('/api/hospitals')
      .then(r => r.json())
      .then(data => setHospitals(data))
      .catch(() => {});

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [audioMuted]);

  // REST API Actions
  const activateEmergency = async () => {
    try {
      const res = await fetch('/api/mission/activate', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmPickup = async () => {
    try {
      const res = await fetch('/api/mission/pickup', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const completeMission = async () => {
    try {
      const res = await fetch('/api/mission/complete', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const resetMission = async () => {
    try {
      const res = await fetch('/api/mission/reset', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const changeHospital = async (hospitalId) => {
    try {
      const res = await fetch('/api/mission/hospital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const updatePatientLocation = async (patientData) => {
    try {
      // 1. Immediate WebSocket dispatch
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'patient:location:update',
          ...patientData
        }));
      }

      // 2. REST API dispatch
      const res = await fetch('/api/patient/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      const data = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }
      return data;
    } catch (e) {
      console.error("Error updating patient location:", e);
    }
  };

  const addCustomHospital = async (hospitalData) => {
    try {
      const res = await fetch('/api/hospital/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospitalData)
      });
      const data = await res.json();
      if (data.telemetry) {
        setTelemetry(data.telemetry);
      }
      return data;
    } catch (e) {
      console.error("Error adding custom hospital:", e);
    }
  };

  const playSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/play', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const pauseSimulation = async () => {
    try {
      const res = await fetch('/api/simulation/pause', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const setSpeed = async (multiplier) => {
    try {
      const res = await fetch(`/api/simulation/speed/${multiplier}`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const startDemoMode = async () => {
    try {
      const res = await fetch('/api/simulation/demo', { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const injectTraffic = async (junctionId, level, index, delay) => {
    try {
      const res = await fetch('/api/simulation/traffic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          junction_id: junctionId,
          congestion_level: level,
          congestion_index: index,
          delay_minutes: delay
        })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleGreenCorridor = async (junctionId, status) => {
    try {
      const res = await fetch('/api/simulation/green-corridor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ junction_id: junctionId, status: status })
      });
      return await res.json();
    } catch (e) {
      console.error(e);
    }
  };

  // Utility to calculate bearing between two coordinates
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

  // Utility to calculate distance in km
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const sendLocationUpdate = (payload) => {
    // 1. Send via WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'ambulance:location:update',
          ...payload
        }));
      } catch (e) {
        console.warn("WebSocket send location error:", e);
      }
    }

    // 2. Throttle fallback REST POST (every 1000ms max)
    const now = Date.now();
    if (now - lastLocationSentRef.current >= 1000) {
      lastLocationSentRef.current = now;
      fetch('/api/ambulance/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Location REST update fallback warning:', err));
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

      // Compute heading / bearing if not provided by device
      let finalHeading = (heading !== null && !isNaN(heading) && heading >= 0) ? Math.round(heading) : 0;
      let finalSpeed = (speed !== null && !isNaN(speed) && speed >= 0) ? Math.round(speed * 3.6) : 0;

      if (prevPositionRef.current) {
        const prev = prevPositionRef.current;
        const distKm = calculateDistanceKm(prev.lat, prev.lng, latitude, longitude);
        const dtSec = (now - prev.time) / 1000;

        if (distKm * 1000 > 3) {
          const computedBearing = calculateBearing(prev.lat, prev.lng, latitude, longitude);
          if (heading === null || isNaN(heading) || heading < 0) {
            finalHeading = computedBearing;
          }
          if ((speed === null || isNaN(speed) || speed < 0) && dtSec > 0) {
            finalSpeed = Math.min(140, Math.round((distKm / (dtSec / 3600))));
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

      const payload = {
        lat: latitude,
        lng: longitude,
        speed: finalSpeed,
        heading: finalHeading,
        accuracy: Math.round(accuracy || 0),
        timestamp: new Date().toISOString(),
        tracking_mode: trackingModeRef.current
      };

      sendLocationUpdate(payload);
    };

    const handleError = (error) => {
      console.warn("GPS watchPosition notice:", error);
      let errMsg = 'Unable to retrieve location';
      let perm = 'prompt';
      let st = 'RECONNECTING';

      if (error.code === 1) { // PERMISSION_DENIED
        errMsg = 'Location access denied. Please allow GPS permissions in browser settings.';
        perm = 'denied';
        st = 'OFFLINE';
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        errMsg = 'GPS signal unavailable. Acquiring satellite lock...';
        st = 'RECONNECTING';
      } else if (error.code === 3) { // TIMEOUT
        errMsg = 'Location request timed out. Retrying GPS lock...';
        st = 'RECONNECTING';
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
      console.error("Error starting GPS watch:", err);
      setGpsStatus('OFFLINE');
      setGpsDiagnostics(prev => ({
        ...prev,
        errorMessage: err.message || 'Error starting location service'
      }));
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
    } catch (e) {
      console.warn("Error setting backend tracking mode:", e);
    }

    if (mode === 'REAL_GPS') {
      startGpsTracking();
    } else {
      stopGpsTracking();
    }
  };

  // Clean up GPS watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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

      const res = await fetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await res.json();

      // Check if another query was started in the meantime - if so, discard stale response
      if (speechService.activeRequestId && speechService.activeRequestId !== reqId) {
        console.warn(`[AURA Voice] Discarding response for older request ${reqId}, active is ${speechService.activeRequestId}`);
        return null;
      }

      setVoiceHistory(prev => [data, ...prev]);

      speechService.updateDebug({
        detectedIntent: data.intent || 'unknown',
        confidence: data.confidence || 0,
        auraData: data.data || {},
        lastSpokenText: data.response_text
      });

      // Speak response using SpeechService if not muted and speak flag is true
      if (!audioMuted && data.speak !== false && data.response_text) {
        speechService.speak(data.response_text, { requestId: reqId });
      } else {
        speechService.emitState('READY');
      }
      return data;
    } catch (e) {
      console.error("sendVoiceQuery error:", e);
      speechService.updateDebug({ errorMessage: e.message || 'Network error processing voice query' });
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
