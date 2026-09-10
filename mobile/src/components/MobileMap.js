import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

let WebView = null;
try {
  WebView = require('react-native-webview').WebView;
} catch (e) {
  // Fallback for Web or environments without react-native-webview
}

export default function MobileMap({ telemetry }) {
  const webViewRef = useRef(null);
  const iframeRef = useRef(null);

  const ambLat = telemetry?.ambulance?.lat ?? 17.4220;
  const ambLng = telemetry?.ambulance?.lng ?? 78.5380;
  const heading = telemetry?.ambulance?.heading_deg ?? 0;
  const speed = telemetry?.ambulance?.speed_kmh ?? 0;
  const missionStatus = telemetry?.mission_status ?? 'IDLE';
  const waypoints = telemetry?.navigation?.waypoints || [];

  // Generate Leaflet HTML for Android WebView or Web iframe
  const generateMapHtml = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #0a0d14; }
          .custom-amb { display: flex; align-items: center; justify-content: center; }

          @keyframes amb-motion-ripple {
            0% { transform: scale(0.5); opacity: 0.9; }
            100% { transform: scale(2.3); opacity: 0; }
          }
          @keyframes strobe-red {
            0%, 48% { fill: #ff1744; filter: drop-shadow(0 0 6px #ff1744); }
            50%, 100% { fill: #500714; filter: none; }
          }
          @keyframes strobe-blue {
            0%, 48% { fill: #002554; filter: none; }
            50%, 100% { fill: #00f0ff; filter: drop-shadow(0 0 6px #00f0ff); }
          }
          @keyframes amb-glow-pulse {
            0%, 100% { filter: drop-shadow(0 0 8px rgba(255, 23, 68, 0.6)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.7)); }
            50% { filter: drop-shadow(0 0 16px rgba(255, 23, 68, 0.95)) drop-shadow(0 0 24px rgba(0, 240, 255, 0.8)); }
          }
          @keyframes headlight-glow {
            0%, 100% { opacity: 0.75; }
            50% { opacity: 0.95; }
          }

          .amb-motion-ripple-1 {
            animation: amb-motion-ripple 1.4s infinite cubic-bezier(0, 0.2, 0.8, 1);
          }
          .amb-motion-ripple-2 {
            animation: amb-motion-ripple 1.4s infinite cubic-bezier(0, 0.2, 0.8, 1);
            animation-delay: 0.7s;
          }
          .amb-strobe-red {
            animation: strobe-red 0.35s infinite alternate ease-in-out;
          }
          .amb-strobe-blue {
            animation: strobe-blue 0.35s infinite alternate ease-in-out;
          }
          .amb-moving-glow {
            animation: amb-glow-pulse 1.0s infinite ease-in-out;
          }
          .amb-headlight-shimmer {
            animation: headlight-glow 1.2s infinite alternate ease-in-out;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false, attributionControl: false })
            .setView([${ambLat}, ${ambLng}], 14);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd'
          }).addTo(map);

          let ambMarker = null;
          let sirenCircle = null;
          let activePoly = null;
          let completedPoly = null;
          let patientMarker = null;
          let hospitalMarker = null;

          function updatePatient(pt) {
            if (!pt || !pt.lat || !pt.lng) return;
            const ptHtml = 
              '<div style="position:relative;display:flex;flex-direction:column;align-items:center;">' +
              '<div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(239,68,68,0.25);border:2px solid #ef4444;animation:amb-motion-ripple 1.6s infinite ease-out;"></div>' +
              '<div style="width:26px;height:26px;border-radius:50%;background:#ef4444;border:2px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(239,68,68,0.8);color:#fff;font-size:12px;font-weight:900;">📍</div>' +
              '<div style="margin-top:2px;background:rgba(15,23,42,0.9);border:1px solid #ef4444;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:bold;color:#fca5a5;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.7);">' + (pt.name || 'Patient') + '</div>' +
              '</div>';

            const icon = L.divIcon({ html: ptHtml, className: '', iconSize: [80, 50], iconAnchor: [40, 20] });
            if (!patientMarker) {
              patientMarker = L.marker([pt.lat, pt.lng], { icon: icon, zIndexOffset: 500 }).addTo(map);
            } else {
              patientMarker.setLatLng([pt.lat, pt.lng]);
              patientMarker.setIcon(icon);
            }
          }

          function updateHospital(hosp) {
            if (!hosp || !hosp.lat || !hosp.lng) return;
            const hospHtml = 
              '<div style="position:relative;display:flex;flex-direction:column;align-items:center;">' +
              '<div style="width:28px;height:28px;border-radius:8px;background:#059669;border:2px solid #34d399;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(16,185,129,0.7);color:#fff;font-size:14px;">🏥</div>' +
              '<div style="margin-top:2px;background:rgba(15,23,42,0.9);border:1px solid #10b981;border-radius:6px;padding:2px 6px;font-size:9px;font-weight:bold;color:#6ee7b7;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.7);">' + (hosp.name || 'Hospital') + '</div>' +
              '</div>';

            const icon = L.divIcon({ html: hospHtml, className: '', iconSize: [80, 50], iconAnchor: [40, 20] });
            if (!hospitalMarker) {
              hospitalMarker = L.marker([hosp.lat, hosp.lng], { icon: icon, zIndexOffset: 500 }).addTo(map);
            } else {
              hospitalMarker.setLatLng([hosp.lat, hosp.lng]);
              hospitalMarker.setIcon(icon);
            }
          }

          function updateAmbulance(lat, lng, head, isEmerg, spd) {
            const isMoving = spd > 2 || isEmerg;
            const ripplesHtml = isMoving ? 
              '<div class="amb-motion-ripple-1" style="position:absolute;width:44px;height:44px;border-radius:50%;border:2px solid ' + (isEmerg ? 'rgba(255,23,68,0.85)' : 'rgba(0,229,255,0.85)') + ';pointer-events:none;"></div>' +
              '<div class="amb-motion-ripple-2" style="position:absolute;width:44px;height:44px;border-radius:50%;border:2px solid ' + (isEmerg ? 'rgba(255,23,68,0.7)' : 'rgba(0,229,255,0.7)') + ';pointer-events:none;"></div>' : '';

            const headlightsHtml = isMoving ?
              '<div class="amb-headlight-shimmer" style="position:absolute;top:-14px;width:34px;height:24px;background:linear-gradient(to top, rgba(254,240,138,0.55), rgba(240,240,138,0));clip-path:polygon(25% 100%,75% 100%,100% 0%,0% 0%);pointer-events:none;"></div>' +
              '<div style="position:absolute;top:-8px;color:' + (isEmerg ? '#ff1744' : '#00e5ff') + ';font-size:13px;font-weight:900;line-height:1;text-shadow:0 0 6px ' + (isEmerg ? '#ff1744' : '#00e5ff') + ';">▲</div>' : '';

            const speedPillHtml = 
              '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:rgba(10,13,20,0.92);border:1px solid ' + (isMoving ? '#00e5ff' : '#475569') + ';border-radius:9999px;padding:1px 6px;display:flex;align-items:center;gap:4px;font-size:10px;font-weight:800;color:#fff;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.8);pointer-events:none;z-index:10;">' +
              '<span style="width:6px;height:6px;border-radius:50%;background:' + (isMoving ? '#00f2fe' : '#94a3b8') + ';' + (isMoving ? 'box-shadow:0 0 6px #00f2fe;' : '') + '"></span>' +
              '<span>' + (isMoving ? Math.round(spd) + ' km/h' : 'IDLE') + '</span>' +
              '</div>';

            const svgHtml = 
              '<svg width="34" height="50" viewBox="0 0 34 50" fill="none" class="' + (isMoving ? 'amb-moving-glow' : '') + '" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,0.7));">' +
              '<rect x="2" y="5" width="30" height="42" rx="6" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>' +
              '<path d="M5 16 C5 13 8 11 12 11 L22 11 C26 11 29 13 29 16 L27 21 L7 21 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="0.8"/>' +
              '<rect x="2" y="24" width="4" height="18" fill="#ef4444"/>' +
              '<rect x="28" y="24" width="4" height="18" fill="#ef4444"/>' +
              '<rect x="7" y="41" width="8" height="3" rx="1" fill="#1e293b"/>' +
              '<rect x="19" y="41" width="8" height="3" rx="1" fill="#1e293b"/>' +
              '<circle cx="17" cy="31" r="7" fill="#ffffff" stroke="#e2e8f0" stroke-width="0.8"/>' +
              '<rect x="15.5" y="26.5" width="3" height="9" rx="0.8" fill="#ef4444"/>' +
              '<rect x="12.5" y="29.5" width="9" height="3" rx="0.8" fill="#ef4444"/>' +
              '<rect x="4" y="5" width="5" height="2.5" rx="1" fill="#fef08a"/>' +
              '<rect x="25" y="5" width="5" height="2.5" rx="1" fill="#fef08a"/>' +
              '<rect x="9" y="21" width="16" height="4" rx="2" fill="#090d16" stroke="#334155" stroke-width="0.5"/>' +
              '<circle cx="12" cy="23" r="2" class="' + (isMoving || isEmerg ? 'amb-strobe-red' : '') + '" fill="#ff1744"/>' +
              '<circle cx="22" cy="23" r="2" class="' + (isMoving || isEmerg ? 'amb-strobe-blue' : '') + '" fill="#00e5ff"/>' +
              '<circle cx="17" cy="23" r="1.2" fill="#f59e0b"/>' +
              '</svg>';

            const iconHtml = 
              '<div style="position:relative;width:70px;height:70px;display:flex;align-items:center;justify-content:center;">' +
              ripplesHtml +
              '<div style="transform:rotate(' + head + 'deg);transition:transform 0.25s linear;display:flex;align-items:center;justify-content:center;width:70px;height:70px;position:absolute;">' +
              headlightsHtml +
              svgHtml +
              '</div>' +
              speedPillHtml +
              '</div>';

            const icon = L.divIcon({ html: iconHtml, className: 'custom-amb', iconSize: [70, 70], iconAnchor: [35, 35] });

            if (!ambMarker) {
              ambMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
            } else {
              ambMarker.setLatLng([lat, lng]);
              ambMarker.setIcon(icon);
            }

            if (!sirenCircle) {
              sirenCircle = L.circle([lat, lng], {
                radius: 50,
                color: isEmerg ? '#ff1744' : '#00e5ff',
                fillColor: isEmerg ? '#ff1744' : '#00e5ff',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '4, 4'
              }).addTo(map);
            } else {
              sirenCircle.setLatLng([lat, lng]);
            }

            map.panTo([lat, lng], { animate: true, duration: 0.5 });
          }

          function updateRoutes(wps, curLat, curLng) {
            if (!wps || wps.length === 0) return;
            let nearestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < wps.length; i++) {
              const d = Math.pow(wps[i].lat - curLat, 2) + Math.pow(wps[i].lng - curLng, 2);
              if (d < minDist) { minDist = d; nearestIdx = i; }
            }

            const comp = wps.slice(0, nearestIdx + 1).map(w => [w.lat, w.lng]).concat([[curLat, curLng]]);
            const rem = [[curLat, curLng]].concat(wps.slice(nearestIdx + 1).map(w => [w.lat, w.lng]));

            if (completedPoly) map.removeLayer(completedPoly);
            if (comp.length > 1) {
              completedPoly = L.polyline(comp, { color: '#64748b', weight: 4, dashArray: '5, 8', opacity: 0.7 }).addTo(map);
            }

            if (activePoly) map.removeLayer(activePoly);
            if (rem.length > 1) {
              activePoly = L.polyline(rem, { color: '#00f2fe', weight: 5, opacity: 0.95 }).addTo(map);
            }
          }

          // Initial load
          const initialWps = ${JSON.stringify(waypoints)};
          const initialPt = ${JSON.stringify(telemetry?.patient || null)};
          const initialHosp = ${JSON.stringify(telemetry?.hospital || null)};
          updateAmbulance(${ambLat}, ${ambLng}, ${heading}, ${missionStatus !== 'IDLE'}, ${speed});
          updateRoutes(initialWps, ${ambLat}, ${ambLng});
          if (initialPt) updatePatient(initialPt);
          if (initialHosp) updateHospital(initialHosp);

          // Listen for postMessages
          window.addEventListener('message', function(e) {
            try {
              const d = JSON.parse(e.data);
              if (d.type === 'UPDATE_LOCATION') {
                updateAmbulance(d.lat, d.lng, d.heading, d.isEmergency, d.speed || 0);
                updateRoutes(d.waypoints, d.lat, d.lng);
                if (d.patient) updatePatient(d.patient);
                if (d.hospital) updateHospital(d.hospital);
              }
            } catch(err) {}
          });
          document.addEventListener('message', function(e) {
            try {
              const d = JSON.parse(e.data);
              if (d.type === 'UPDATE_LOCATION') {
                updateAmbulance(d.lat, d.lng, d.heading, d.isEmergency, d.speed || 0);
                updateRoutes(d.waypoints, d.lat, d.lng);
                if (d.patient) updatePatient(d.patient);
                if (d.hospital) updateHospital(d.hospital);
              }
            } catch(err) {}
          });
        </script>
      </body>
    </html>
  `;

  // Send updates to WebView / iframe
  useEffect(() => {
    const payload = JSON.stringify({
      type: 'UPDATE_LOCATION',
      lat: ambLat,
      lng: ambLng,
      heading: heading,
      speed: speed,
      isEmergency: missionStatus !== 'IDLE' && missionStatus !== 'MISSION_COMPLETED',
      waypoints: waypoints,
      patient: telemetry?.patient,
      hospital: telemetry?.hospital
    });

    if (webViewRef.current?.postMessage) {
      webViewRef.current.postMessage(payload);
    }
    if (iframeRef.current?.contentWindow?.postMessage) {
      iframeRef.current.contentWindow.postMessage(payload, '*');
    }
  }, [ambLat, ambLng, heading, missionStatus, waypoints, telemetry?.patient, telemetry?.hospital]);

  if (Platform.OS === 'web' || !WebView) {
    return (
      <View style={styles.container}>
        <iframe
          ref={iframeRef}
          srcDoc={generateMapHtml()}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="AURA Mobile Emergency Map"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: generateMapHtml() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0d14',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0d14'
  }
});
