/**
 * Procedural Aerospace Web Audio & Synthetic Mission Control Annunciator.
 * Synthesizes dynamic engine rumble with low-pass acoustics, sonic booms,
 * pneumatic stage separations, touchdown clangs, and voice callouts.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private bassOsc: OscillatorNode | null = null;
  private isEngineRunning: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous Rocket Engine Sound Generator with dynamic filtering.
   */
  public updateEngineSound(throttle: number, altitudeM: number, dynamicPressurePa: number) {
    if (this.isMuted || throttle <= 0.01) {
      if (this.isEngineRunning && this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    this.initContext();
    if (!this.ctx) return;

    if (!this.isEngineRunning) {
      this.startEngineAudio();
    }

    if (this.engineGain && this.engineFilter && this.bassOsc) {
      const now = this.ctx.currentTime;
      // Air attenuation: higher altitude decreases acoustic transmission
      const atmoDamping = Math.max(0.1, 1.0 - Math.min(1.0, altitudeM / 65000));
      const targetGain = Math.min(0.85, throttle * 0.7 * atmoDamping);

      this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);

      // Filter cutoff modulated by throttle and dynamic pressure (Max-Q roar)
      const qBoost = Math.min(1500, dynamicPressurePa * 0.03);
      const cutoff = Math.max(120, 250 + throttle * 700 + qBoost);
      this.engineFilter.frequency.setTargetAtTime(cutoff, now, 0.1);

      // Modulate low-frequency rumble pitch
      this.bassOsc.frequency.setTargetAtTime(38 + throttle * 28, now, 0.1);
    }
  }

  private speechQueue: string[] = [];
  private isSpeaking: boolean = false;

  private startEngineAudio() {
    if (!this.ctx || this.noiseNode) return;

    // Multi-Pole Kellet Pink Noise Filter for Rocket Exhaust
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.22;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 350;
    this.engineFilter.Q.value = 3.0;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    // Sub-Bass Resonance
    this.bassOsc = this.ctx.createOscillator();
    this.bassOsc.type = 'sawtooth';
    this.bassOsc.frequency.value = 42;

    const bassGain = this.ctx.createGain();
    bassGain.gain.value = 0.45;

    this.noiseNode.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);

    this.bassOsc.connect(bassGain);
    bassGain.connect(this.engineGain);

    this.engineGain.connect(this.ctx.destination);

    this.noiseNode.start();
    this.bassOsc.start();
    this.isEngineRunning = true;
  }

  public stopEngineAudio() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Pneumatic stage separation pop sound effect.
   */
  public playStageSeparation() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Supersonic sonic boom sound effect.
   */
  public playSonicBoom() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  /**
   * Touchdown landing thump sound effect.
   */
  public playTouchdown() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  /**
   * Catastrophic explosion crash sound.
   */
  public playExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(18, now + 0.9);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  /**
   * Synthetic Mission Control speech annunciator with non-colliding FIFO queue.
   */
  public speak(message: string) {
    if (this.isMuted) return;
    if (!('speechSynthesis' in window)) return;

    this.speechQueue.push(message);
    this.processSpeechQueue();
  }

  private processSpeechQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const nextMsg = this.speechQueue.shift();
    if (!nextMsg) return;

    this.isSpeaking = true;
    const utterance = new SpeechSynthesisUtterance(nextMsg);
    utterance.rate = 1.08;
    utterance.pitch = 0.95;
    utterance.volume = 0.85;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.processSpeechQueue();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const soundEngine = new SoundEngine();
