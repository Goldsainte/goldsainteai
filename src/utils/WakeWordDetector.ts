export class WakeWordDetector {
  private recognition: any;
  private isListening = false;
  private onWakeWordDetected: () => void;

  constructor(onWakeWordDetected: () => void) {
    this.onWakeWordDetected = onWakeWordDetected;
    
    // @ts-ignore - Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported in this browser');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript.toLowerCase().trim();
      
      console.log('Heard:', transcript);

      // Check for wake word variations
      if (
        transcript.includes('hey goldsainte') ||
        transcript.includes('hey gold saint') ||
        transcript.includes('hey gold sante') ||
        transcript.includes('goldsainte')
      ) {
        console.log('Wake word detected!');
        this.onWakeWordDetected();
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Auto-restart on these errors
        setTimeout(() => {
          if (this.isListening) {
            this.recognition.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (this.isListening) {
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (error) {
            console.log('Recognition already started');
          }
        }, 100);
      }
    };
  }

  async start() {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.isListening = true;
      this.recognition.start();
      console.log('Wake word detection started');
      return true;
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      return false;
    }
  }

  stop() {
    this.isListening = false;
    try {
      this.recognition.stop();
    } catch (error) {
      console.log('Recognition already stopped');
    }
  }
}
