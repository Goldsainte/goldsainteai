import { Separator } from "@/components/ui/separator";

type Notification = {
  id: string;
  kind: "like" | "comment" | "follow";
  actor: { name: string; avatar: string };
  text: string;
  ts: string;
};

export default function NotificationsPanel() {
  // wire to your notifications API
  const items: Notification[] = []; // useQuery(...)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4">
        <h2 className="text-2xl font-bold">Notifications</h2>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No notifications yet</p>
        ) : (
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 p-3 hover:bg-muted/40">
                <img src={n.actor.avatar} alt="" className="w-9 h-9 rounded-full" />
                <div className="text-sm">
                  <span className="font-medium">{n.actor.name}</span>{" "}
                  <span className="text-muted-foreground">{n.text}</span>
                  <div className="text-xs text-muted-foreground">{n.ts}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
