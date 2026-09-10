import React from 'react';
import { AuraProvider, useAura } from './context/AuraContext';
import Navbar from './components/Navbar';
import AmbulanceCockpit from './components/AmbulanceCockpit';
import TrafficPoliceConsole from './components/TrafficPoliceConsole';
import ConnectedVehicleHUD from './components/ConnectedVehicleHUD';
import ControlCenter from './components/ControlCenter';
import VoiceAssistantModal from './components/VoiceAssistantModal';
import LocationCustomizerModal from './components/LocationCustomizerModal';

function MainLayout() {
  const { activeTab } = useAura();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar />

      <main className="flex-1 pb-10 px-3 sm:px-6 pt-4">
        {activeTab === 'ambulance' && <AmbulanceCockpit />}
        {activeTab === 'traffic' && <TrafficPoliceConsole />}
        {activeTab === 'vehicle' && <ConnectedVehicleHUD />}
        {activeTab === 'control' && <ControlCenter />}
      </main>

      <VoiceAssistantModal />
      <LocationCustomizerModal />

      {/* Professional Emergency Medical White & Red Footer */}
      <footer className="border-t border-red-200 bg-white py-4 px-6 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="font-bold text-red-600">AURA Architecture:</span>
          <span className="text-slate-600">FastAPI Multi-Agent Orchestrator &bull; WebSockets &bull; Leaflet &bull; Web Speech &bull; Web Audio API</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Demonstration Corridor: <b className="text-red-700 font-mono">Boduppal &rarr; Uppal &rarr; Habsiguda &rarr; Secunderabad</b></span>
          <span className="text-red-600 font-mono font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded">HYD-ALS-01</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuraProvider>
      <MainLayout />
    </AuraProvider>
  );
}
