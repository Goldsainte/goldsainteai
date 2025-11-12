// Play elegant hold music using actual audio file
export class HoldMusicGenerator {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private fadeInterval: NodeJS.Timeout | null = null;

  constructor() {
    console.log('🎵 [HoldMusic] Constructing HoldMusicGenerator');
    try {
      // Use a royalty-free smooth jazz track
      this.audio = new Audio('https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3');
      this.audio.loop = true;
      this.audio.volume = 0;
      this.audio.preload = 'auto';
      
      // Add event listeners for debugging
      this.audio.addEventListener('loadstart', () => console.log('🎵 [HoldMusic] Audio loading started'));
      this.audio.addEventListener('loadeddata', () => console.log('🎵 [HoldMusic] Audio data loaded'));
      this.audio.addEventListener('canplay', () => console.log('🎵 [HoldMusic] Audio can play'));
      this.audio.addEventListener('error', (e) => {
        console.error('❌ [HoldMusic] Audio error event:', e);
        console.error('❌ [HoldMusic] Audio error code:', this.audio?.error?.code);
        console.error('❌ [HoldMusic] Audio error message:', this.audio?.error?.message);
      });
      this.audio.addEventListener('play', () => console.log('🎵 [HoldMusic] Audio play event fired'));
      this.audio.addEventListener('pause', () => console.log('🎵 [HoldMusic] Audio pause event fired'));
      
      console.log('✅ [HoldMusic] Audio element created successfully');
      console.log('🎵 [HoldMusic] Audio src:', this.audio.src);
      console.log('🎵 [HoldMusic] Audio ready state:', this.audio.readyState);
    } catch (error) {
      console.error('❌ [HoldMusic] Failed to create audio element:', error);
    }
  }

  async play() {
    console.log('🎵 [HoldMusic] play() called');
    console.log('🎵 [HoldMusic] Current state - isPlaying:', this.isPlaying, 'hasAudio:', !!this.audio);
    
    if (this.isPlaying || !this.audio) {
      console.log('⚠️ [HoldMusic] Hold music already playing or no audio element');
      return;
    }

    console.log('🎵 [HoldMusic] Starting hold music playback...');
    console.log('🎵 [HoldMusic] Audio readyState:', this.audio.readyState);
    console.log('🎵 [HoldMusic] Audio networkState:', this.audio.networkState);
    console.log('🎵 [HoldMusic] Audio paused:', this.audio.paused);
    console.log('🎵 [HoldMusic] Audio src:', this.audio.src);
    
    try {
      // Start playing
      console.log('🎵 [HoldMusic] Calling audio.play()...');
      const playPromise = this.audio.play();
      console.log('🎵 [HoldMusic] play() returned promise:', playPromise);
      
      await playPromise;
      console.log('✅ [HoldMusic] play() promise resolved successfully');
      
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
          console.log('✅ [HoldMusic] Fade in complete, volume:', this.audio.volume);
        }
      }, stepDuration);

      console.log('✅ [HoldMusic] Hold music playing and fading in');
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
    console.log('🎵 [HoldMusic] stop() called');
    console.log('🎵 [HoldMusic] Current state - isPlaying:', this.isPlaying, 'hasAudio:', !!this.audio);
    
    if (!this.isPlaying || !this.audio) {
      console.log('⚠️ [HoldMusic] Not playing or no audio element');
      return;
    }

    console.log('🎵 [HoldMusic] Stopping hold music...');
    
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
        console.log('✅ [HoldMusic] Hold music stopped and faded out');
      }
    }, stepDuration);
  }

  cleanup() {
    console.log('🧹 [HoldMusic] cleanup() called');
    this.stop();
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
      console.log('✅ [HoldMusic] Audio element cleaned up');
    }
  }
}
