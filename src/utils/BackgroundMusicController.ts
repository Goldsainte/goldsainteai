/**
 * BackgroundMusicController - Manages continuous soft background music
 * Works across Chrome & Safari with iOS-specific optimizations
 */
export class BackgroundMusicController {
  private audio: HTMLAudioElement;
  private target = 0.1;
  private fadeMs = 700;
  private armed = false;

  constructor(url: string) {
    console.log('[BGMusic] Initializing with URL:', url);
    this.audio = document.createElement("audio");
    this.audio.src = url;
    this.audio.loop = true;
    this.audio.preload = "auto";
    this.audio.volume = 0;
    this.audio.setAttribute("playsinline", "true");
    this.audio.setAttribute("webkit-playsinline", "true");
    
    // Attach to DOM for iOS reliability
    this.audio.style.display = "none";
    document.body.appendChild(this.audio);

    // Handle tab visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        console.log('[BGMusic] Tab hidden, fading out');
        this.fadeTo(0);
      } else {
        console.log('[BGMusic] Tab visible, fading in');
        this.fadeTo(this.target);
      }
    });
  }

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
      console.warn("[BGMusic] ⚠️ Arming failed:", e);
      this.armed = false;
    }
  }

  async start() {
    console.log('[BGMusic] start() called');
    try {
      await this.audio.play();
      await this.fadeTo(this.target);
      console.log("[BGMusic] ✅ Playing");
    } catch (e: any) {
      console.error('[BGMusic] ❌ Play failed:', e);
      if (e?.name === "NotAllowedError") {
        console.log('[BGMusic] Dispatching bgmusic-needs-gesture event');
        window.dispatchEvent(new CustomEvent("bgmusic-needs-gesture"));
      } else {
        console.warn("[BGMusic] play failed:", e);
      }
    }
  }

  stop() {
    console.log('[BGMusic] stop() called');
    this.fadeTo(0).then(() => {
      this.audio.pause();
      this.audio.currentTime = 0;
      console.log('[BGMusic] ✅ Stopped');
    });
  }

  private async fadeTo(v: number) {
    const steps = 10;
    const d = this.fadeMs / steps;
    const delta = (v - this.audio.volume) / steps;
    for (let i = 0; i < steps; i++) {
      this.audio.volume = Math.max(0, Math.min(1, this.audio.volume + delta));
      await new Promise(r => setTimeout(r, d));
    }
    this.audio.volume = v;
  }
}
