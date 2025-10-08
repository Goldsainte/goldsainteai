// Play elegant hold music using actual audio file
export class HoldMusicGenerator {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private fadeInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Use a royalty-free smooth jazz track
    this.audio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3');
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.preload = 'auto';
  }

  async play() {
    if (this.isPlaying || !this.audio) {
      console.log('Hold music already playing or no audio element');
      return;
    }

    console.log('Starting hold music');
    
    try {
      // Start playing
      await this.audio.play();
      this.isPlaying = true;

      // Fade in over 1 second
      const targetVolume = 0.15; // Low volume for subtle background
      const steps = 20;
      const stepDuration = 50; // 50ms per step = 1 second total
      const volumeIncrement = targetVolume / steps;
      
      let currentStep = 0;
      this.fadeInterval = setInterval(() => {
        if (!this.audio) return;
        
        currentStep++;
        this.audio.volume = Math.min(volumeIncrement * currentStep, targetVolume);
        
        if (currentStep >= steps) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
        }
      }, stepDuration);

      console.log('Hold music playing and fading in');
    } catch (error) {
      console.error('Error playing hold music:', error);
      this.isPlaying = false;
    }
  }

  stop() {
    if (!this.isPlaying || !this.audio) return;

    console.log('Stopping hold music');
    
    // Clear any existing fade interval
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    // Fade out over 0.5 seconds
    const steps = 10;
    const stepDuration = 50;
    const volumeDecrement = this.audio.volume / steps;
    
    let currentStep = 0;
    this.fadeInterval = setInterval(() => {
      if (!this.audio) return;
      
      currentStep++;
      this.audio.volume = Math.max(this.audio.volume - volumeDecrement, 0);
      
      if (currentStep >= steps || this.audio.volume === 0) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        if (this.audio) {
          this.audio.pause();
          this.audio.currentTime = 0;
        }
        this.isPlaying = false;
      }
    }, stepDuration);
  }

  cleanup() {
    this.stop();
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }
  }
}
