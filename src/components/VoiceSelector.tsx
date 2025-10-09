import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Volume2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceSelectorProps {
  selectedVoice: string;
  onVoiceSelect: (voice: string) => void;
}

const AVAILABLE_VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced' },
  { id: 'echo', name: 'Echo', description: 'Clear and professional' },
  { id: 'fable', name: 'Fable', description: 'Warm and expressive' },
  { id: 'onyx', name: 'Onyx', description: 'Deep and authoritative' },
  { id: 'nova', name: 'Nova', description: 'Energetic and friendly' },
  { id: 'shimmer', name: 'Shimmer', description: 'Bright and engaging' },
];

export const VoiceSelector = ({ selectedVoice, onVoiceSelect }: VoiceSelectorProps) => {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const { toast } = useToast();

  const previewVoice = async (voiceId: string) => {
    setPlayingVoice(voiceId);
    
    try {
      const sampleText = "Hello! I'm your personalized travel assistant. I'll help you plan amazing trips tailored to your preferences.";
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: sampleText,
          voice: voiceId,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate voice preview');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setPlayingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({
        title: "Preview unavailable",
        description: "Voice preview will be available once you complete setup.",
        variant: "default",
      });
      setPlayingVoice(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-lg font-semibold">Choose Your Agent's Voice</Label>
        <p className="text-sm text-muted-foreground">
          Select a voice that resonates with you. You can preview each one before deciding.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AVAILABLE_VOICES.map((voice) => (
          <Card
            key={voice.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              selectedVoice === voice.id ? 'border-primary border-2 bg-primary/5' : ''
            }`}
            onClick={() => onVoiceSelect(voice.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">{voice.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{voice.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  previewVoice(voice.id);
                }}
                disabled={playingVoice === voice.id}
              >
                <Play className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};