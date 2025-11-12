export class WakeWordDetector {
  private recognition: any;
  private isListening = false;
  private isStarting = false;
  private onWakeWordDetected: () => void;

  constructor(onWakeWordDetected: () => void) {
    console.log('🎤 [WakeWordDetector] Constructor called');
    this.onWakeWordDetected = onWakeWordDetected;
    // @ts-ignore - Web Speech API prefixes
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('❌ [WakeWordDetector] Speech recognition not supported in this browser');
      throw new Error('Speech recognition not supported in this browser');
    }
    console.log('✅ [WakeWordDetector] SpeechRecognition API available');

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
    console.log('🎤 [WakeWordDetector] Starting wake word detection...');
    try {
      // Request mic permission once to avoid prompt later
      console.log('🎤 [WakeWordDetector] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ [WakeWordDetector] Microphone permission granted');
      // Stop tracks immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());
    } catch (e: any) {
      console.error('❌ [WakeWordDetector] Microphone permission error:', e);
      console.error('❌ [WakeWordDetector] Error name:', e?.name);
      console.error('❌ [WakeWordDetector] Error message:', e?.message);
      console.error('❌ [WakeWordDetector] Error stack:', e?.stack);
      
      // Show user-friendly error based on error type
      const errorType = e?.name || 'Unknown';
      const errorMsg = e?.message || 'Unknown error';
      console.error(`❌ [WakeWordDetector] MICROPHONE ACCESS FAILED: ${errorType} - ${errorMsg}`);
      
      // Throw error to propagate to caller
      throw new Error(`Microphone permission denied: ${errorType} - ${errorMsg}`);
    }

    this.isListening = true;
    this.isStarting = true;
    try {
      console.log('🎤 [WakeWordDetector] Starting speech recognition...');
      this.recognition.start();
      console.log('✅ [WakeWordDetector] Wake word detection started successfully');
      return true;
    } catch (error: any) {
      console.error('❌ [WakeWordDetector] Failed to start wake word detection:', error);
      console.error('❌ [WakeWordDetector] Recognition error name:', error?.name);
      console.error('❌ [WakeWordDetector] Recognition error message:', error?.message);
      this.isStarting = false;
      throw error;
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
