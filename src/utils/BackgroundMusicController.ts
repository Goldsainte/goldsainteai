/**
 * BackgroundMusicController - Manages continuous soft background music
 * Separate from hold music - this plays constantly at low volume
 */
export class BackgroundMusicController {
  private audio: HTMLAudioElement;
  private targetVolume = 0.1;
  private fadeMs = 800;
  private armed = false;
  private visible = true;

  constructor(url: string) {
    console.log('[BGMusic] Initializing with URL:', url);
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;

    // Handle tab visibility changes
    document.addEventListener("visibilitychange", () => {
      this.visible = document.visibilityState === "visible";
      console.log('[BGMusic] Visibility changed:', this.visible);
      if (this.visible) {
        this.fadeIn();
      } else {
        this.fadeOut();
      }
    });
  }

  /**
   * Arm the audio element with a user gesture (required for autoplay)
   */
  async arm() {
    if (this.armed) {
      console.log('[BGMusic] Already armed');
      return;
    }
    console.log('[BGMusic] Attempting to arm...');
    this.armed = true;
    try {
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('[BGMusic] ✅ Armed successfully');
    } catch (e) {
      console.warn("[BGMusic] ⚠️ Arming failed (waiting for user gesture):", e);
      this.armed = false;
    }
  }

  /**
   * Start playing background music with fade-in
   */
  async start() {
    console.log('[BGMusic] start() called, armed:', this.armed);
    if (!this.armed) await this.arm();
    try {
      console.log('[BGMusic] Attempting to play...');
      await this.audio.play();
      console.log('[BGMusic] ✅ Playing, starting fade-in');
      this.fadeIn();
    } catch (e: any) {
      console.error('[BGMusic] ❌ Play failed:', e);
      if (e.name === "NotAllowedError") {
        console.log('[BGMusic] Dispatching bgmusic-needs-gesture event');
        window.dispatchEvent(new CustomEvent("bgmusic-needs-gesture"));
      }
    }
  }

  /**
   * Stop background music with fade-out
   */
  stop() {
    console.log('[BGMusic] stop() called');
    this.fadeOut().then(() => {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('[BGMusic] ✅ Stopped');
    });
  }

  /**
   * Fade in to target volume
   */
  private async fadeIn() {
    const steps = 10;
    const step = this.targetVolume / steps;
    const delay = this.fadeMs / steps;
    
    for (let i = 0; i < steps; i++) {
      this.audio.volume = Math.min(this.audio.volume + step, this.targetVolume);
      await new Promise(r => setTimeout(r, delay));
    }
    console.log('[BGMusic] Fade-in complete, volume:', this.audio.volume);
  }

  /**
   * Fade out to silence
   */
  private async fadeOut() {
    const steps = 10;
    const step = this.audio.volume / steps;
    const delay = this.fadeMs / steps;
    
    for (let i = 0; i < steps; i++) {
      this.audio.volume = Math.max(0, this.audio.volume - step);
      await new Promise(r => setTimeout(r, delay));
    }
    console.log('[BGMusic] Fade-out complete');
  }
}
