class KWSResample extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.inRate = options.processorOptions.inRate || sampleRate;
    this.outRate = options.processorOptions.outRate || 16000;
    this.ratio = this.inRate / this.outRate;
    this._acc = 0;
    this._buf = [];
    this.frameCount = 0;
  }

  static get parameterDescriptors() {
    return [];
  }

  // Mix stereo to mono
  monoMix(ch0, ch1) {
    const len = Math.min(ch0.length, ch1.length);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      out[i] = (ch0[i] + ch1[i]) * 0.5;
    }
    return out;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    // Mix to mono
    const ch0 = input[0];
    const ch1 = input[1];
    const mono = ch1 ? this.monoMix(ch0, ch1) : ch0;

    // Linear resample to 16kHz
    const outLen = Math.floor(mono.length / this.ratio);
    const out = new Float32Array(outLen);
    let t = this._acc;
    
    for (let i = 0; i < outLen; i++, t += this.ratio) {
      const i0 = Math.floor(t);
      const i1 = Math.min(i0 + 1, mono.length - 1);
      const frac = t - i0;
      out[i] = mono[i0] * (1 - frac) + mono[i1] * frac;
    }
    this._acc = t - Math.floor(t);

    // Float → PCM16
    const pcm16 = new Int16Array(out.length);
    for (let i = 0; i < out.length; i++) {
      let s = Math.max(-1, Math.min(1, out[i]));
      pcm16[i] = (s * 32767) | 0;
    }

    // Calculate RMS
    let sum = 0;
    for (let i = 0; i < out.length; i++) {
      sum += out[i] * out[i];
    }
    const rms = Math.sqrt(sum / out.length);

    // Calculate peak
    let peak = 0;
    for (let i = 0; i < out.length; i++) {
      const a = Math.abs(out[i]);
      if (a > peak) peak = a;
    }

    this.frameCount++;

    // Send resampled audio chunk
    this.port.postMessage({
      type: 'chunk16k',
      pcm16: pcm16.buffer,
      length: pcm16.length
    }, [pcm16.buffer]);

    // Send stats
    this.port.postMessage({
      type: 'stats',
      payload: {
        framesToKWS: this.frameCount,
        lastKWSSampleRate: this.outRate,
        rms: rms,
        peak: peak,
        bufferSize: out.length
      }
    });

    return true;
  }
}

registerProcessor('kws-resample', KWSResample);
