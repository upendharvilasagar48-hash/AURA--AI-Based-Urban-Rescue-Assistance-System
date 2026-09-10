/**
 * Emergency Audio Siren Synthesizer using Web Audio API
 * Generates an authentic dual-tone emergency vehicle siren (650 Hz / 900 Hz)
 * Duration: 4 - 8 seconds, zero external audio dependencies.
 */
class EmergencyAudioSynth {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.intervalId = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  playSiren(durationSeconds = 6.0) {
    if (this.isPlaying) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.isPlaying = true;
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sawtooth';
      this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime); // Safe comfortable volume

      // Frequency alternation between 650Hz and 920Hz every 350ms
      let high = false;
      this.oscillator.frequency.setValueAtTime(650, this.audioCtx.currentTime);

      this.intervalId = setInterval(() => {
        if (!this.isPlaying || !this.oscillator || !this.audioCtx) return;
        high = !high;
        const targetFreq = high ? 920 : 650;
        this.oscillator.frequency.exponentialRampToValueAtTime(
          targetFreq,
          this.audioCtx.currentTime + 0.12
        );
      }, 350);

      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
      this.oscillator.start();

      // Automatically stop after specified duration
      setTimeout(() => {
        this.stopSiren();
      }, durationSeconds * 1000);

    } catch (e) {
      console.warn("AudioContext playback prevented or not permitted:", e);
      this.isPlaying = false;
    }
  }

  stopSiren() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.gainNode && this.audioCtx) {
      try {
        this.gainNode.gain.linearRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
      } catch (e) {}
    }
    if (this.oscillator) {
      try {
        this.oscillator.stop(this.audioCtx ? this.audioCtx.currentTime + 0.15 : 0);
        this.oscillator.disconnect();
      } catch (e) {}
      this.oscillator = null;
    }
  }
}

export const sirenSynth = new EmergencyAudioSynth();
