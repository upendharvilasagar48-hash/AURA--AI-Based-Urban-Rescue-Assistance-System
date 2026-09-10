import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

// Safe dynamic imports for Expo packages (supports Expo, React Native, and Web fallback)
let Location = null;
let Speech = null;
let KeepAwake = null;

try {
  Location = require('expo-location');
} catch (e) {
  console.log('[AURA Mobile] expo-location will use browser/device fallback');
}

try {
  Speech = require('expo-speech');
} catch (e) {
  console.log('[AURA Mobile] expo-speech will use Web Speech fallback');
}

try {
  KeepAwake = require('expo-keep-awake');
} catch (e) {
  // Optional
}

const MobileAuraContext = createContext(null);

export const MobileAuraProvider = ({ children }) => {
  // Default host IP: for Android emulator use 10.0.2.2, for web use hostname, for phone default to 192.168.1.100 or localhost
  const defaultHost = Platform.OS === 'android' ? '10.0.2.2:8000' : '127.0.0.1:8000';
  const [serverHost, setServerHost] = useState(defaultHost);
  const [telemetry, setTelemetry] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [trackingMode, setTrackingMode] = useState('REAL_GPS'); // Default to Real Phone GPS on mobile
  const [gpsStatus, setGpsStatus] = useState('OFFLINE'); // 'LIVE' | 'RECONNECTING' | 'OFFLINE'
  const [voiceState, setVoiceState] = useState('READY'); // 'READY' | 'LISTENING' | 'ANALYZING' | 'SPEAKING' | 'ERROR'
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pickupPresets, setPickupPresets] = useState([]);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
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

  const wsRef = useRef(null);
  const locationSubRef = useRef(null);
  const prevPositionRef = useRef(null);
  const lastLocationSentRef = useRef(0);
  const activeRequestIdRef = useRef(null);

  // Keep screen awake while driver is navigating
  useEffect(() => {
    if (KeepAwake?.activateKeepAwakeAsync) {
      KeepAwake.activateKeepAwakeAsync().catch(() => {});
    }
    return () => {
      if (KeepAwake?.deactivateKeepAwake) {
        KeepAwake.deactivateKeepAwake();
      }
    };
  }, []);

  // Update lastUpdateSec counter
  useEffect(() => {
    const timer = setInterval(() => {
      setGpsDiagnostics(prev => {
        if (!prev.isTracking) return prev;
        return { ...prev, lastUpdateSec: prev.lastUpdateSec + 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize and maintain WebSocket connection to AURA Backend
  useEffect(() => {
    let reconnectTimeout;
    let isMounted = true;

    const connectWs = () => {
      if (!isMounted) return;
      const cleanHost = serverHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      const wsUrl = `ws://${cleanHost}/ws/telemetry`;

      try {
        console.log(`[AURA Mobile] Connecting to WebSocket: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          console.log('[AURA Mobile] WebSocket connected successfully');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data);
          } catch (e) {
            console.warn('[AURA Mobile] Error parsing telemetry data:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 2500);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [serverHost]);

  // Utility to calculate bearing
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

  // Send location update to Backend
  const sendLocationUpdate = (payload) => {
    // 1. WebSocket Broadcast
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'ambulance:location:update',
          ...payload
        }));
      } catch (e) {
        console.warn('[AURA Mobile] WS send error:', e);
      }
    }

    // 2. Throttled REST Ingest
    const now = Date.now();
    if (now - lastLocationSentRef.current >= 1000) {
      lastLocationSentRef.current = now;
      const cleanHost = serverHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
      fetch(`http://${cleanHost}/api/ambulance/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  };

  // Start Hardware GPS Tracking
  const startGpsTracking = async () => {
    setGpsStatus('RECONNECTING');

    const handleCoords = (coords) => {
      const { latitude, longitude, accuracy, speed, heading } = coords;
      const now = Date.now();

      let finalHeading = (heading !== null && !isNaN(heading) && heading >= 0) ? Math.round(heading) : 0;
      let finalSpeed = (speed !== null && !isNaN(speed) && speed >= 0) ? Math.round(speed * 3.6) : 0; // m/s to km/h

      if (prevPositionRef.current) {
        const prev = prevPositionRef.current;
        const dLat = (latitude - prev.lat) * 111000;
        const dLng = (longitude - prev.lng) * 111000 * Math.cos(latitude * Math.PI / 180);
        const distM = Math.sqrt(dLat * dLat + dLng * dLng);
        const dtSec = (now - prev.time) / 1000;

        if (distM > 3) {
          finalHeading = calculateBearing(prev.lat, prev.lng, latitude, longitude);
          if ((speed === null || isNaN(speed) || speed < 0) && dtSec > 0) {
            finalSpeed = Math.min(140, Math.round((distM / dtSec) * 3.6));
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
        tracking_mode: 'REAL_GPS'
      };

      sendLocationUpdate(payload);
    };

    // 1. Use expo-location if available
    if (Location?.requestForegroundPermissionsAsync && Location?.watchPositionAsync) {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setGpsStatus('OFFLINE');
          setGpsDiagnostics(prev => ({
            ...prev,
            permission: 'denied',
            errorMessage: 'GPS permission denied. Please allow location access in phone settings.'
          }));
          return;
        }

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1
          },
          (loc) => handleCoords(loc.coords)
        );
        locationSubRef.current = sub;
        setGpsDiagnostics(prev => ({ ...prev, isTracking: true, permission: 'granted' }));
        return;
      } catch (err) {
        console.warn('[AURA Mobile] expo-location failed, falling back to navigator.geolocation', err);
      }
    }

    // 2. Standard Browser / WebView Geolocation Fallback
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => handleCoords(pos.coords),
          (err) => {
            setGpsStatus('OFFLINE');
            setGpsDiagnostics(prev => ({ ...prev, errorMessage: err.message || 'GPS Signal Unavailable' }));
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
        locationSubRef.current = { remove: () => navigator.geolocation.clearWatch(watchId) };
        setGpsDiagnostics(prev => ({ ...prev, isTracking: true, permission: 'granted' }));
      } catch (e) {
        setGpsStatus('OFFLINE');
      }
    }
  };

  const stopGpsTracking = () => {
    if (locationSubRef.current) {
      if (typeof locationSubRef.current.remove === 'function') {
        locationSubRef.current.remove();
      }
      locationSubRef.current = null;
    }
    setGpsDiagnostics(prev => ({ ...prev, isTracking: false }));
    setGpsStatus('OFFLINE');
  };

  // Start GPS tracking on mount
  useEffect(() => {
    startGpsTracking();
    return () => stopGpsTracking();
  }, []);

  // REST API Actions
  const cleanHost = serverHost.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');
  const baseUrl = `http://${cleanHost}`;

  const activateEmergency = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/mission/activate`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('activateEmergency error:', e);
    }
  };

  const confirmPickup = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/mission/pickup`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('confirmPickup error:', e);
    }
  };

  const completeMission = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/mission/complete`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn('completeMission error:', e);
    }
  };

  // Fetch Hyderabad pickup presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/locations/presets`);
        if (res.ok) {
          const data = await res.json();
          if (data.presets && Array.isArray(data.presets)) {
            setPickupPresets(data.presets);
            return;
          }
        }
      } catch (e) {}
      
      // Fallback presets if offline
      setPickupPresets([
        { id: 'preset-boduppal', name: 'Boduppal Main Road', lat: 17.4135, lng: 78.5786, description: 'Boduppal X Roads' },
        { id: 'preset-uppal', name: 'Uppal Metro Station', lat: 17.4018, lng: 78.5602, description: 'Uppal Junction Pillar 802' },
        { id: 'preset-habsiguda', name: 'Habsiguda Street 8', lat: 17.4168, lng: 78.5412, description: 'Near Habsiguda Signal' },
        { id: 'preset-tarnaka', name: 'Tarnaka Flyover Junction', lat: 17.4278, lng: 78.5284, description: 'Tarnaka Hospital Road' },
        { id: 'preset-secbad', name: 'Secunderabad Railway Station', lat: 17.4338, lng: 78.5015, description: 'Platform 1 Main Entrance' },
        { id: 'preset-begumpet', name: 'Begumpet Airport Road', lat: 17.4435, lng: 78.4725, description: 'Pillar 1220 Begumpet' },
        { id: 'preset-banjara', name: 'Banjara Hills Road No. 12', lat: 17.4156, lng: 78.4350, description: 'Near Cancer Hospital' },
        { id: 'preset-hitec', name: 'Hitec City Cyber Towers', lat: 17.4504, lng: 78.3808, description: 'Cyber Towers Main Gate' }
      ]);
    };
    fetchPresets();
  }, [baseUrl]);

  const updatePatientLocation = async (patientData) => {
    try {
      const res = await fetch(`${baseUrl}/api/patient/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      const data = await res.json();
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'patient:location:update',
          ...patientData
        }));
      }
      return data;
    } catch (e) {
      console.warn('updatePatientLocation error:', e);
      return { success: false, error: e.message };
    }
  };

  const addCustomHospital = async (hospitalData) => {
    try {
      const res = await fetch(`${baseUrl}/api/hospital/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hospitalData)
      });
      return await res.json();
    } catch (e) {
      console.warn('addCustomHospital error:', e);
      return { success: false, error: e.message };
    }
  };

  const changeHospital = async (hospitalId) => {
    try {
      const res = await fetch(`${baseUrl}/api/mission/hospital`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital_id: hospitalId })
      });
      return await res.json();
    } catch (e) {
      console.warn('changeHospital error:', e);
    }
  };

  // Voice Assistant with anti-repeat requestId protection
  const sendVoiceQuery = async (queryText) => {
    if (!queryText || !queryText.trim()) return null;
    const reqId = 'req-mob-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    activeRequestIdRef.current = reqId;

    try {
      setVoiceState('ANALYZING');
      const res = await fetch(`${baseUrl}/api/voice/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      const data = await res.json();

      if (activeRequestIdRef.current !== reqId) {
        console.warn('[AURA Mobile] Discarding stale voice response');
        return null;
      }

      setVoiceHistory(prev => [data, ...prev]);

      if (data.response_text) {
        setVoiceState('SPEAKING');
        // Native Speech Synthesis
        if (Speech?.speak) {
          Speech.stop();
          Speech.speak(data.response_text, {
            language: 'en-IN',
            rate: 1.05,
            onDone: () => setVoiceState('READY'),
            onError: () => setVoiceState('READY')
          });
        } else if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(data.response_text);
          utter.lang = 'en-IN';
          utter.onend = () => setVoiceState('READY');
          utter.onerror = () => setVoiceState('READY');
          window.speechSynthesis.speak(utter);
        } else {
          setTimeout(() => setVoiceState('READY'), 2000);
        }
      } else {
        setVoiceState('READY');
      }

      return data;
    } catch (e) {
      console.warn('Voice query error:', e);
      setVoiceState('ERROR');
      setTimeout(() => setVoiceState('READY'), 2000);
      return null;
    }
  };

  return (
    <MobileAuraContext.Provider value={{
      serverHost,
      setServerHost,
      telemetry,
      isConnected,
      trackingMode,
      setTrackingMode,
      gpsStatus,
      gpsDiagnostics,
      startGpsTracking,
      stopGpsTracking,
      activateEmergency,
      confirmPickup,
      completeMission,
      changeHospital,
      voiceState,
      setVoiceState,
      voiceHistory,
      voiceModalOpen,
      setVoiceModalOpen,
      settingsModalOpen,
      setSettingsModalOpen,
      pickupPresets,
      updatePatientLocation,
      addCustomHospital,
      patientModalOpen,
      setPatientModalOpen,
      hospitalModalOpen,
      setHospitalModalOpen,
      sendVoiceQuery
    }}>
      {children}
    </MobileAuraContext.Provider>
  );
};

export const useMobileAura = () => useContext(MobileAuraContext);
