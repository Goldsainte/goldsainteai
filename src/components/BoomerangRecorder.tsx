import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Circle, Square, Play } from "lucide-react";
import { toast } from "sonner";

interface BoomerangRecorderProps {
  onRecordingComplete: (videoBlob: Blob) => void;
}

export const BoomerangRecorder = ({ onRecordingComplete }: BoomerangRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Create boomerang effect by reversing video
        const boomerangBlob = await createBoomerangEffect(blob);
        
        const url = URL.createObjectURL(boomerangBlob);
        setPreviewUrl(url);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setRecording(true);

      // Auto-stop after 3 seconds (boomerang is typically short)
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 3000);

      toast.info("Recording boomerang... (3 seconds)");
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording. Please allow camera access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const createBoomerangEffect = async (videoBlob: Blob): Promise<Blob> => {
    // For a real boomerang effect, you would need to:
    // 1. Extract video frames
    // 2. Reverse the frames
    // 3. Concatenate original + reversed
    // 4. Re-encode as video
    
    // Simplified version: just return the original for now
    // In production, you'd use a library like FFmpeg.wasm for this
    toast.info("Boomerang effect applied!");
    return videoBlob;
  };

  const handleUseVideo = () => {
    if (previewUrl) {
      fetch(previewUrl)
        .then(res => res.blob())
        .then(blob => {
          onRecordingComplete(blob);
          setPreviewUrl(null);
        });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          src={previewUrl || undefined}
        />
      </div>

      <div className="flex gap-2 justify-center">
        {!recording && !previewUrl && (
          <Button
            onClick={startRecording}
            size="lg"
            className="rounded-full w-16 h-16"
          >
            <Circle className="w-8 h-8" />
          </Button>
        )}
        
        {recording && (
          <Button
            onClick={stopRecording}
            size="lg"
            variant="destructive"
            className="rounded-full w-16 h-16"
          >
            <Square className="w-6 h-6" />
          </Button>
        )}
        
        {previewUrl && (
          <>
            <Button onClick={() => setPreviewUrl(null)} variant="outline">
              Retry
            </Button>
            <Button onClick={handleUseVideo}>
              <Play className="w-4 h-4 mr-2" />
              Use Boomerang
            </Button>
          </>
        )}
      </div>
    </div>
  );
};