import { getEdgeFunctionUrl, SUPABASE_URL } from "@/lib/backendConfig";

export class AudioRecorder {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext();
      
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        this.onAudioData(new Float32Array(inputData));
      };
      
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw error;
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export class RealtimeVoiceChat {
  private pc: RTCPeerConnection | null = null;
  public dc: RTCDataChannel | null = null; // Made public to allow sending tool results
  public audioEl: HTMLAudioElement;
  private recorder: AudioRecorder | null = null;

  constructor(
    private onMessage: (message: any) => void,
    private onStatusChange: (status: string) => void
  ) {
    this.audioEl = document.createElement("audio");
    this.audioEl.autoplay = true;
  }

  async init(getSessionToken: () => Promise<{ token: string; expiresAt?: number }>) {
    try {
      this.onStatusChange('connecting');
      
      // Get ephemeral token (string) - with safety fallback
      const tokenResponse: any = await getSessionToken();
      // Support multiple response formats
      const EPHEMERAL_KEY = 
        tokenResponse.token || 
        tokenResponse.client_secret?.value || 
        tokenResponse?.value;
      
      const expiresAt = tokenResponse.expiresAt || tokenResponse.client_secret?.expires_at;
      
      if (!EPHEMERAL_KEY || typeof EPHEMERAL_KEY !== 'string' || EPHEMERAL_KEY.length < 20) {
        console.error("❌ Bad ephemeral token (redacted)");
        throw new Error("Voice config error: missing/invalid ephemeral token");
      }
      
      
      // Optional: basic expiry guard (tokens are ~60s)
      if (expiresAt && Date.now() > expiresAt - 10_000) {
        console.warn("⚠️ Ephemeral token close to expiry; consider re-fetching");
      }

      // Create peer connection with STUN
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      // Connection state logging
      this.pc.onicegatheringstatechange = () =>
              this.pc.oniceconnectionstatechange = () =>
              this.pc.onsignalingstatechange = () =>
              this.pc.onconnectionstatechange = () =>
        
      // Set up remote audio
      this.audioEl.setAttribute('playsInline', 'true');
      this.pc.ontrack = (e) => {
                this.audioEl.srcObject = e.streams[0];
        const p = this.audioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err: any) => {
            console.warn("Autoplay blocked, need user gesture to unmute:", err?.name);
            this.onStatusChange('needs-user-gesture');
          });
        }
      };

      // Add local audio track (no 24kHz constraint)
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      const localTrack = ms.getTracks()[0];
      this.pc.addTrack(localTrack, ms);

      // Ensure we also receive audio
      this.pc.addTransceiver('audio', { direction: 'sendrecv' });

      // Set up data channel for events
      this.dc = this.pc.createDataChannel("oai-events");
      
      this.dc.addEventListener("message", (e) => {
        const event = JSON.parse(e.data);
                this.onMessage(event);
      });

      this.dc.addEventListener("open", () => {
                this.onStatusChange('connected');
      });

      this.dc.addEventListener("close", () => {
                this.onStatusChange('disconnected');
      });

      // Create offer
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
      });
      await this.pc.setLocalDescription(offer);

      // Wait for ICE gathering complete
      await new Promise<void>((resolve) => {
        if (this.pc!.iceGatheringState === "complete") return resolve();
        const check = () => {
          if (this.pc!.iceGatheringState === "complete") {
            this.pc!.removeEventListener("icegatheringstatechange", check as any);
            resolve();
          }
        };
        this.pc!.addEventListener("icegatheringstatechange", check as any);
        setTimeout(resolve, 2000); // Safety timeout
      });

      // ---- POST SDP via Supabase relay
      // Validate environment and token before posting
      if (!SUPABASE_URL) {
        console.error("❌ Backend URL is not set");
        throw new Error("Voice config error: backend URL not configured");
      }

      const relayUrl = getEdgeFunctionUrl("realtime-sdp-relay");
      
      if (!EPHEMERAL_KEY || typeof EPHEMERAL_KEY !== "string" || EPHEMERAL_KEY.length < 20) {
        console.error("❌ Bad ephemeral token before SDP post (redacted)");
        throw new Error("Voice config error: missing/invalid ephemeral token");
      }

                  const model = "gpt-4o-realtime-preview-2024-12-17";
      
      let relayResponse: Response;
      try {
        relayResponse = await fetch(relayUrl, {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sdp: this.pc.localDescription?.sdp,
            token: EPHEMERAL_KEY,
            model,
          }),
        });
      } catch (e) {
        console.error("❌ Relay fetch threw (network/CORS):", e);
        throw new Error("Failed to fetch (network/CORS) while posting SDP to relay.");
      }

      if (!relayResponse.ok) {
        const errorBody = await relayResponse.text().catch(() => "<no body>");
        console.error(`❌ Relay returned error ${relayResponse.status}:`, errorBody);
        throw new Error(`Relay error ${relayResponse.status}: ${errorBody}`);
      }

      const answerSdp = await relayResponse.text();
            
      if (!answerSdp.startsWith("v=")) {
        console.warn("Relay returned unexpected content:", answerSdp.slice(0, 80));
      }
      await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
            
    } catch (error) {
      console.error("Error initializing voice chat:", error);
      this.onStatusChange('error');
      throw error;
    }
  }

  disconnect() {
        this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioEl.srcObject = null;
    this.onStatusChange('disconnected');
  }
}
