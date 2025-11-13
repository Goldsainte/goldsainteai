export default function NotificationsPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Notifications</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-muted-foreground">No new notifications</p>
      </div>
    </div>
  );
}
