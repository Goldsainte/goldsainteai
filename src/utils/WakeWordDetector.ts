// Chrome-first continuous speech-rec wake emulation, with watchdog + backoff.
// Falls back to a no-op on Safari (so the UI can switch to a real KWS later).

type WakeCallback = () => void;

export class WakeWordDetector {
  private recognition: any | null = null;
  private onWake: WakeCallback;
  private running = false;
  private backoffMs = 500;
  private maxBackoffMs = 8000;
  private lastEventAt = 0;
  private watchdogTimer: number | null = null;
  private micKeepAliveStream: MediaStream | null = null;

  constructor(onWake: WakeCallback) {
    this.onWake = onWake;
  }

  private get SpeechRecognitionCtor(): any | null {
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }

  private supported(): boolean {
    return !!this.SpeechRecognitionCtor;
  }

  private async startMicKeepAlive() {
    // Keep a real mic stream alive so Chrome won't suspend audio capture.
    try {
      this.micKeepAliveStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
    } catch (e) {
      console.warn("[WakeWord] mic keep-alive failed:", e);
    }
  }

  private clearWatchdog() {
    if (this.watchdogTimer) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private armWatchdog() {
    this.clearWatchdog();
    // If we get no events for 7s, restart recognition
    this.watchdogTimer = window.setTimeout(() => {
      if (!this.running || !this.recognition) return;
      const silenceFor = Date.now() - this.lastEventAt;
      if (silenceFor >= 7000) {
        console.warn("[WakeWord] Watchdog restarting after silence");
        try {
          this.recognition!.abort();
        } catch {}
      } else {
        this.armWatchdog();
      }
    }, 7000);
  }

  private normalizeTranscript(s: string): string {
    return (s || "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private matchesWake(transcript: string): boolean {
    const t = this.normalizeTranscript(transcript);
    // Robust regex: allows optional space and common variants
    const patterns = [
      /\bhey\s*goldsainte\b/,
      /\bhey\s*gold\s*sainte\b/,
      /\bhey\s*gold\s*saint\b/,
      /\bgold\s*sainte\b/,
      /\bgold\s*saint\b/
    ];
    return patterns.some((re) => re.test(t));
  }

  async start() {
    if (!this.supported()) {
      console.warn("[WakeWord] SpeechRecognition not supported in this browser (Safari/iOS).");
      this.running = false;
      return;
    }
    if (this.running) return;

    await this.startMicKeepAlive();

    const Ctor = this.SpeechRecognitionCtor!;
    this.recognition = new Ctor();
    // Critical flags for Chrome:
    this.recognition.continuous = true;       // don't stop after first result
    this.recognition.interimResults = true;   // get partials fast
    this.recognition.lang = "en-US";
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.lastEventAt = Date.now();
      this.backoffMs = 500;
      console.log("[WakeWord] recognition started");
      this.armWatchdog();
    };

    this.recognition.onresult = (event: any) => {
      this.lastEventAt = Date.now();
      const last = event.results.length - 1;
      const alt = event.results[last] && event.results[last][0];
      const transcript = String(alt?.transcript || "");
      
      if (this.matchesWake(transcript)) {
        console.log("[WakeWord] Wake word detected!");
        // 🔴 CRITICAL FIX: Stop recognition BEFORE firing callback
        // This prevents Chrome from aborting recognition when TTS/WebRTC starts
        try {
          this.recognition?.stop();
        } catch {}
        this.running = false;
        this.clearWatchdog();
        
        // Now fire callback (recognition already stopped, safe to start voice/TTS)
        this.onWake();
      }
    };

    this.recognition.onerror = (e: any) => {
      this.lastEventAt = Date.now();
      console.warn("[WakeWord] error:", e?.error || e);
      // Errors like 'no-speech', 'aborted', 'audio-capture', 'not-allowed'
      if (e?.error === "not-allowed") {
        this.running = false;
        this.stop();
        return;
      }
      // soft restart on other errors
      try {
        this.recognition?.abort();
      } catch {}
    };

    this.recognition.onend = () => {
      this.clearWatchdog();
      if (!this.running) return; // won't restart if we stopped intentionally
      
      // Exponential backoff to avoid hot loops when Chrome is unhappy
      setTimeout(() => {
        try {
          this.recognition!.start();
        } catch (err) {
          console.warn("[WakeWord] start() threw, backing off:", err);
          this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
          setTimeout(() => {
            if (this.running) {
              try {
                this.recognition!.abort();
              } catch {}
            }
          }, this.backoffMs);
        }
      }, this.backoffMs);
    };

    this.running = true;
    try {
      this.recognition.start(); // must be called from a user-gesture context
    } catch (err) {
      console.warn("[WakeWord] initial start failed:", err);
    }

    // Keep AudioContext alive if you have one
    document.addEventListener("visibilitychange", async () => {
      try {
        // if you maintain a shared AudioContext, resume it here
        // await audioContext.resume();
      } catch {}
    });
  }

  stop() {
    this.running = false;
    this.clearWatchdog();
    if (this.recognition) {
      try { this.recognition.onresult = null; } catch {}
      try { this.recognition.onend = null; } catch {}
      try { this.recognition.onerror = null; } catch {}
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    if (this.micKeepAliveStream) {
      this.micKeepAliveStream.getTracks().forEach(t => t.stop());
      this.micKeepAliveStream = null;
    }
  }
}

export default WakeWordDetector;
