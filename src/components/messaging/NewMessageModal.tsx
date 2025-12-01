import { useState } from "react";
import { Send, Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useNavigate } from "react-router-dom";

interface NewMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
}

export function NewMessageModal({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: NewMessageModalProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { sendMessage } = useDirectMessages();
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage(recipientId, message.trim());
      
      toast({
        title: "Message sent",
        description: result.isNewConversation
          ? "Your message request has been sent"
          : "Your message has been delivered",
      });

      if (result.contentFiltered) {
        toast({
          title: "Content filtered",
          description: "Some contact information was removed to keep communication on-platform",
          variant: "destructive",
        });
      }

      setMessage("");
      onOpenChange(false);
      
      // Navigate to conversation
      navigate(`/messages?conversation=${result.conversationId}`);
    } catch (e: any) {
      toast({
        title: "Failed to send",
        description: e.message || "Could not send your message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-secondary">
            Message {recipientName}
          </DialogTitle>
          <DialogDescription>
            Start a conversation. Your message will be sent as a request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={2000}
          />

          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>
              For your safety, all communication stays on Goldsainte. Phone numbers,
              emails, and external links are automatically filtered.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="bg-primary"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
