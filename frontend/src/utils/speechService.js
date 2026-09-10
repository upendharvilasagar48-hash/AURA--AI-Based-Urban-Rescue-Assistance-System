/**
 * AURA Advanced Speech & Audio Service
 * Provides reliable, hands-free Speech-To-Text (STT) and Text-To-Speech (TTS)
 * with Chromium GC-bug workarounds, Chrome resume-heartbeat, voice preloading,
 * AudioContext unlocking, audio priority queuing, and Web Audio fallback chimes.
 */

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this.isSpeaking = false;
    this.isListening = false;
    this.recognition = null;
    this.heartbeatTimer = null;
    this.audioCtx = null;
    this.activeRequestId = null;
    
    // UI state callbacks
    this.stateListeners = new Set();
    this.debugListeners = new Set();

    // Diagnostics state
    this.debugState = {
      requestId: '',               // Unique per-interaction request ID to prevent race conditions
      micStatus: 'READY',          // READY, LISTENING, ERROR, PERMISSION_DENIED
      sttStatus: 'CONNECTED',      // CONNECTED, ERROR, NOT_SUPPORTED
      transcript: '',
      detectedIntent: 'None',
      confidence: 0,
      auraData: {},
      ttsStatus: 'IDLE',           // IDLE, PLAYING, ERROR, FALLBACK
      lastSpokenText: '',
      errorMessage: ''
    };

    this.initVoices();
    this.initRecognition();
  }

  // -------------------------------------------------------------------------
  // Web Audio Context & Speaker Sound Verification
  // -------------------------------------------------------------------------
  initAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playAcknowledgmentChime() {
    try {
      this.initAudioContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {
      console.warn("Chime playback notice:", e);
    }
  }

  // -------------------------------------------------------------------------
  // Voice Loading & Preloading
  // -------------------------------------------------------------------------
  initVoices() {
    if (!this.synth) return;

    const loadVoices = () => {
      this.voices = this.synth.getVoices();
      if (this.voices.length > 0) {
        // Preferred order: Indian English -> Natural English -> UK/US English -> Any English
        this.selectedVoice = 
          this.voices.find(v => v.lang === 'en-IN') ||
          this.voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')) ||
          this.voices.find(v => v.lang === 'en-GB' || v.lang === 'en-US') ||
          this.voices.find(v => v.lang.startsWith('en')) ||
          this.voices[0];
      }
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  // -------------------------------------------------------------------------
  // Speech Recognition (STT)
  // -------------------------------------------------------------------------
  initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.updateDebug({ sttStatus: 'NOT_SUPPORTED', errorMessage: 'Speech Recognition API not supported on this browser.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening = true;
      this.updateDebug({ micStatus: 'LISTENING', ttsStatus: 'IDLE' });
      this.emitState('LISTENING');
    };

    recognition.onend = () => {
      this.isListening = false;
      if (this.debugState.micStatus === 'LISTENING') {
        this.updateDebug({ micStatus: 'READY' });
        this.emitState('READY');
      }
    };

    recognition.onerror = (event) => {
      this.isListening = false;
      let err = event.error || 'Unknown voice error';
      let micState = 'ERROR';

      if (event.error === 'not-allowed') {
        err = 'Microphone permission denied. Please allow microphone access.';
        micState = 'PERMISSION_DENIED';
      } else if (event.error === 'no-speech') {
        err = 'No speech detected. Please speak again.';
        micState = 'READY';
      }

      this.updateDebug({ micStatus: micState, errorMessage: err });
      this.emitState(micState === 'READY' ? 'READY' : 'ERROR');
    };

    this.recognition = recognition;
  }

  startListening(onResultCallback) {
    if (!this.recognition) {
      this.initRecognition();
      if (!this.recognition) {
        this.updateDebug({ sttStatus: 'NOT_SUPPORTED' });
        return;
      }
    }

    // Generate unique request ID for this new interaction
    const requestId = 'req-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    this.activeRequestId = requestId;

    // Reset previous response and conversation state to prevent repeating old answers
    this.stopSpeaking();
    this.updateDebug({
      requestId: requestId,
      transcript: '',
      detectedIntent: 'None',
      confidence: 0,
      auraData: {},
      lastSpokenText: '',
      ttsStatus: 'IDLE'
    });
    this.playAcknowledgmentChime();

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const activeText = finalTranscript || interimTranscript;
      this.updateDebug({ transcript: activeText });

      if (finalTranscript && onResultCallback) {
        this.emitState('ANALYZING');
        onResultCallback(finalTranscript.trim(), requestId);
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      // If already started, restart
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 150);
      } catch (err) {
        console.warn("Recognition restart notice:", err);
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
  }

  // -------------------------------------------------------------------------
  // Text-To-Speech (TTS) with Chromium GC Bug & Chrome Resume Fix
  // -------------------------------------------------------------------------
  speak(text, options = {}) {
    if (!this.synth || typeof window === 'undefined') {
      this.updateDebug({ ttsStatus: 'ERROR', errorMessage: 'Speech synthesis not available' });
      return false;
    }

    if (!text || !text.trim()) return false;

    // Reject stale speech from an older question if a new query has since been initiated
    if (options.requestId && this.activeRequestId && options.requestId !== this.activeRequestId) {
      console.warn(`[SpeechService] Ignored stale speech from older request ${options.requestId}`);
      return false;
    }

    // Stop any existing speech and clear heartbeats
    this.stopSpeaking();
    this.initAudioContext();

    if (this.voices.length === 0) {
      this.initVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.rate = options.rate || 1.05;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    // CRITICAL CHROMIUM BUG FIX:
    // Store reference in window._auraSpeechUtterance to prevent garbage collection mid-speech!
    window._auraSpeechUtterance = utterance;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.updateDebug({ ttsStatus: 'PLAYING', lastSpokenText: text });
      this.emitState('SPEAKING');

      // CRITICAL CHROME PAUSE BUG FIX:
      // In Chrome, background synthesizers stall after 15 seconds unless periodically resumed
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (this.synth.speaking && !this.synth.paused) {
          this.synth.resume();
        }
      }, 2500);
    };

    utterance.onend = () => {
      this.cleanupSpeech();
      this.updateDebug({ ttsStatus: 'IDLE' });
      this.emitState('READY');
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.warn("TTS Error encountered:", event);
      this.cleanupSpeech();
      this.updateDebug({ ttsStatus: 'ERROR', errorMessage: event.error || 'TTS playback error' });
      this.emitState('READY');
      if (options.onError) options.onError(event);
    };

    // Speak with small timeout to allow cancel() cleanup to flush on Chromium
    setTimeout(() => {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        this.synth.speak(utterance);
      } catch (e) {
        console.error("speechSynthesis.speak error:", e);
        this.cleanupSpeech();
        this.updateDebug({ ttsStatus: 'ERROR', errorMessage: e.message });
      }
    }, 50);

    return true;
  }

  stopSpeaking() {
    this.cleanupSpeech();
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
  }

  cleanupSpeech() {
    this.isSpeaking = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (typeof window !== 'undefined') {
      window._auraSpeechUtterance = null;
    }
  }

  // -------------------------------------------------------------------------
  // Listeners & Debug State Management
  // -------------------------------------------------------------------------
  updateDebug(partial) {
    this.debugState = { ...this.debugState, ...partial };
    this.debugListeners.forEach(listener => listener(this.debugState));
  }

  emitState(state) {
    this.stateListeners.forEach(listener => listener(state));
  }

  onStateChange(listener) {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  onDebugChange(listener) {
    this.debugListeners.add(listener);
    listener(this.debugState);
    return () => this.debugListeners.delete(listener);
  }

  getDebugSnapshot() {
    return { ...this.debugState };
  }
}

export const speechService = new SpeechService();
