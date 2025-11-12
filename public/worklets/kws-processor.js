class KWSRMSProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.sampleRate = options.processorOptions?.sampleRate || sampleRate;
    this.bufferSize = 128; // default block size
    this.maxScoreWindow = 0;
    this.frameCount = 0;
    this.droppedFrames = 0;
    this.threshold = 0.5; // placeholder for KWS threshold
    this.lastPost = 0;
  }

  static get parameterDescriptors() {
    return [];
  }

  // Compute RMS and peak for mono channel
  _metrics(input) {
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < input.length; i++) {
      const v = input[i];
      sum += v * v;
      const a = Math.abs(v);
      if (a > peak) peak = a;
    }
    const rms = Math.sqrt(sum / input.length);
    return { rms, peak };
  }

  process(inputs) {
    const now = currentTime * 1000;
    if (!inputs || inputs.length === 0 || inputs[0].length === 0) {
      this.droppedFrames++;
      // Still tick time
      return true;
    }

    // Use first input, first channel
    const channel = inputs[0][0];
    if (!channel) {
      this.droppedFrames++;
      return true;
    }

    const { rms, peak } = this._metrics(channel);

    // Placeholder KWS score: use normalized RMS as a crude proxy (NOT real KWS!)
    // This is only for diagnostics to verify audio is flowing.
    const score = Math.min(1, rms * 8);
    if (score > this.maxScoreWindow) this.maxScoreWindow = score;

    this.frameCount++;

    // Post roughly every 60ms
    if (now - this.lastPost > 60) {
      this.port.postMessage({
        type: 'metrics',
        rms,
        peak,
        score,
        maxScore: this.maxScoreWindow,
        threshold: this.threshold,
        frameCount: this.frameCount,
        droppedFrames: this.droppedFrames,
        sampleRate: this.sampleRate,
        bufferSize: channel.length,
        ts: now,
      });
      this.lastPost = now;
      // Decay window slowly
      this.maxScoreWindow *= 0.95;
    }

    return true;
  }
}

registerProcessor('kws-processor', KWSRMSProcessor);
