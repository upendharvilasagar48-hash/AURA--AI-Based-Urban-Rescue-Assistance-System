import React, { useState, useEffect } from 'react';
import { useAura } from '../context/AuraContext';
import { 
  MapPin, 
  Building2, 
  X, 
  Check, 
  Navigation2, 
  Plus, 
  Hospital, 
  AlertCircle,
  Radio,
  Flame
} from 'lucide-react';

export default function LocationCustomizerModal() {
  const {
    telemetry,
    pickupPresets,
    pickupModalOpen,
    setPickupModalOpen,
    hospitalModalOpen,
    setHospitalModalOpen,
    updatePatientLocation,
    addCustomHospital,
    changeHospital,
    hospitals
  } = useAura();

  const pt = telemetry?.patient || {};
  const amb = telemetry?.ambulance || {};
  const currentHosp = telemetry?.hospital || {};

  // Form states for Patient Pickup
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [locationName, setLocationName] = useState(pt.location_name || '');
  const [latitude, setLatitude] = useState(pt.lat ? String(pt.lat) : '17.4338');
  const [longitude, setLongitude] = useState(pt.lng ? String(pt.lng) : '78.5015');
  const [patientName, setPatientName] = useState(pt.name || 'Rajeshwar Rao');
  const [patientCondition, setPatientCondition] = useState(pt.condition || 'Severe acute chest pain');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Form states for Custom Hospital
  const [newHospName, setNewHospName] = useState('');
  const [newHospLocality, setNewHospLocality] = useState('Central Hyderabad');
  const [newHospLat, setNewHospLat] = useState('17.4300');
  const [newHospLng, setNewHospLng] = useState('78.4800');
  const [newHospBeds, setNewHospBeds] = useState('25');
  const [newHospIcu, setNewHospIcu] = useState('8');
  const [newHospType, setNewHospType] = useState('Level-1 Trauma Center');

  useEffect(() => {
    if (pickupModalOpen && pt.location_name) {
      setLocationName(pt.location_name);
      setLatitude(pt.lat ? String(pt.lat) : '17.4338');
      setLongitude(pt.lng ? String(pt.lng) : '78.5015');
      setPatientName(pt.name || 'Rajeshwar Rao');
      setPatientCondition(pt.condition || 'Severe acute chest pain');
    }
  }, [pickupModalOpen, pt]);

  const handleSelectPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setLocationName(preset.name);
    setLatitude(String(preset.lat));
    setLongitude(String(preset.lng));
  };

  const handleUseAmbulanceGps = () => {
    if (amb.lat && amb.lng) {
      setSelectedPresetId('current_amb');
      setLocationName('Current Ambulance Position (En-Route Spot)');
      setLatitude(String(amb.lat.toFixed(6)));
      setLongitude(String(amb.lng.toFixed(6)));
    }
  };

  const handleConfirmPickup = async (e) => {
    if (e) e.preventDefault();
    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      alert('Please enter valid numerical latitude and longitude.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePatientLocation({
        location_name: locationName.trim() || 'Custom Hyderabad Pickup',
        lat: latNum,
        lng: lngNum,
        patient_name: patientName.trim() || 'Emergency Patient',
        condition: patientCondition.trim() || 'Urgent Triage Required'
      });

      setSuccessToast(`✓ Pickup set to "${locationName}"! Green corridor route recalculated.`);
      setTimeout(() => {
        setSuccessToast('');
        setPickupModalOpen(false);
      }, 1400);
    } catch (err) {
      console.error('Failed to update patient location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCustomHospital = async (e) => {
    if (e) e.preventDefault();
    const latNum = parseFloat(newHospLat);
    const lngNum = parseFloat(newHospLng);
    if (!newHospName.trim() || isNaN(latNum) || isNaN(lngNum)) {
      alert('Please provide hospital name and valid coordinates.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addCustomHospital({
        name: newHospName.trim(),
        locality: newHospLocality.trim(),
        lat: latNum,
        lng: lngNum,
        type: newHospType,
        total_beds: parseInt(newHospBeds) || 25,
        emergency_beds_available: parseInt(newHospBeds) || 25,
        icu_available: parseInt(newHospIcu) || 8,
        icu_beds_available: parseInt(newHospIcu) || 8,
        trauma_level: 'LEVEL-1',
        trauma_team_status: 'READY',
        specialties: ['Trauma Care', 'Cardiology', 'Emergency Surgery']
      });

      if (res && res.hospital && res.hospital.id) {
        await changeHospital(res.hospital.id);
      }
      setSuccessToast(`✓ Registered and routed corridor to "${newHospName}"!`);
      setTimeout(() => {
        setSuccessToast('');
        setHospitalModalOpen(false);
        setNewHospName('');
      }, 1400);
    } catch (err) {
      console.error('Failed to add custom hospital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. PATIENT PICKUP LOCATION CUSTOMIZER MODAL */}
      {pickupModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-red-500 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-500/20 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-red-100 flex items-center justify-between bg-red-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    Set Patient Pickup Location
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Live Reroute
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    The driver can choose any Hyderabad landmark or custom coordinates. Green corridor route will instantly recalculate.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPickupModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Success Notification */}
              {successToast && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* Quick Action: Use Current Ambulance Position */}
              <button
                type="button"
                onClick={handleUseAmbulanceGps}
                className="w-full p-3 rounded-xl bg-red-50 hover:bg-red-100/70 border border-red-200 hover:border-red-300 flex items-center justify-between text-left transition group shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚑</span>
                  <div>
                    <div className="text-xs font-bold text-red-700 group-hover:text-red-800 flex items-center gap-1.5">
                      Use Current Ambulance Position
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-200/70 text-red-800 border border-red-300">
                        GPS Instant
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      {amb.lat ? `${amb.lat.toFixed(5)}°N, ${amb.lng?.toFixed(5)}°E (${amb.speed_kmh || 0} km/h)` : 'Live Vehicle Coordinates'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-600 group-hover:translate-x-0.5 transition">
                  Select &rarr;
                </span>
              </button>

              {/* Hyderabad Landmark Presets Grid */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                  <span>1-Tap Hyderabad Landmark Presets</span>
                  <span className="text-[10px] text-slate-500 font-normal">8 Key Hubs</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(pickupPresets || []).map((preset) => {
                    const isSelected = selectedPresetId === preset.id || locationName === preset.name;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-600 text-slate-900 shadow-md shadow-red-500/10'
                            : 'bg-slate-50 hover:bg-red-50/40 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold truncate">{preset.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{preset.landmark || preset.locality || preset.description}</div>
                        </div>
                        <div className="text-[9px] font-mono text-red-600 font-bold mt-1">
                          {preset.lat.toFixed(3)}, {preset.lng.toFixed(3)}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Coordinate Form */}
              <form onSubmit={handleConfirmPickup} className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Pickup Spot Landmark / Address:
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => {
                      setLocationName(e.target.value);
                      setSelectedPresetId(null);
                    }}
                    placeholder="e.g. Secunderabad Railway Station Platform 10"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1">
                      Latitude (°N):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => {
                        setLatitude(e.target.value);
                        setSelectedPresetId(null);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1">
                      Longitude (°E):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => {
                        setLongitude(e.target.value);
                        setSelectedPresetId(null);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Patient Name:</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Condition / Triage:</label>
                    <input
                      type="text"
                      value={patientCondition}
                      onChange={(e) => setPatientCondition(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-red-600 font-medium text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Navigation2 className="w-3.5 h-3.5 fill-current" />
                    <span>{isSubmitting ? 'Routing...' : '⚡ Apply & Recalculate Route'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOM DESTINATION HOSPITAL MODAL */}
      {hospitalModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border-2 border-red-500 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-red-500/20 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-red-100 flex items-center justify-between bg-red-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    Select or Add Destination Hospital
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                      Emergency Divert
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Switch destination hospital or register a new emergency facility in Hyderabad.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHospitalModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Success Notification */}
              {successToast && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* Available Hospitals List */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
                  Available Hyderabad Hospitals
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(hospitals || []).map((h) => {
                    const isSelected = currentHosp.id === h.id;
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={async () => {
                          await changeHospital(h.id);
                          setSuccessToast(`✓ Route diverted to ${h.name}`);
                          setTimeout(() => {
                            setSuccessToast('');
                            setHospitalModalOpen(false);
                          }, 1200);
                        }}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-600 text-slate-900 shadow-md shadow-red-500/10'
                            : 'bg-slate-50 hover:bg-red-50/40 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{h.name}</div>
                          <div className="text-[10px] text-slate-500">{h.locality} &bull; {h.type}</div>
                          <div className="text-[10px] text-red-600 font-semibold mt-1">
                            ER Beds: {h.emergency_beds_available} &bull; ICU: {h.icu_beds_available}
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="text-[11px] text-red-600 hover:text-red-700 font-bold">
                            Select &rarr;
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Register New Custom Hospital Form */}
              <form onSubmit={handleAddCustomHospital} className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Register New Emergency Facility
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hospital Name:
                  </label>
                  <input
                    type="text"
                    value={newHospName}
                    onChange={(e) => setNewHospName(e.target.value)}
                    placeholder="e.g. Apollo Jubilee Hills / NIMS Punjagutta"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1">
                      Latitude (°N):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newHospLat}
                      onChange={(e) => setNewHospLat(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-600 mb-1">
                      Longitude (°E):
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newHospLng}
                      onChange={(e) => setNewHospLng(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">Locality:</label>
                    <input
                      type="text"
                      value={newHospLocality}
                      onChange={(e) => setNewHospLocality(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">ER Beds:</label>
                    <input
                      type="number"
                      value={newHospBeds}
                      onChange={(e) => setNewHospBeds(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-red-600 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 mb-1">ICU Capacity:</label>
                    <input
                      type="number"
                      value={newHospIcu}
                      onChange={(e) => setNewHospIcu(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-red-600 font-mono text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setHospitalModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Hospital className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Registering...' : '🏥 Register & Divert Route'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
