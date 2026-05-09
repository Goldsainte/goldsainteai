import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function MessagesPanel() {
  // hook to conversation list
  const conversations: {
    id: string;
    name: string;
    avatar: string;
    last: string;
    unread: boolean;
  }[] = [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Messages</h2>
        <div className="mt-3">
          <Input placeholder="Search messages" />
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No messages yet. Start a conversation!
          </p>
        ) : (
          <ul className="divide-y">
            {conversations.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/40 cursor-pointer"
              >
                <img src={c.avatar} className="w-10 h-10 rounded-full" alt="" loading="lazy"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{c.name}</span>
                    {c.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {c.last}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Separator />
      <div className="p-3">
        <Button className="w-full">New message</Button>
      </div>
    </div>
  );
}
