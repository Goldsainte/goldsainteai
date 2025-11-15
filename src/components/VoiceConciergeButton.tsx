import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function VoiceConciergeButton() {
  const { toast } = useToast();

  const handleVoiceClick = () => {
    toast({
      title: "Voice Concierge",
      description: "Voice AI assistant coming soon. Describe your dream trip and let Goldsainte AI curate the perfect match.",
    });
  };

  return (
    <Button
      onClick={handleVoiceClick}
      variant="outline"
      className="rounded-full border-[#BFAD72]/60 bg-black/40 text-xs text-[#E5DFC6] hover:bg-black/70 px-4 py-2 gap-2"
    >
      <Mic className="h-4 w-4 text-[#BFAD72]" />
      <span className="hidden md:inline">Voice concierge</span>
    </Button>
  );
}
