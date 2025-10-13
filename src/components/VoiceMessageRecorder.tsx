import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VoiceMessageRecorderProps {
  onSend: (voiceUrl: string, duration: number) => void;
}

export const VoiceMessageRecorder = ({ onSend }: VoiceMessageRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const recordDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
        setDuration(recordDuration);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      toast.info("Recording voice message...");
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Failed to start recording. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioBlob) return;

    try {
      // Upload to Supabase Storage
      const fileName = `voice-${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, audioBlob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(fileName);

      onSend(publicUrl, duration);
      setAudioBlob(null);
      setDuration(0);
      toast.success("Voice message sent!");
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast.error("Failed to send voice message");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!recording && !audioBlob && (
        <Button
          size="icon"
          variant="ghost"
          onClick={startRecording}
          className="rounded-full"
        >
          <Mic className="w-5 h-5" />
        </Button>
      )}
      
      {recording && (
        <Button
          size="icon"
          variant="destructive"
          onClick={stopRecording}
          className="rounded-full animate-pulse"
        >
          <Square className="w-5 h-5" />
        </Button>
      )}
      
      {audioBlob && (
        <>
          <audio src={URL.createObjectURL(audioBlob)} controls className="h-10" />
          <Button
            size="icon"
            variant="default"
            onClick={sendVoiceMessage}
            className="rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </>
      )}
    </div>
  );
};