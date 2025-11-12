import { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DiagnosticsData {
  permissionStatus: PermissionState | 'unknown';
  wakeWordStatus: 'active' | 'inactive' | 'unsupported' | 'error';
  wakeWordError?: string;
  browserSupport: {
    speechRecognition: boolean;
    mediaDevices: boolean;
    webRTC: boolean;
  };
  microphoneDevices: MediaDeviceInfo[];
  voiceConnectionState: RTCPeerConnectionState | 'disconnected';
  holdMusicStatus: 'playing' | 'paused' | 'blocked' | 'error';
  logs: { timestamp: string; level: 'info' | 'warn' | 'error'; message: string }[];
}

interface VoiceDiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voiceChatRef: any;
  wakeWordDetectorRef: any;
  holdMusicRef: any;
}

export const VoiceDiagnosticsPanel = ({ 
  isOpen, 
  onClose,
  voiceChatRef,
  wakeWordDetectorRef,
  holdMusicRef 
}: VoiceDiagnosticsPanelProps) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData>({
    permissionStatus: 'unknown',
    wakeWordStatus: 'inactive',
    browserSupport: {
      speechRecognition: false,
      mediaDevices: false,
      webRTC: false,
    },
    microphoneDevices: [],
    voiceConnectionState: 'disconnected',
    holdMusicStatus: 'paused',
    logs: [],
  });

  useEffect(() => {
    if (!isOpen) return;

    const updateDiagnostics = async () => {
      // Check browser support
      const speechRecognition = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      const mediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      const webRTC = 'RTCPeerConnection' in window;

      // Check microphone permission
      let permissionStatus: PermissionState | 'unknown' = 'unknown';
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        permissionStatus = result.state;
      } catch (e) {
        console.warn('Cannot query microphone permission', e);
      }

      // Get microphone devices
      let micDevices: MediaDeviceInfo[] = [];
      if (mediaDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          micDevices = devices.filter(d => d.kind === 'audioinput');
        } catch (e) {
          console.warn('Cannot enumerate devices', e);
        }
      }

      // Check wake word status
      let wakeWordStatus: 'active' | 'inactive' | 'unsupported' | 'error' = 'inactive';
      if (!speechRecognition) {
        wakeWordStatus = 'unsupported';
      } else if (wakeWordDetectorRef.current) {
        wakeWordStatus = 'active';
      }

      // Check voice connection state
      const voiceConnectionState = voiceChatRef.current?.pc?.connectionState || 'disconnected';

      // Check hold music status
      let holdMusicStatus: 'playing' | 'paused' | 'blocked' | 'error' = 'paused';
      if (holdMusicRef.current) {
        if (holdMusicRef.current.isPlaying) {
          holdMusicStatus = 'playing';
        }
      }

      setDiagnostics({
        permissionStatus,
        wakeWordStatus,
        browserSupport: {
          speechRecognition,
          mediaDevices,
          webRTC,
        },
        microphoneDevices: micDevices,
        voiceConnectionState,
        holdMusicStatus,
        logs: [],
      });
    };

    updateDiagnostics();
    const interval = setInterval(updateDiagnostics, 1000);

    return () => clearInterval(interval);
  }, [isOpen, voiceChatRef, wakeWordDetectorRef, holdMusicRef]);

  if (!isOpen) return null;

  const StatusIcon = ({ status }: { status: 'good' | 'warning' | 'error' }) => {
    if (status === 'good') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Voice System Diagnostics
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser Support */}
          <div>
            <h3 className="font-semibold mb-2">Browser Support</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span>Speech Recognition (Wake Word)</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={diagnostics.browserSupport.speechRecognition ? 'good' : 'error'} />
                  <Badge variant={diagnostics.browserSupport.speechRecognition ? 'default' : 'destructive'}>
                    {diagnostics.browserSupport.speechRecognition ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Media Devices (Microphone)</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={diagnostics.browserSupport.mediaDevices ? 'good' : 'error'} />
                  <Badge variant={diagnostics.browserSupport.mediaDevices ? 'default' : 'destructive'}>
                    {diagnostics.browserSupport.mediaDevices ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>WebRTC (Voice Chat)</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={diagnostics.browserSupport.webRTC ? 'good' : 'error'} />
                  <Badge variant={diagnostics.browserSupport.webRTC ? 'default' : 'destructive'}>
                    {diagnostics.browserSupport.webRTC ? 'Supported' : 'Not Supported'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Microphone Permission */}
          <div>
            <h3 className="font-semibold mb-2">Microphone Permission</h3>
            <div className="flex items-center gap-2">
              <StatusIcon status={
                diagnostics.permissionStatus === 'granted' ? 'good' : 
                diagnostics.permissionStatus === 'prompt' ? 'warning' : 'error'
              } />
              <Badge variant={
                diagnostics.permissionStatus === 'granted' ? 'default' : 
                diagnostics.permissionStatus === 'prompt' ? 'secondary' : 'destructive'
              }>
                {diagnostics.permissionStatus.toUpperCase()}
              </Badge>
            </div>
            {diagnostics.permissionStatus === 'denied' && (
              <p className="text-xs text-destructive mt-2">
                Please allow microphone access in your browser settings to use voice features.
              </p>
            )}
          </div>

          {/* Microphone Devices */}
          <div>
            <h3 className="font-semibold mb-2">Microphone Devices</h3>
            {diagnostics.microphoneDevices.length > 0 ? (
              <ul className="text-sm space-y-1">
                {diagnostics.microphoneDevices.map((device, i) => (
                  <li key={device.deviceId} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {device.label || `Microphone ${i + 1}`}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No microphone devices found</p>
            )}
          </div>

          {/* Wake Word Status */}
          <div>
            <h3 className="font-semibold mb-2">Wake Word Detection</h3>
            <div className="flex items-center gap-2">
              <StatusIcon status={
                diagnostics.wakeWordStatus === 'active' ? 'good' : 
                diagnostics.wakeWordStatus === 'unsupported' ? 'error' : 'warning'
              } />
              <Badge variant={
                diagnostics.wakeWordStatus === 'active' ? 'default' : 
                diagnostics.wakeWordStatus === 'unsupported' ? 'destructive' : 'secondary'
              }>
                {diagnostics.wakeWordStatus.toUpperCase()}
              </Badge>
            </div>
            {diagnostics.wakeWordStatus === 'unsupported' && (
              <p className="text-xs text-destructive mt-2">
                iOS Safari does not support wake word detection. Use the microphone button instead.
              </p>
            )}
          </div>

          {/* Voice Connection */}
          <div>
            <h3 className="font-semibold mb-2">Voice Connection State</h3>
            <Badge variant={diagnostics.voiceConnectionState === 'connected' ? 'default' : 'secondary'}>
              {diagnostics.voiceConnectionState.toUpperCase()}
            </Badge>
          </div>

          {/* Hold Music */}
          <div>
            <h3 className="font-semibold mb-2">Hold Music</h3>
            <Badge variant={diagnostics.holdMusicStatus === 'playing' ? 'default' : 'secondary'}>
              {diagnostics.holdMusicStatus.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
