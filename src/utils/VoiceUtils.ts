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
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.audioContext = new AudioContext({
        sampleRate: 24000,
      });
      
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
  private audioEl: HTMLAudioElement;
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
      console.log("Initializing voice chat...");

      // Get ephemeral token (string), not the whole session JSON
      const { token: EPHEMERAL_KEY, expiresAt } = await getSessionToken();
      
      if (!EPHEMERAL_KEY || typeof EPHEMERAL_KEY !== 'string') {
        throw new Error("Failed to get ephemeral token string");
      }
      
      console.log(`Ephemeral token acquired: ${EPHEMERAL_KEY.slice(0, 10)}...${EPHEMERAL_KEY.slice(-4)}`);
      
      // Optional: basic expiry guard (tokens are ~60s)
      if (expiresAt && Date.now() > expiresAt - 10_000) {
        console.warn("⚠️ Ephemeral token close to expiry; consider re-fetching");
      }

      // Create peer connection
      this.pc = new RTCPeerConnection();

      // Set up remote audio
      this.pc.ontrack = e => {
        console.log("Received audio track");
        this.audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const ms = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      this.pc.addTrack(ms.getTracks()[0]);

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

      // Create and set local description
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Connect to OpenAI's Realtime API (SDP POST)
      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";
      
      console.log("Connecting to OpenAI Realtime API with SDP…");
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
            "Cache-Control": "no-store",
          },
          body: offer.sdp,
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

      // Verify response Content-Type
      const contentType = sdpResponse.headers.get("Content-Type");
      if (contentType && !contentType.includes("application/sdp")) {
        console.warn(`⚠️ Unexpected Content-Type: ${contentType} (expected application/sdp)`);
      }

      const answerSdp = await sdpResponse.text();
      await this.pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
      console.log("✅ WebRTC connection established with Realtime API");

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
