import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function MessagesPanel() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Messages</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">Your messages will appear here</p>
          <Button onClick={() => navigate("/messages")}>
            Go to Messages
          </Button>
        </div>
      </div>
    </div>
  );
}
