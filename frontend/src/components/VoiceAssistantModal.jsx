import React, { useState, useEffect, useRef } from 'react';
import { useAura } from '../context/AuraContext';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  X, 
  Activity, 
  MessageSquare, 
  Cpu, 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Square,
  ChevronDown,
  ChevronUp,
  Radio
} from 'lucide-react';

export default function VoiceAssistantModal() {
  const { 
    voiceAssistantOpen, 
    setVoiceAssistantOpen, 
    sendVoiceQuery, 
    voiceHistory, 
    telemetry,
    voiceState,
    voiceDebug,
    speechService,
    startVoiceListening,
    stopVoiceListening,
    replayLastVoice
  } = useAura();

  const [inputText, setInputText] = useState('');
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [activeCategoryTab, setActiveCategoryTab] = useState('ALL');
  const chatScrollRef = useRef(null);

  // Auto-scroll chat on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [voiceHistory, voiceState]);

  if (!voiceAssistantOpen) return null;

  const isListening = voiceState === 'LISTENING';
  const isAnalyzing = voiceState === 'ANALYZING';
  const isSpeaking = voiceState === 'SPEAKING';

  const handleToggleListening = () => {
    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  };

  const handleSend = async (queryToSubmit) => {
    const query = queryToSubmit || inputText;
    if (!query || !query.trim()) return;
    setInputText('');
    await sendVoiceQuery(query);
  };

  const handleStopAudio = () => {
    speechService.stopSpeaking();
  };

  // Comprehensive test question prompts organized by categories
  const categories = [
    { id: 'ALL', label: '⭐ Top Prompts' },
    { id: 'NAV', label: '⏱️ ETA & Route' },
    { id: 'REASON', label: '🧠 Explainability' },
    { id: 'TRAFFIC', label: '🚦 Traffic & Signals' },
    { id: 'HOSPITAL', label: '🏥 Hospital & Beds' },
    { id: 'PATIENT', label: '❤️ Patient & Vitals' },
    { id: 'SAFETY', label: '🚗 Connected Vehicles' },
    { id: 'FOLLOWUP', label: '🔄 Contextual Follow-ups' }
  ];

  const quickQuestions = [
    // Top prompts
    { label: "What is our current ETA?", cat: 'NAV', sub: 'ALL' },
    { label: "Why did you choose this route?", cat: 'REASON', sub: 'ALL' },
    { label: "Is Gandhi Hospital ready?", cat: 'HOSPITAL', sub: 'ALL' },
    { label: "Where is the nearest congestion?", cat: 'TRAFFIC', sub: 'ALL' },
    { label: "How many vehicles are nearby?", cat: 'SAFETY', sub: 'ALL' },
    { label: "What are the patient vitals?", cat: 'PATIENT', sub: 'ALL' },

    // ETA & Navigation
    { label: "How much distance is left?", cat: 'NAV' },
    { label: "What is our vehicle speed?", cat: 'NAV' },
    { label: "What is the next waypoint?", cat: 'NAV' },
    { label: "Which route is the fastest?", cat: 'NAV' },
    { label: "Which route is better?", cat: 'NAV' },
    { label: "Reroute to avoid traffic", cat: 'NAV' },

    // Explainability & Decisions
    { label: "Why did you avoid NGRI?", cat: 'REASON' },
    { label: "Why did you change the route?", cat: 'REASON' },
    { label: "Explain why we are taking Nacharam bypass", cat: 'REASON' },
    { label: "What makes this route faster?", cat: 'REASON' },
    { label: "Why did you select this hospital?", cat: 'REASON' },
    { label: "Why are we going to Gandhi Hospital?", cat: 'REASON' },

    // Traffic & Signals
    { label: "How bad is traffic at Uppal X Roads?", cat: 'TRAFFIC' },
    { label: "Is the green corridor active?", cat: 'TRAFFIC' },
    { label: "Are traffic signals cleared ahead?", cat: 'TRAFFIC' },
    { label: "Override traffic light at Uppal", cat: 'TRAFFIC' },
    { label: "What is the status of Habsiguda junction?", cat: 'TRAFFIC' },
    { label: "Clear the intersection ahead", cat: 'TRAFFIC' },

    // Hospital & Divert
    { label: "How many trauma beds are available?", cat: 'HOSPITAL' },
    { label: "Is the ICU team prepared?", cat: 'HOSPITAL' },
    { label: "Divert to Yashoda Hospital", cat: 'HOSPITAL' },
    { label: "Switch destination to KIMS Hospital", cat: 'HOSPITAL' },
    { label: "Check hospital capacity", cat: 'HOSPITAL' },

    // Patient & Emergency
    { label: "What is the patient status?", cat: 'PATIENT' },
    { label: "Is the patient condition critical?", cat: 'PATIENT' },
    { label: "Confirm patient pickup", cat: 'PATIENT' },
    { label: "Activate emergency mission", cat: 'PATIENT' },
    { label: "Complete mission handover", cat: 'PATIENT' },

    // Safety & Connected Vehicles
    { label: "Are road users clearing the lane?", cat: 'SAFETY' },
    { label: "Warn nearby connected vehicles", cat: 'SAFETY' },
    { label: "Broadcast siren alert to road users", cat: 'SAFETY' },
    { label: "How many vehicles received the alert?", cat: 'SAFETY' },

    // Contextual Follow-ups
    { label: "What about the patient?", cat: 'FOLLOWUP' },
    { label: "Can we avoid it?", cat: 'FOLLOWUP' },
    { label: "Why did you choose that?", cat: 'FOLLOWUP' },
    { label: "How long will that take?", cat: 'FOLLOWUP' },
    { label: "Is it ready?", cat: 'FOLLOWUP' }
  ];

  const filteredQuestions = activeCategoryTab === 'ALL'
    ? quickQuestions.filter(q => q.sub === 'ALL')
    : quickQuestions.filter(q => q.cat === activeCategoryTab);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white border-2 border-red-500 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-red-50/70 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-wide">
                  AURA Conversational Voice Assistant
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 font-bold">
                  18 INTENTS &bull; 100+ PHRASES
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Hands-Free Driver Voice Interface &bull; Real Telemetry Binding &bull; Natural Dialog
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border transition cursor-pointer ${
                showDebugPanel 
                  ? 'bg-red-100 text-red-800 border-red-300' 
                  : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900'
              }`}
              title="Toggle Voice Diagnostics & Live Data Panel"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Debug Panel</span>
              {showDebugPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button 
              onClick={() => setVoiceAssistantOpen(false)}
              className="p-1.5 rounded-lg hover:bg-red-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              title="Close Voice Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-STAGE VOICE STATE STATUS BAR */}
        <div className={`px-5 py-2.5 border-b transition-colors flex items-center justify-between text-xs font-medium ${
          isListening 
            ? 'bg-red-100 border-red-300 text-red-800' 
            : isAnalyzing 
            ? 'bg-amber-100 border-amber-300 text-amber-800' 
            : isSpeaking 
            ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
            : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-3">
            {isListening && (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-red-700 font-mono flex items-center gap-1.5">
                  🎙️ LISTENING TO DRIVER...
                </span>
                <span className="text-xs text-red-600 hidden sm:inline">
                  Speak clearly into your microphone
                </span>
              </>
            )}

            {isAnalyzing && (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-spin inline-flex h-3 w-3 rounded-full border-2 border-amber-500 border-t-transparent"></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-amber-800 font-mono flex items-center gap-1.5">
                  🧠 ANALYZING INTENT & TELEMETRY...
                </span>
                <span className="text-xs text-amber-700 hidden sm:inline">
                  Classifier evaluating mission context
                </span>
              </>
            )}

            {isSpeaking && (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-emerald-800 font-mono flex items-center gap-1.5">
                  🔊 AURA SPEAKING...
                </span>
                <span className="text-xs text-emerald-700 hidden sm:inline truncate max-w-md">
                  Audio streaming through device speakers
                </span>
              </>
            )}

            {!isListening && !isAnalyzing && !isSpeaking && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-sm shadow-red-600"></span>
                <span className="font-semibold text-slate-800">
                  AURA Voice AI is Ready
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline">
                  Click the Mic button to talk, or select any question prompt below
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isSpeaking && (
              <button
                onClick={handleStopAudio}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 text-xs transition cursor-pointer"
                title="Stop current speech synthesis"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop Audio</span>
              </button>
            )}

            <button
              onClick={() => replayLastVoice()}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs transition cursor-pointer shadow-sm"
              title="Replay the last spoken response through the speakers"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Tap to Replay Audio</span>
            </button>
          </div>
        </div>

        {/* Main Content Area: Chat Messages & Debug Panel */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[340px]">
          
          {/* Conversation Feed */}
          <div 
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60"
          >
            {voiceHistory.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white mx-auto flex items-center justify-center text-red-600 border border-red-200 shadow-sm">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-slate-800 text-sm font-semibold">Ready for Driver Voice Interaction</h3>
                  <p className="text-slate-500 text-xs max-w-md mx-auto mt-1">
                    Ask natural questions about ETA, traffic congestion, hospital ICU beds, green corridors, or patient condition.
                  </p>
                </div>
              </div>
            ) : (
              voiceHistory.map((item, idx) => (
                <div key={idx} className="space-y-2 text-xs">
                  {/* Driver User Bubble */}
                  <div className="flex justify-end">
                    <div className="bg-red-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] shadow-md">
                      <div className="text-[10px] text-red-200 font-mono mb-0.5 font-bold">DRIVER VOICE QUERY</div>
                      <p className="font-semibold text-sm text-white">{item.query}</p>
                    </div>
                  </div>

                  {/* AURA Agent Response */}
                  <div className="flex justify-start items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 flex-shrink-0 shadow-sm">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] space-y-2 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold">
                            {item.category} &bull; {item.intent}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Confidence: {Math.round((item.confidence || 0.95) * 100)}%
                          </span>
                        </div>
                        <button
                          onClick={() => speechService.speak(item.response_text)}
                          className="flex items-center gap-1 text-[11px] text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition cursor-pointer"
                          title="Re-speak this answer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Hear Voice</span>
                        </button>
                      </div>

                      <p className="text-[13px] leading-relaxed text-slate-900 font-medium">
                        {item.response_text}
                      </p>

                      {/* Extracted Structured Data Badges */}
                      {item.data && Object.keys(item.data).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.data.speed_kmh !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono font-bold">
                              Speed: {item.data.speed_kmh} km/h
                            </span>
                          )}
                          {item.data.eta_minutes !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono font-bold">
                              ETA: {item.data.eta_minutes} min
                            </span>
                          )}
                          {item.data.distance_km !== undefined && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono">
                              Dist: {item.data.distance_km} km
                            </span>
                          )}
                          {item.data.hospital_name && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                              ER: {item.data.hospital_name}
                            </span>
                          )}
                          {item.data.junction_name && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-mono">
                              Junction: {item.data.junction_name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Dedicated Voice Debug & Telemetry Panel (Collapsible) */}
          {showDebugPanel && (
            <div className="w-full md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-3.5 flex flex-col justify-between overflow-y-auto max-h-[280px] md:max-h-full shadow-inner">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                    <Terminal className="w-3.5 h-3.5 text-red-600" />
                    VOICE DIAGNOSTICS
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                    LIVE
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Mic Status */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Microphone:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      voiceDebug.micStatus === 'LISTENING'
                        ? 'bg-red-100 text-red-700 animate-pulse'
                        : voiceDebug.micStatus === 'READY'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {voiceDebug.micStatus}
                    </span>
                  </div>

                  {/* Speech Recognition */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">Speech Recog:</span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {voiceDebug.sttStatus} (en-IN)
                    </span>
                  </div>

                  {/* TTS Engine */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-slate-500">TTS Audio Engine:</span>
                    <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                      voiceDebug.ttsStatus === 'PLAYING' 
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse' 
                        : 'text-slate-700'
                    }`}>
                      {voiceDebug.ttsStatus}
                    </span>
                  </div>

                  {/* Captured Transcript */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500">Captured Transcript:</div>
                    <div className="text-slate-900 text-[11px] break-words font-sans">
                      {voiceDebug.transcript || <span className="text-slate-400 italic">None yet</span>}
                    </div>
                  </div>

                  {/* Detected Intent & Confidence */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500">Detected Intent:</div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-red-700 font-bold">{voiceDebug.detectedIntent || 'None'}</span>
                      <span className="text-slate-500 font-semibold">{Math.round((voiceDebug.confidence || 0) * 100)}%</span>
                    </div>
                  </div>

                  {/* AURA Live Telemetry Payload */}
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Live Simulation Telemetry:</span>
                      <span className="text-[9px] text-red-600 font-bold">sim_engine</span>
                    </div>
                    <pre className="text-[10px] text-slate-700 bg-white border border-slate-200 p-1.5 rounded overflow-x-auto max-h-24 leading-tight">
                      {JSON.stringify(voiceDebug.auraData || {}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Speaker Test Button */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => speechService.speak("AURA speech synthesis test. Audio speaker is fully operational.")}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Test Speaker Sound</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 18-Category Question Selector Tabs */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTab(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap text-xs transition cursor-pointer ${
                  activeCategoryTab === cat.id 
                    ? 'bg-red-600 text-white font-bold shadow' 
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Category Question Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
            {filteredQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q.label)}
                className="text-xs bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-slate-800 px-2.5 py-1 rounded-full transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
              >
                <span>💬</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar & Hands-Free Mic Button */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-2.5">
          <button
            onClick={handleToggleListening}
            className={`p-3.5 rounded-2xl transition flex items-center justify-center shadow-lg active:scale-95 cursor-pointer ${
              isListening 
                ? 'bg-red-600 text-white animate-pulse shadow-red-600/50 scale-105' 
                : 'bg-gradient-to-tr from-red-600 to-rose-600 text-white hover:brightness-110 shadow-red-600/25'
            }`}
            title={isListening ? "Stop listening" : "Click to speak hands-free with AURA"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask AURA naturally (e.g. 'Why did you change the route?' or 'What is our ETA?')"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="p-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-bold rounded-xl transition shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
            title="Submit question"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}

