import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useMobileAura } from '../context/MobileAuraContext';
import MobileMap from '../components/MobileMap';
import MobileVoiceModal from '../components/MobileVoiceModal';
import MobileLocationModal from '../components/MobileLocationModal';

export default function DriverCockpitScreen() {
  const {
    telemetry,
    isConnected,
    serverHost,
    setServerHost,
    gpsStatus,
    gpsDiagnostics,
    trackingMode,
    setTrackingMode,
    startGpsTracking,
    stopGpsTracking,
    activateEmergency,
    confirmPickup,
    completeMission,
    changeHospital,
    voiceState,
    setVoiceModalOpen,
    settingsModalOpen,
    setSettingsModalOpen,
    setPatientModalOpen,
    setHospitalModalOpen
  } = useMobileAura();

  const [tempHost, setTempHost] = useState(serverHost);

  const amb = telemetry?.ambulance || { speed_kmh: 0, heading_deg: 0, lat: 17.4135, lng: 78.5786 };
  const nav = telemetry?.navigation || { eta_minutes: 0, distance_remaining_km: 0, next_waypoint_name: 'Boduppal', active_route_type: 'PRIMARY' };
  const pt = telemetry?.patient || { name: 'Rajeshwar Rao', age: 58, gender: 'M', condition: 'Severe acute chest pain', location_name: 'Secunderabad Rail Nilayam Entrance', vitals: { heart_rate_bpm: 112, blood_pressure: '145/95', spo2_percent: 91 } };
  const hosp = telemetry?.hospital || { id: 'HOSP-GANDHI', name: 'Gandhi Hospital', emergency_beds_available: 14, icu_beds_available: 4, trauma_team_status: 'STANDBY' };
  const missionStatus = telemetry?.mission_status || 'IDLE';
  const phase = telemetry?.phase || 'TO_PATIENT';

  const isNearPatient = missionStatus === 'NEAR_PATIENT';
  const isHospitalPhase = phase === 'TO_HOSPITAL' || missionStatus === 'PATIENT_PICKED_UP';
  const isHospitalArrival = missionStatus === 'HOSPITAL_ARRIVAL';

  const handleSaveSettings = () => {
    if (tempHost.trim()) {
      setServerHost(tempHost.trim());
    }
    setSettingsModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0d14" />
      
      {/* TOP HEADER */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoBadge}>🚑 AURA</Text>
          <Text style={styles.callSign}>AMB-108-HYD</Text>
        </View>

        <View style={styles.headerRight}>
          {/* Connection Status */}
          <TouchableOpacity 
            onPress={() => setSettingsModalOpen(true)}
            style={[styles.connectionPill, isConnected ? styles.connOnline : styles.connOffline]}
          >
            <View style={[styles.dot, isConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.connText}>{isConnected ? 'LIVE' : 'OFFLINE'}</Text>
          </TouchableOpacity>

          {/* Settings / IP Button */}
          <TouchableOpacity 
            onPress={() => setSettingsModalOpen(true)}
            style={styles.settingsIconBtn}
          >
            <Text style={styles.settingsIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        
        {/* GPS DIAGNOSTICS & TELEMETRY RIBBON */}
        <View style={styles.ribbonCard}>
          <View style={styles.ribbonRow}>
            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>SPEED</Text>
              <Text style={styles.ribbonValue}>
                {amb.speed_kmh} <Text style={styles.ribbonUnit}>km/h</Text>
              </Text>
            </View>

            <View style={styles.ribbonDivider} />

            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>TARGET ETA</Text>
              <Text style={[styles.ribbonValue, { color: '#00f2fe' }]}>
                {nav.eta_minutes} <Text style={styles.ribbonUnit}>min</Text>
              </Text>
            </View>

            <View style={styles.ribbonDivider} />

            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>DISTANCE</Text>
              <Text style={styles.ribbonValue}>
                {nav.distance_remaining_km} <Text style={styles.ribbonUnit}>km</Text>
              </Text>
            </View>

            <View style={styles.ribbonDivider} />

            <View style={styles.ribbonItem}>
              <Text style={styles.ribbonLabel}>PHONE GPS</Text>
              <Text style={[styles.ribbonValue, { color: gpsStatus === 'LIVE' ? '#10b981' : '#f59e0b', fontSize: 13 }]}>
                {gpsStatus === 'LIVE' ? '🟢 LOCK' : '🟠 ACQ'}
              </Text>
            </View>
          </View>
        </View>

        {/* MAP VIEW CONTAINER (340px high portrait) */}
        <View style={styles.mapCard}>
          <MobileMap telemetry={telemetry} />

          {/* Floating Map HUD overlay */}
          <View style={styles.floatingMapHud}>
            <View style={styles.mapHudPill}>
              <Text style={styles.mapHudText}>
                📍 {nav.next_waypoint_name || 'Corridor'} &bull; {amb.heading_deg}°
              </Text>
            </View>
            <View style={[styles.mapHudPill, { backgroundColor: 'rgba(6, 182, 212, 0.25)', borderColor: '#06b6d4' }]}>
              <Text style={[styles.mapHudText, { color: '#67e8f9' }]}>
                {nav.active_route_type === 'ALTERNATE' ? '⚡ Nacharam Bypass' : '🛣️ Primary Corridor'}
              </Text>
            </View>
          </View>
        </View>

        {/* PRIMARY MISSION PHASE ACTION */}
        <View style={styles.actionCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MISSION DISPATCH CONTROLLER</Text>
            <Text style={styles.statusPill}>{missionStatus}</Text>
          </View>

          {missionStatus === 'IDLE' && (
            <TouchableOpacity 
              onPress={activateEmergency}
              style={[styles.bigBtn, styles.btnRed]}
            >
              <Text style={styles.bigBtnIcon}>🚨</Text>
              <Text style={styles.bigBtnText}>ACTIVATE EMERGENCY MISSION</Text>
            </TouchableOpacity>
          )}

          {(missionStatus === 'EN_ROUTE_PATIENT' || isNearPatient) && (
            <TouchableOpacity 
              onPress={confirmPickup}
              style={[styles.bigBtn, styles.btnCyan]}
            >
              <Text style={styles.bigBtnIcon}>✅</Text>
              <Text style={styles.bigBtnText}>CONFIRM PATIENT ONBOARD</Text>
            </TouchableOpacity>
          )}

          {isHospitalPhase && !isHospitalArrival && (
            <View style={styles.enRouteBanner}>
              <Text style={styles.enRouteText}>
                🚑 En route to {hosp.name}. Green corridor pre-emption active.
              </Text>
            </View>
          )}

          {isHospitalArrival && (
            <TouchableOpacity 
              onPress={completeMission}
              style={[styles.bigBtn, styles.btnGreen]}
            >
              <Text style={styles.bigBtnIcon}>🏥</Text>
              <Text style={styles.bigBtnText}>COMPLETE TRIAGE HANDOVER</Text>
            </TouchableOpacity>
          )}

          {missionStatus === 'MISSION_COMPLETED' && (
            <View style={styles.completedBanner}>
              <Text style={styles.completedTitle}>RESCUE MISSION COMPLETED</Text>
              <Text style={styles.completedSub}>Patient safely handed over to ER trauma team.</Text>
            </View>
          )}
        </View>

        {/* PATIENT TRIAGE & VITALS CARD */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>❤️</Text>
              <Text style={styles.cardTitle}>PATIENT PROFILE & TRIAGE</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setPatientModalOpen(true)}
                style={styles.changePickupPill}
              >
                <Text style={styles.changePickupPillText}>✏️ Set Pickup</Text>
              </TouchableOpacity>
              <View style={styles.codeRedBadge}>
                <Text style={styles.codeRedText}>CODE RED</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name / Age:</Text>
            <Text style={styles.infoValue}>{pt.name} ({pt.age}y, {pt.gender})</Text>
          </View>

          {/* Interactive Pickup Point with tap to customize */}
          <TouchableOpacity 
            onPress={() => setPatientModalOpen(true)}
            style={styles.pickupSelectRow}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Pickup Point (Tap to change):</Text>
              <Text style={[styles.infoValue, { color: '#00f2fe', fontWeight: 'bold' }]}>
                📍 {pt.location_name}
              </Text>
            </View>
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>EDIT ✏️</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Condition:</Text>
            <Text style={[styles.infoValue, { color: '#f87171' }]}>{pt.condition}</Text>
          </View>

          {/* Vitals Ribbon */}
          <View style={styles.vitalsRow}>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={[styles.vitalVal, { color: '#fb7185' }]}>
                {pt.vitals.heart_rate_bpm} <Text style={styles.vitalUnit}>bpm</Text>
              </Text>
            </View>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalLabel}>Blood Press.</Text>
              <Text style={[styles.vitalVal, { color: '#fbbf24' }]}>
                {pt.vitals.blood_pressure}
              </Text>
            </View>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalLabel}>SpO2</Text>
              <Text style={[styles.vitalVal, { color: '#38bdf8' }]}>
                {pt.vitals.spo2_percent}%
              </Text>
            </View>
          </View>
        </View>

        {/* DESTINATION HOSPITAL & DIVERT CARD */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardIcon}>🏥</Text>
              <Text style={styles.cardTitle}>DESTINATION HOSPITAL</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setHospitalModalOpen(true)}
                style={[styles.changePickupPill, { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}
              >
                <Text style={[styles.changePickupPillText, { color: '#34d399' }]}>+ Custom Hosp</Text>
              </TouchableOpacity>
              <View style={styles.hospBadge}>
                <Text style={styles.hospBadgeText}>{hosp.trauma_team_status}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.hospName}>{hosp.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trauma ER Beds:</Text>
            <Text style={[styles.infoValue, { color: '#34d399', fontWeight: 'bold' }]}>
              {hosp.emergency_beds_available} Available
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ICU Capacity:</Text>
            <Text style={[styles.infoValue, { color: '#38bdf8' }]}>
              {hosp.icu_beds_available} Critical Care
            </Text>
          </View>

          {/* Divert Facility Switcher */}
          <Text style={styles.divertTitle}>Divert Facility:</Text>
          <View style={styles.divertGrid}>
            <TouchableOpacity 
              onPress={() => changeHospital('HOSP-GANDHI')}
              style={[styles.divertBtn, hosp.id === 'HOSP-GANDHI' && styles.divertBtnActive]}
            >
              <Text style={[styles.divertBtnText, hosp.id === 'HOSP-GANDHI' && styles.divertBtnTextActive]}>
                Gandhi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => changeHospital('HOSP-YASHODA')}
              style={[styles.divertBtn, hosp.id === 'HOSP-YASHODA' && styles.divertBtnActive]}
            >
              <Text style={[styles.divertBtnText, hosp.id === 'HOSP-YASHODA' && styles.divertBtnTextActive]}>
                Yashoda
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => changeHospital('HOSP-KIMS')}
              style={[styles.divertBtn, hosp.id === 'HOSP-KIMS' && styles.divertBtnActive]}
            >
              <Text style={[styles.divertBtnText, hosp.id === 'HOSP-KIMS' && styles.divertBtnTextActive]}>
                KIMS
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FLOATING HANDS-FREE VOICE MIC BUTTON */}
      <TouchableOpacity
        onPress={() => setVoiceModalOpen(true)}
        style={[
          styles.floatingMicBtn,
          voiceState === 'SPEAKING' ? styles.micSpeaking :
          voiceState === 'ANALYZING' ? styles.micAnalyzing : styles.micDefault
        ]}
      >
        <Text style={styles.floatingMicIcon}>🎙️</Text>
        <Text style={styles.floatingMicLabel}>
          {voiceState === 'SPEAKING' ? 'AURA Speaking' :
           voiceState === 'ANALYZING' ? 'Analyzing...' : 'Driver Voice Assistant'}
        </Text>
      </TouchableOpacity>

      {/* VOICE MODAL */}
      <MobileVoiceModal />

      {/* CUSTOM PICKUP & HOSPITAL LOCATION MODAL */}
      <MobileLocationModal />

      {/* SERVER CONNECTION SETTINGS MODAL */}
      <Modal
        visible={settingsModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSettingsModalOpen(false)}
      >
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsBox}>
            <Text style={styles.settingsTitle}>AURA Backend Server Setup</Text>
            <Text style={styles.settingsDesc}>
              Enter your laptop/host machine's IP address and port (e.g. 192.168.1.100:8000 for Wi-Fi or 10.0.2.2:8000 for Android emulator):
            </Text>

            <TextInput
              style={styles.settingsInput}
              value={tempHost}
              onChangeText={setTempHost}
              placeholder="192.168.1.X:8000"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.settingsActions}>
              <TouchableOpacity 
                onPress={() => setSettingsModalOpen(false)}
                style={[styles.settingsBtn, styles.settingsCancel]}
              >
                <Text style={styles.settingsCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSaveSettings}
                style={[styles.settingsBtn, styles.settingsSave]}
              >
                <Text style={styles.settingsSaveText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d14'
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0a0d14'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  logoBadge: {
    color: '#00f2fe',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1
  },
  callSign: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5
  },
  connOnline: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', borderWidth: 1 },
  connOffline: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444', borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotGreen: { backgroundColor: '#10b981' },
  dotRed: { backgroundColor: '#ef4444' },
  connText: { color: '#f8fafc', fontSize: 10, fontWeight: 'bold' },
  settingsIconBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b'
  },
  settingsIconText: { fontSize: 14 },
  scrollArea: { flex: 1 },
  scrollContent: { padding: 12, gap: 12 },
  ribbonCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  ribbonItem: { alignItems: 'center' },
  ribbonLabel: { color: '#64748b', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  ribbonValue: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginTop: 2 },
  ribbonUnit: { fontSize: 10, color: '#94a3b8', fontWeight: 'normal' },
  ribbonDivider: { width: 1, height: 28, backgroundColor: '#1e293b' },
  mapCard: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    position: 'relative'
  },
  floatingMapHud: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6
  },
  mapHudPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  mapHudText: { color: '#e2e8f0', fontSize: 10, fontWeight: 'bold' },
  actionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardIcon: { fontSize: 14 },
  cardTitle: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.8 },
  statusPill: {
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: 'bold'
  },
  bigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  btnRed: { backgroundColor: '#dc2626' },
  btnCyan: { backgroundColor: '#0284c7' },
  btnGreen: { backgroundColor: '#059669' },
  bigBtnIcon: { fontSize: 18 },
  bigBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold', letterSpacing: 0.5 },
  enRouteBanner: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12
  },
  enRouteText: { color: '#6ee7b7', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  completedBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center'
  },
  completedTitle: { color: '#10b981', fontSize: 12, fontWeight: 'bold' },
  completedSub: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  infoCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 8
  },
  codeRedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  codeRedText: { color: '#f87171', fontSize: 9, fontWeight: '900' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  infoLabel: { color: '#64748b', fontSize: 12 },
  infoValue: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  vitalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10
  },
  vitalBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center'
  },
  vitalLabel: { color: '#94a3b8', fontSize: 9, marginBottom: 2 },
  vitalVal: { fontSize: 14, fontWeight: '900' },
  vitalUnit: { fontSize: 9, color: '#94a3b8', fontWeight: 'normal' },
  hospBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  hospBadgeText: { color: '#34d399', fontSize: 9, fontWeight: 'bold' },
  hospName: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginVertical: 2 },
  divertTitle: { color: '#64748b', fontSize: 11, fontWeight: '600', marginTop: 4 },
  divertGrid: {
    flexDirection: 'row',
    gap: 8
  },
  divertBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center'
  },
  divertBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981'
  },
  divertBtnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  divertBtnTextActive: { color: '#fff' },
  floatingMicBtn: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8
  },
  micDefault: { backgroundColor: '#0284c7' },
  micAnalyzing: { backgroundColor: '#d97706' },
  micSpeaking: { backgroundColor: '#059669' },
  floatingMicIcon: { fontSize: 18 },
  floatingMicLabel: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  settingsBox: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155'
  },
  settingsTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  settingsDesc: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginBottom: 14 },
  settingsInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginBottom: 16
  },
  settingsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  settingsBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10
  },
  settingsCancel: { backgroundColor: '#334155' },
  settingsCancelText: { color: '#cbd5e1', fontWeight: 'bold', fontSize: 13 },
  settingsSave: { backgroundColor: '#06b6d4' },
  settingsSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  changePickupPill: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: '#06b6d4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  changePickupPillText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: 'bold'
  },
  pickupSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 4
  },
  editBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  editBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: 'bold'
  }
});
