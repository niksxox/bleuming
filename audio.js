/**
 * Bleuming — Web Audio API Synthesizer & Sound Engine
 * Authentic Y2K / 8-bit cozy pastel sound effects and generative ambient music.
 * 100% offline, zero external asset dependencies.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    
    // Cozy pastel pentatonic notes (Hz)
    // F4, G4, A4, C5, D5, E5, F5
    this.melodyScale = [349.23, 392.00, 440.00, 523.25, 587.33, 659.25, 698.46];
    this.chords = [
      [349.23, 440.00, 523.25], // F major
      [329.63, 392.00, 493.88], // C/E
      [293.66, 349.23, 440.00], // D minor
      [261.63, 329.63, 392.00]  // C major
    ];
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return !this.isMuted;
  }

  // Play a simple soft synthetic tone
  playTone(freq, duration = 0.15, type = 'sine', gainVal = 0.1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  // Footstep tap
  playFootstep() {
    if (this.isMuted) return;
    this.playTone(180 + Math.random() * 40, 0.05, 'triangle', 0.03);
  }

  // Pickup flower / item chime
  playPickup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.22, 'sine', 0.12);
      }, idx * 60);
    });
  }

  // Dialogue blip
  playDialogueBlip(pitchOffset = 0) {
    if (this.isMuted) return;
    const base = 480 + pitchOffset;
    this.playTone(base + Math.random() * 60, 0.04, 'triangle', 0.035);
  }

  // Button click / UI select
  playSelect() {
    if (this.isMuted) return;
    this.playTone(600, 0.08, 'sine', 0.08);
  }

  // Bloom / Quest Complete fanfare
  playBloomFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const fanfare = [
      { f: 440, d: 0.12 }, // A4
      { f: 554.37, d: 0.12 }, // C#5
      { f: 659.25, d: 0.14 }, // E5
      { f: 880, d: 0.35 }    // A5
    ];

    fanfare.forEach((step, idx) => {
      setTimeout(() => {
        this.playTone(step.f, step.d, 'sine', 0.14);
      }, idx * 110);
    });
  }

  // Grounding calming bell tone
  playGroundingBell(step = 1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    // Harmonic singing bowl chime
    const baseFreq = 261.63 * Math.pow(1.12, step); // Harmonic warmth
    this.playTone(baseFreq, 1.2, 'sine', 0.15);
    setTimeout(() => {
      this.playTone(baseFreq * 2.01, 0.8, 'sine', 0.06);
    }, 40);
  }

  // Generative pastel ambient background loop
  startBgm() {
    if (this.isMuted || this.bgmPlaying) return;
    this.ensureContext();
    this.bgmPlaying = true;
    this.scheduleNextBgmNote();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleNextBgmNote() {
    if (!this.bgmPlaying || this.isMuted) return;

    // Soft melody note
    const note = this.melodyScale[Math.floor(Math.random() * this.melodyScale.length)];
    const chord = this.chords[Math.floor(this.bgmStep / 4) % this.chords.length];

    // Every 4 steps, play a gentle background chord note
    if (this.bgmStep % 4 === 0) {
      chord.forEach(f => {
        this.playTone(f * 0.5, 1.8, 'sine', 0.02);
      });
    }

    // Play melody note
    this.playTone(note, 0.5, 'sine', 0.04);

    this.bgmStep++;
    const nextInterval = (Math.random() > 0.4 ? 400 : 800) + (Math.random() * 150);
    this.bgmTimer = setTimeout(() => this.scheduleNextBgmNote(), nextInterval);
  }
}

// Global Sound Instance
window.soundEngine = new SoundEngine();

