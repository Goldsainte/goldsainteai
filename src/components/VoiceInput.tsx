import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Check, X, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'tr', name: 'Turkish' },
];

export const VoiceInput = ({ onTranscript, disabled, language = 'en', onLanguageChange }: VoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];
        
        if (!base64Audio) {
          throw new Error('Failed to convert audio');
        }

        const { data, error } = await supabase.functions.invoke('transcribe-voice', {
          body: { audio: base64Audio, language }
        });

        if (error) throw error;

        if (data?.text) {
          setTranscriptPreview(data.text);
          toast({
            title: 'Transcription Complete',
            description: 'Click the checkmark to use, or X to discard.',
          });
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription Failed',
        description: 'Could not transcribe audio. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (transcriptPreview) {
      onTranscript(transcriptPreview);
      setTranscriptPreview(null);
    }
  };

  const handleDiscard = () => {
    setTranscriptPreview(null);
    toast({
      title: 'Transcription Discarded',
      description: 'You can record again.',
    });
  };

  if (transcriptPreview) {
    return (
      <div className="flex gap-2 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Badge variant="secondary" className="max-w-[200px] truncate text-xs">
                {transcriptPreview}
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[300px] break-words">
            <p className="text-sm">{transcriptPreview}</p>
          </TooltipContent>
        </Tooltip>
        <Button
          type="button"
          size="icon"
          variant="default"
          onClick={handleConfirm}
          className="shrink-0 h-12 w-12 md:h-11 md:w-11 bg-green-600 hover:bg-green-700"
          title="Use this transcription"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={handleDiscard}
          className="shrink-0 h-12 w-12 md:h-11 md:w-11"
          title="Discard and record again"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex gap-1">
      <Button
        type="button"
        size="icon"
        variant={isRecording ? "destructive" : "outline"}
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className="shrink-0 h-12 w-12 md:h-11 md:w-11"
        title={isRecording ? "Stop recording" : `Voice input (${language.toUpperCase()})`}
      >
        {isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      
      {!isRecording && onLanguageChange && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={disabled || isProcessing}
              className="shrink-0 h-12 w-12 md:h-11 md:w-11 px-1"
              title="Change language"
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-[9px] font-mono leading-none">{language.toUpperCase()}</span>
                <ChevronDown className="h-2.5 w-2.5" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto bg-background z-50">
            {LANGUAGES.map((lang) => (
              <DropdownMenuItem
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={language === lang.code ? "bg-accent" : ""}
              >
                <div className="flex items-center justify-between w-full">
                  <span>{lang.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{lang.code.toUpperCase()}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
