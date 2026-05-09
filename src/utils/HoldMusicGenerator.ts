// Play elegant hold music using actual audio file
export class HoldMusicGenerator {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private fadeInterval: NodeJS.Timeout | null = null;

  constructor() {
        try {
      // Use a royalty-free smooth jazz track
      this.audio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3');
      this.audio.loop = true;
      this.audio.volume = 0;
      this.audio.preload = 'auto';
      
      // Add event listeners for debugging
      this.audio.addEventListener('loadstart', () => );
      this.audio.addEventListener('loadeddata', () => );
      this.audio.addEventListener('canplay', () => );
      this.audio.addEventListener('error', (e) => {
        console.error('❌ [HoldMusic] Audio error event:', e);
        console.error('❌ [HoldMusic] Audio error code:', this.audio?.error?.code);
        console.error('❌ [HoldMusic] Audio error message:', this.audio?.error?.message);
      });
      this.audio.addEventListener('play', () => );
      this.audio.addEventListener('pause', () => );
      
                      } catch (error) {
      console.error('❌ [HoldMusic] Failed to create audio element:', error);
    }
  }

  async play() {
            
    if (this.isPlaying || !this.audio) {
            return;
    }

                        
    try {
      // Start playing
            const playPromise = this.audio.play();
            
      await playPromise;
            
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

          } catch (error: any) {
      console.error('❌ [HoldMusic] Error playing hold music:', error);
      console.error('❌ [HoldMusic] Error type:', error?.name);
      console.error('❌ [HoldMusic] Error message:', error?.message);
      console.error('❌ [HoldMusic] Error stack:', error?.stack);
      this.isPlaying = false;
      
      // Check if it's an autoplay block
      if (error.name === 'NotAllowedError') {
        console.warn('⚠️ [HoldMusic] Autoplay blocked - user interaction required');
        throw new Error('AUTOPLAY_BLOCKED');
      }
      
      // Re-throw to propagate to caller
      throw error;
    }
  }

  stop() {
            
    if (!this.isPlaying || !this.audio) {
            return;
    }

        
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
