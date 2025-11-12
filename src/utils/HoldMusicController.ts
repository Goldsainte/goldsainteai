export class HoldMusicController {
  private audio = new Audio("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3");
  private armed = false;

  constructor() {
    this.audio.loop = true;
    this.audio.volume = 0;
    this.audio.preload = "auto";
  }

  // Call this from a user click once (e.g., when enabling voice)
  async arm() {
    if (this.armed) return;
    this.armed = true;
    try {
      await this.audio.play();
      this.audio.pause();
      this.audio.currentTime = 0;
    } catch {
      // Silently fail if arming doesn't work
    }
  }

  async play(target = 0.15) {
    try {
      const p = this.audio.play();
      await p; // may throw NotAllowedError if not armed
      
      // fade in
      const steps = 12;
      const step = target / steps;
      for (let i = 0; i < steps; i++) {
        this.audio.volume += step;
        await new Promise(r => setTimeout(r, 50));
      }
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        // expose UI: "Tap to unmute music"
        window.dispatchEvent(new CustomEvent("holdmusic-needs-gesture"));
      }
    }
  }

  async stop() {
    const steps = 8;
    const step = this.audio.volume / steps;
    for (let i = 0; i < steps; i++) {
      this.audio.volume = Math.max(0, this.audio.volume - step);
      await new Promise(r => setTimeout(r, 40));
    }
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}
