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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("AURA Error Boundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-red-500/40 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              🚑
            </div>
            <h1 className="text-xl font-bold text-red-400">AURA Emergency Diagnostics</h1>
            <p className="text-sm text-slate-300">
              The application caught a display issue and recovered safely.
            </p>
            <p className="text-xs font-mono bg-slate-950 p-3 rounded-lg text-red-300 overflow-x-auto text-left">
              {this.state.error?.message || String(this.state.error)}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              Restart Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuraProvider>
        <MainLayout />
      </AuraProvider>
    </ErrorBoundary>
  );
}
