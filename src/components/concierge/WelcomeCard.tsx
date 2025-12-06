import { Sparkles } from "lucide-react";

interface WelcomeCardProps {
  onDismiss: () => void;
  onPromptClick: (prompt: string) => void;
  onStartVoice?: () => void;
}

export const WelcomeCard = ({ onDismiss, onPromptClick, onStartVoice }: WelcomeCardProps) => {
  return (
    <div className="text-center py-8 animate-fade-in">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#F6F0E4] mb-4">
        <Sparkles className="h-4 w-4 text-[#C7A962]" />
      </div>
      <h3 className="font-secondary text-xl text-[#0a2225] mb-2">Madison</h3>
      <p className="text-sm text-[#6B7280] mb-6">Where would you like to go?</p>
      
      {onStartVoice && (
        <button
          onClick={() => {
            onStartVoice();
            onDismiss();
          }}
          className="text-xs text-[#C7A962] hover:text-[#B39952] transition-colors underline underline-offset-2"
        >
          Try voice
        </button>
      )}
    </div>
  );
};
