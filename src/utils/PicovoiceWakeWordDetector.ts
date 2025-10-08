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

      // Initialize Porcupine with custom "Hey Sainte" keyword
      // Fetch the custom model file
      const modelResponse = await fetch('/models/Hey-Sainte_en_ios_v3_0_0.ppn');
      const modelBlob = await modelResponse.blob();
      const modelArrayBuffer = await modelBlob.arrayBuffer();
      const modelBase64 = btoa(
        String.fromCharCode(...new Uint8Array(modelArrayBuffer))
      );
      
      this.porcupineWorker = await PorcupineWorker.create(
        accessKey,
        [{ 
          label: 'Hey Sainte',
          base64: modelBase64,
          sensitivity: 0.5 
        }],
        (detection) => {
          if (detection.label) {
            console.log('Wake word detected:', detection.label);
            this.onWakeWordDetected();
          }
        },
        { base64: '', publicPath: '', forceWrite: true }
      );

      // Start WebVoiceProcessor with the porcupine worker
      await WebVoiceProcessor.subscribe(this.porcupineWorker);
      this.isListening = true;
      
      console.log('Picovoice wake word detection started - say "Hey Sainte" to activate');
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
