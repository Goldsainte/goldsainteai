import { PorcupineWorker, BuiltInKeyword } from '@picovoice/porcupine-web';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';

export class PicovoiceWakeWordDetector {
  private porcupineWorker: PorcupineWorker | null = null;
  private isListening = false;
  private onWakeWordDetected: () => void;

  constructor(onWakeWordDetected: () => void) {
    this.onWakeWordDetected = onWakeWordDetected;
  }

  async start(): Promise<boolean> {
    try {
      const accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY;
      
      if (!accessKey) {
        console.error('VITE_PICOVOICE_ACCESS_KEY not found');
        return false;
      }

      console.log('Initializing Picovoice wake word detection...');

      // Initialize Porcupine with built-in "Porcupine" keyword
      // User can later train "Hey Goldsainte" in Picovoice Console
      this.porcupineWorker = await PorcupineWorker.create(
        accessKey,
        [{ builtin: BuiltInKeyword.Porcupine, sensitivity: 0.5 }],
        (detection) => {
          if (detection.label) {
            console.log('Wake word detected:', detection.label);
            this.onWakeWordDetected();
          }
        },
        { base64: '', publicPath: '', forceWrite: true } // Default model config
      );

      // Start WebVoiceProcessor with the porcupine worker
      await WebVoiceProcessor.subscribe(this.porcupineWorker);
      this.isListening = true;
      
      console.log('Picovoice wake word detection started - say "Porcupine" to activate');
      return true;
    } catch (error) {
      console.error('Failed to start Picovoice wake word detection:', error);
      return false;
    }
  }

  async stop() {
    if (this.porcupineWorker) {
      try {
        await WebVoiceProcessor.unsubscribe(this.porcupineWorker);
        await this.porcupineWorker.release();
        this.porcupineWorker = null;
      } catch (error) {
        console.error('Error stopping Picovoice:', error);
      }
    }
    this.isListening = false;
    console.log('Picovoice wake word detection stopped');
  }
}
