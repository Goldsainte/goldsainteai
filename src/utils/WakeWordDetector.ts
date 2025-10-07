export class WakeWordDetector {
  private recognition: any;
  private isListening = false;
  private isStarting = false;
  private onWakeWordDetected: () => void;

  constructor(onWakeWordDetected: () => void) {
    this.onWakeWordDetected = onWakeWordDetected;
    // @ts-ignore - Web Speech API prefixes
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      console.log('Wake word recognition started');
      this.isStarting = false;
    };

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript: string = String(event.results[last][0].transcript || '').toLowerCase().trim();
      if (!transcript) return;
      console.log('Heard:', transcript);
      if (
        transcript.includes('hey goldsainte') ||
        transcript.includes('hey gold saint') ||
        transcript.includes('hey gold sante') ||
        transcript.includes('gold saint') ||
        transcript.includes('goldsainte')
      ) {
        console.log('Wake word detected!');
        this.onWakeWordDetected();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event?.error || event);
      
      // Don't restart on aborted errors - they usually mean we're stopping intentionally
      if (event?.error === 'aborted') {
        this.isStarting = false;
        return;
      }
      
      // Only restart on recoverable errors
      if (event?.error === 'no-speech') {
        this.safeRestart(1000);
      } else if (event?.error === 'audio-capture') {
        // Audio capture failed - likely mic in use, don't keep retrying
        console.warn('Microphone unavailable, wake word detection paused');
        this.isListening = false;
        this.isStarting = false;
      }
    };

    this.recognition.onend = () => {
      console.log('Wake word recognition ended');
      if (this.isListening && !this.isStarting) {
        this.safeRestart(500);
      } else {
        this.isStarting = false;
      }
    };
  }

  private safeRestart(delayMs: number) {
    if (!this.isListening || this.isStarting) return;
    this.isStarting = true;
    setTimeout(() => {
      if (!this.isListening || this.isStarting === false) {
        this.isStarting = false;
        return;
      }
      try {
        this.recognition.start();
      } catch (e: any) {
        console.warn('Recognition start failed:', e?.message || e);
        this.isStarting = false;
        // Don't retry indefinitely - stop after failed restart
        if (e?.message?.includes('already started')) {
          // Already running, we're good
          return;
        }
      }
    }, delayMs);
  }

  async start() {
    try {
      // Request mic permission once to avoid prompt later
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      console.error('Microphone permission error:', e);
      // Still attempt to start recognition; some browsers allow without explicit stream
    }

    this.isListening = true;
    this.isStarting = true;
    try {
      this.recognition.start();
      console.log('Wake word detection started');
      return true;
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      this.isStarting = false;
      return false;
    }
  }

  stop() {
    this.isListening = false;
    this.isStarting = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.log('Recognition already stopped');
    }
  }
}
