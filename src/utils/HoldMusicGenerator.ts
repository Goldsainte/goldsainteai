// Generate elegant ambient hold music using Web Audio API
export class HoldMusicGenerator {
  private audioContext: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async play() {
    if (this.isPlaying || !this.audioContext) {
      console.log('Hold music already playing or no audio context');
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming AudioContext before starting hold music');
        await this.audioContext.resume();
      }
    } catch (e) {
      console.warn('AudioContext resume failed in play()', e);
    }

    console.log('Creating hold music oscillators');
    
    // Create two oscillators for a richer ambient sound
    this.oscillator1 = this.audioContext.createOscillator();
    this.oscillator2 = this.audioContext.createOscillator();
    this.gainNode = this.audioContext.createGain();

    // Set frequencies for a calming, elegant tone (C and E notes)
    this.oscillator1.frequency.value = 261.63; // C4
    this.oscillator2.frequency.value = 329.63; // E4
    
    // Use sine waves for smooth, pleasant sound
    this.oscillator1.type = 'sine';
    this.oscillator2.type = 'sine';

    // Set initial volume to 0 for fade in
    this.gainNode.gain.value = 0;

    // Connect the audio nodes
    this.oscillator1.connect(this.gainNode);
    this.oscillator2.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);

    // Start the oscillators
    this.oscillator1.start();
    this.oscillator2.start();

    console.log('Hold music oscillators started, fading in');

    // Fade in over 0.5 seconds
    this.gainNode.gain.linearRampToValueAtTime(
      0.08, // Low volume for subtle background
      this.audioContext.currentTime + 0.5
    );

    this.isPlaying = true;
  }

  async unlock() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      try {
        console.log('Manually unlocking AudioContext from user gesture');
        await this.audioContext.resume();
      } catch (e) {
        console.warn('AudioContext resume failed in unlock()', e);
      }
    }
  }

  stop() {
    if (!this.isPlaying || !this.audioContext || !this.gainNode) return;

    // Fade out over 0.5 seconds
    this.gainNode.gain.linearRampToValueAtTime(
      0,
      this.audioContext.currentTime + 0.5
    );

    // Stop and clean up after fade out
    setTimeout(() => {
      if (this.oscillator1) {
        this.oscillator1.stop();
        this.oscillator1.disconnect();
        this.oscillator1 = null;
      }
      if (this.oscillator2) {
        this.oscillator2.stop();
        this.oscillator2.disconnect();
        this.oscillator2 = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.isPlaying = false;
    }, 500);
  }

  cleanup() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
