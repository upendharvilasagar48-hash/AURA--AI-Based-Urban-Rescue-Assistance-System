import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { useMobileAura } from '../context/MobileAuraContext';

export default function MobileLocationModal() {
  const {
    telemetry,
    pickupPresets,
    updatePatientLocation,
    patientModalOpen,
    setPatientModalOpen,
    hospitalModalOpen,
    setHospitalModalOpen,
    addCustomHospital,
    changeHospital
  } = useMobileAura();

  const pt = telemetry?.patient || {};
  const amb = telemetry?.ambulance || {};

  // Form states for Patient Pickup
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [locationName, setLocationName] = useState(pt.location_name || '');
  const [latitude, setLatitude] = useState(pt.lat ? String(pt.lat) : '17.4338');
  const [longitude, setLongitude] = useState(pt.lng ? String(pt.lng) : '78.5015');
  const [patientName, setPatientName] = useState(pt.name || 'Rajeshwar Rao');
  const [patientCondition, setPatientCondition] = useState(pt.condition || 'Severe acute chest pain');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Custom Hospital
  const [newHospName, setNewHospName] = useState('');
  const [newHospLat, setNewHospLat] = useState('17.4300');
  const [newHospLng, setNewHospLng] = useState('78.4800');
  const [newHospBeds, setNewHospBeds] = useState('25');
  const [newHospIcu, setNewHospIcu] = useState('8');

  useEffect(() => {
    if (patientModalOpen && pt.location_name) {
      setLocationName(pt.location_name);
      setLatitude(pt.lat ? String(pt.lat) : '17.4338');
      setLongitude(pt.lng ? String(pt.lng) : '78.5015');
      setPatientName(pt.name || 'Rajeshwar Rao');
      setPatientCondition(pt.condition || 'Severe acute chest pain');
    }
  }, [patientModalOpen, pt]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setLocationName(preset.name);
    setLatitude(String(preset.lat));
    setLongitude(String(preset.lng));
  };

  const handleUseAmbulanceGps = () => {
    if (amb.lat && amb.lng) {
      setSelectedPresetId('current_amb');
      setLocationName('Current Ambulance GPS Location');
      setLatitude(String(amb.lat.toFixed(6)));
      setLongitude(String(amb.lng.toFixed(6)));
    }
  };

  const handleConfirmPickup = async () => {
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numerical latitude and longitude.');
      } else {
        Alert.alert('Invalid Coordinates', 'Please enter valid numerical latitude and longitude.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePatientLocation({
        location_name: locationName.trim() || 'Custom Hyderabad Pickup',
        lat: latNum,
        lng: lngNum,
        patient_name: patientName.trim() || 'Emergency Patient',
        condition: patientCondition.trim() || 'Urgent Triage Required'
      });
      setPatientModalOpen(false);
    } catch (e) {
      console.warn('Failed to update patient location:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomHospital = async () => {
    const latNum = parseFloat(newHospLat);
    const lngNum = parseFloat(newHospLng);
    if (!newHospName.trim() || isNaN(latNum) || isNaN(lngNum)) {
      if (Platform.OS === 'web') {
        window.alert('Please provide hospital name and valid coordinates.');
      } else {
        Alert.alert('Validation Error', 'Please provide hospital name and valid coordinates.');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCustomHospital({
        name: newHospName.trim(),
        lat: latNum,
        lng: lngNum,
        total_beds: parseInt(newHospBeds) || 20,
        icu_available: parseInt(newHospIcu) || 5,
        trauma_level: 'LEVEL-1',
        specialties: ['Trauma', 'Cardiology', 'Emergency Care'],
        contact_phone: '+91-40-2000-0108'
      });

      if (res && res.hospital && res.hospital.id) {
        await changeHospital(res.hospital.id);
      }
      setHospitalModalOpen(false);
      setNewHospName('');
    } catch (e) {
      console.warn('Failed to add custom hospital:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. PATIENT PICKUP LOCATION MODAL */}
      <Modal
        visible={patientModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPatientModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.modalIcon}>📍</Text>
                <Text style={styles.modalTitle}>Set Patient Pickup Location</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPatientModalOpen(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.helperText}>
                Choose a Hyderabad landmark preset or enter custom GPS coordinates. The green corridor route and ETA will automatically recalculate.
              </Text>

              {/* Quick Action: Use Ambulance GPS */}
              <TouchableOpacity
                onPress={handleUseAmbulanceGps}
                style={styles.gpsShortcutBtn}
              >
                <Text style={styles.gpsShortcutIcon}>🚑</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.gpsShortcutTitle}>Use Current Ambulance Position</Text>
                  <Text style={styles.gpsShortcutSub}>
                    {amb.lat ? `${amb.lat.toFixed(4)}, ${amb.lng?.toFixed(4)}` : 'GPS Position'}
                  </Text>
                </View>
                <Text style={styles.gpsShortcutAction}>SELECT</Text>
              </TouchableOpacity>

              {/* Hyderabad Landmark Presets Grid */}
              <Text style={styles.sectionHeader}>HYDERABAD PICKUP PRESETS</Text>
              <View style={styles.presetGrid}>
                {(pickupPresets || []).map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      onPress={() => handleSelectPreset(preset)}
                      style={[styles.presetCard, isSelected && styles.presetCardActive]}
                    >
                      <Text style={[styles.presetName, isSelected && styles.presetNameActive]}>
                        {preset.name}
                      </Text>
                      <Text style={styles.presetDesc}>{preset.description}</Text>
                      <Text style={styles.presetCoords}>
                        {preset.lat.toFixed(4)}, {preset.lng.toFixed(4)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Manual Coordinate Form */}
              <Text style={styles.sectionHeader}>CUSTOM LOCATION DETAILS</Text>

              <Text style={styles.inputLabel}>Pickup Landmark / Address</Text>
              <TextInput
                style={styles.textInput}
                value={locationName}
                onChangeText={(val) => {
                  setLocationName(val);
                  setSelectedPresetId(null);
                }}
                placeholder="e.g. Secunderabad Railway Station"
                placeholderTextColor="#64748b"
              />

              <View style={styles.coordsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Latitude (°N)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={latitude}
                    onChangeText={(val) => {
                      setLatitude(val);
                      setSelectedPresetId(null);
                    }}
                    placeholder="17.4338"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Longitude (°E)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={longitude}
                    onChangeText={(val) => {
                      setLongitude(val);
                      setSelectedPresetId(null);
                    }}
                    placeholder="78.5015"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.textInput}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Patient Full Name"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.inputLabel}>Emergency Condition / Triage</Text>
              <TextInput
                style={styles.textInput}
                value={patientCondition}
                onChangeText={setPatientCondition}
                placeholder="Medical Condition"
                placeholderTextColor="#64748b"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => setPatientModalOpen(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmPickup}
                disabled={isSubmitting}
                style={[styles.confirmBtn, isSubmitting && { opacity: 0.6 }]}
              >
                <Text style={styles.confirmBtnText}>
                  {isSubmitting ? 'Routing...' : '⚡ Apply & Route Corridor'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. CUSTOM HOSPITAL MODAL */}
      <Modal
        visible={hospitalModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHospitalModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.headerTitleWrap}>
                <Text style={styles.modalIcon}>🏥</Text>
                <Text style={styles.modalTitle}>Add Custom Destination Hospital</Text>
              </View>
              <TouchableOpacity
                onPress={() => setHospitalModalOpen(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.helperText}>
                Register a new hospital or medical clinic in Hyderabad. A green corridor route will be generated to this location.
              </Text>

              <Text style={styles.inputLabel}>Hospital Name</Text>
              <TextInput
                style={styles.textInput}
                value={newHospName}
                onChangeText={setNewHospName}
                placeholder="e.g. Care Hospital Banjara Hills"
                placeholderTextColor="#64748b"
              />

              <View style={styles.coordsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Latitude (°N)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newHospLat}
                    onChangeText={setNewHospLat}
                    placeholder="17.4150"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Longitude (°E)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newHospLng}
                    onChangeText={setNewHospLng}
                    placeholder="78.4350"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.coordsRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ER Beds</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newHospBeds}
                    onChangeText={setNewHospBeds}
                    placeholder="25"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ICU Capacity</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newHospIcu}
                    onChangeText={setNewHospIcu}
                    placeholder="8"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.footerRow}>
              <TouchableOpacity
                onPress={() => setHospitalModalOpen(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddCustomHospital}
                disabled={isSubmitting}
                style={[styles.confirmBtn, { backgroundColor: '#059669' }, isSubmitting && { opacity: 0.6 }]}
              >
                <Text style={styles.confirmBtnText}>
                  {isSubmitting ? 'Registering...' : '🏥 Register & Route'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#0a0d14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '90%',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalIcon: {
    fontSize: 18
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold'
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b'
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 4
  },
  bodyScroll: {
    marginTop: 12
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14
  },
  gpsShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    borderWidth: 1,
    borderColor: '#06b6d4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10
  },
  gpsShortcutIcon: {
    fontSize: 22
  },
  gpsShortcutTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold'
  },
  gpsShortcutSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  gpsShortcutAction: {
    color: '#00f2fe',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  presetCardActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.18)',
    borderColor: '#06b6d4'
  },
  presetName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2
  },
  presetNameActive: {
    color: '#38bdf8'
  },
  presetDesc: {
    color: '#94a3b8',
    fontSize: 10,
    marginBottom: 4
  },
  presetCoords: {
    color: '#64748b',
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 4
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 10
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    marginTop: 8
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#1e293b'
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold'
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0284c7',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  }
});
