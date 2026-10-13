// Web Audio API Wildlife Sound Engine & Speech Navigation Voice for Humedal Angachilla

class SoundService {
  private ctx: AudioContext | null = null;
  private currentAmbientSource: { stop: () => void } | null = null;
  private isAmbientPlaying: boolean = false;
  private speechVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    // Lazy init for audio context on first user interaction
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoice();
    }
  }

  private initVoice() {
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Look for Spanish voice
      const esVoice = voices.find(v => v.lang.startsWith('es-CL')) ||
                      voices.find(v => v.lang.startsWith('es-')) ||
                      voices.find(v => v.lang.includes('es'));
      if (esVoice) {
        this.speechVoice = esVoice;
      }
    };
    setVoice();
    window.speechSynthesis.onvoiceschanged = setVoice;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Voice navigation alert like Waze
  public speakGuidance(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      if (this.speechVoice) {
        utterance.voice = this.speechVoice;
      } else {
        utterance.lang = 'es-CL';
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore if speech synthesis blocked
    }
  }

  // Navigation chime (beep before turns)
  public playNavChime() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Chucao (trill and descending acoustic bird call of Valdivian rainforest)
  public playChucao() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Series of energetic whistling pulses then rapid trill
    const pulseCount = 7;
    for (let i = 0; i < pulseCount; i++) {
      const startTime = now + (i * 0.08);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const startFreq = 2600 - (i * 120);
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(startFreq - 300, startTime + 0.06);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.065);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.07);
    }

    // Finishing trill
    const trillStart = now + 0.6;
    const oscTrill = ctx.createOscillator();
    const gainTrill = ctx.createGain();
    oscTrill.type = 'sine';
    oscTrill.frequency.setValueAtTime(1900, trillStart);
    oscTrill.frequency.linearRampToValueAtTime(1400, trillStart + 0.5);

    gainTrill.gain.setValueAtTime(0.22, trillStart);
    gainTrill.gain.exponentialRampToValueAtTime(0.001, trillStart + 0.5);

    oscTrill.connect(gainTrill);
    gainTrill.connect(ctx.destination);
    oscTrill.start(trillStart);
    oscTrill.stop(trillStart + 0.5);
  }

  // Cisne de Cuello Negro (resonant bugle & trumpeting horn)
  public playCisne() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(340, now);
    osc1.frequency.linearRampToValueAtTime(420, now + 0.2);
    osc1.frequency.linearRampToValueAtTime(320, now + 0.6);

    osc2.frequency.setValueAtTime(680, now);
    osc2.frequency.linearRampToValueAtTime(840, now + 0.2);
    osc2.frequency.linearRampToValueAtTime(640, now + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);
  }

  // Martín Pescador (chattering sharp rattle)
  public playMartinPescador() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const clicks = 14;

    for (let i = 0; i < clicks; i++) {
      const clickTime = now + (i * 0.045);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2400 + (Math.sin(i) * 300), clickTime);

      gain.gain.setValueAtTime(0.2, clickTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(clickTime);
      osc.stop(clickTime + 0.04);
    }
  }

  // Ranita de Darwin (clear crystal glass ping / bell)
  public playRanitaDarwin() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(2950, now + 0.18);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Siete Colores (bright delicate warble in the reeds/totoras)
  public playSieteColores() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const notes = [3100, 3600, 3200, 3900, 3500];
    notes.forEach((freq, idx) => {
      const time = now + (idx * 0.09);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.linearRampToValueAtTime(freq + 150, time + 0.07);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.085);
    });
  }

  // Tagua común (sharp aquatic cluck)
  public playTagua() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.value = 1100;

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Coipo (water splashing ripple)
  public playCoipo() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Pink noise burst filtered
    const bufferSize = ctx.sampleRate * 0.8;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(150, now + 0.7);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.8);
  }

  // Garza Cuca (deep prehistoric croak)
  public playGarzaCuca() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.value = 450;

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Play sound by generic key
  public playBySoundKey(key: string) {
    switch (key) {
      case 'chucao':
        this.playChucao();
        break;
      case 'cisne':
        this.playCisne();
        break;
      case 'martin_pescador':
        this.playMartinPescador();
        break;
      case 'ranita_darwin':
        this.playRanitaDarwin();
        break;
      case 'siete_colores':
        this.playSieteColores();
        break;
      case 'tagua':
        this.playTagua();
        break;
      case 'coipo':
        this.playCoipo();
        break;
      case 'garza_cuca':
        this.playGarzaCuca();
        break;
      default:
        this.playChucao();
    }
  }

  // Ambient sound loop of Valdivia wetland (water, soft wind, sporadic chirps)
  public toggleAmbient(onToggle?: (isPlaying: boolean) => void): boolean {
    if (this.isAmbientPlaying) {
      if (this.currentAmbientSource) {
        this.currentAmbientSource.stop();
        this.currentAmbientSource = null;
      }
      this.isAmbientPlaying = false;
      onToggle?.(false);
      return false;
    }

    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Create gentle wind noise
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noiseSource.start(now);

    // Periodic gentle bird chirps while ambient is running
    const intervalId = window.setInterval(() => {
      if (!this.isAmbientPlaying) {
        clearInterval(intervalId);
        return;
      }
      const pick = Math.random();
      if (pick < 0.33) {
        this.playSieteColores();
      } else if (pick < 0.66) {
        this.playRanitaDarwin();
      } else {
        this.playChucao();
      }
    }, 4500);

    this.currentAmbientSource = {
      stop: () => {
        try {
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
          setTimeout(() => {
            noiseSource.stop();
            noiseSource.disconnect();
          }, 500);
        } catch {
          // ignore
        }
        clearInterval(intervalId);
      }
    };

    this.isAmbientPlaying = true;
    onToggle?.(true);
    return true;
  }

  public isPlayingAmbient(): boolean {
    return this.isAmbientPlaying;
  }
}

export const soundService = new SoundService();
