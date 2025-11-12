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
    this.audio = new Audio(url);
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;

    // Handle tab visibility changes
    document.addEventListener("visibilitychange", () => {
      this.visible = document.visibilityState === "visible";
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
    if (this.armed) return;
    this.armed = true;
    try {
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
    } catch {
      console.warn("[BGMusic] Waiting for user gesture");
    }
  }

  /**
   * Start playing background music with fade-in
   */
  async start() {
    if (!this.armed) await this.arm();
    try {
      await this.audio.play();
      this.fadeIn();
    } catch (e: any) {
      if (e.name === "NotAllowedError") {
        window.dispatchEvent(new CustomEvent("bgmusic-needs-gesture"));
      }
    }
  }

  /**
   * Stop background music with fade-out
   */
  stop() {
    this.fadeOut().then(() => {
      this.audio.pause();
      this.audio.currentTime = 0;
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
  }
}
