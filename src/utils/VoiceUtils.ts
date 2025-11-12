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
  private dc: RTCDataChannel | null = null;
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
      console.log("Initializing voice chat…");

      // Get ephemeral token (string)
      const { token: EPHEMERAL_KEY, expiresAt } = await getSessionToken();
      
      if (!EPHEMERAL_KEY || typeof EPHEMERAL_KEY !== 'string') {
        throw new Error("Failed to get ephemeral token string");
      }
      
      console.log(`Ephemeral token acquired: ${EPHEMERAL_KEY.slice(0, 10)}...${EPHEMERAL_KEY.slice(-4)}`);
      
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
        console.log("ICE gathering:", this.pc?.iceGatheringState);
      this.pc.oniceconnectionstatechange = () =>
        console.log("ICE connection:", this.pc?.iceConnectionState);
      this.pc.onsignalingstatechange = () =>
        console.log("Signaling:", this.pc?.signalingState);
      this.pc.onconnectionstatechange = () =>
        console.log("Peer connection:", this.pc?.connectionState);

      // Set up remote audio
      this.audioEl.setAttribute('playsInline', 'true');
      this.pc.ontrack = (e) => {
        console.log("Received remote audio track");
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
        console.log("Received event:", event.type);
        this.onMessage(event);
      });

      this.dc.addEventListener("open", () => {
        console.log("Data channel opened");
        this.onStatusChange('connected');
      });

      this.dc.addEventListener("close", () => {
        console.log("Data channel closed");
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

      // Connect to OpenAI's Realtime API (SDP POST)
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      console.log("Posting SDP to OpenAI…");
      let sdpResponse: Response;
      try {
        sdpResponse = await fetch(`${baseUrl}?model=${encodeURIComponent(model)}`, {
          method: "POST",
          mode: "cors",
          cache: "no-store",
          headers: {
            "Authorization": `Bearer ${EPHEMERAL_KEY}`,
            "Content-Type": "application/sdp",
            "Accept": "application/sdp",
          },
          body: this.pc.localDescription?.sdp,
        });
      } catch (e) {
        console.error("❌ SDP POST network error:", e);
        throw new Error("Failed to fetch (network/CORS) while posting SDP. Check headers and token.");
      }

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text().catch(() => "<no body>");
        console.error(`❌ OpenAI SDP handshake failed: ${sdpResponse.status}`, errorText);
        
        // Specific error messages for common status codes
        if (sdpResponse.status === 401) {
          throw new Error(`Authentication failed (401): Invalid or expired token. ${errorText}`);
        } else if (sdpResponse.status === 403) {
          throw new Error(`Access forbidden (403): Check API key permissions. ${errorText}`);
        } else if (sdpResponse.status === 429) {
          throw new Error(`Rate limited (429): Too many requests. ${errorText}`);
        } else {
          throw new Error(`OpenAI connection failed (${sdpResponse.status}): ${errorText}`);
        }
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      console.log("✅ WebRTC connected to OpenAI Realtime");

    } catch (error) {
      console.error("Error initializing voice chat:", error);
      this.onStatusChange('error');
      throw error;
    }
  }

  disconnect() {
    console.log("Disconnecting voice chat...");
    this.recorder?.stop();
    this.dc?.close();
    this.pc?.close();
    this.audioEl.srcObject = null;
    this.onStatusChange('disconnected');
  }
}
