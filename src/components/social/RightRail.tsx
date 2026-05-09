export default function RightRail() {
  // plug your real suggested accounts API
  const suggestions: { id: string; name: string; username: string; avatar: string }[] = [];

  return (
    <div className="sticky top-0">
      <div className="text-sm text-muted-foreground">Suggested for you</div>
      <div className="mt-3 space-y-3">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <img src={s.avatar} className="w-9 h-9 rounded-full" alt="" loading="lazy"/>
            <div className="min-w-0">
              <div className="font-medium leading-tight truncate">{s.username}</div>
              <div className="text-xs text-muted-foreground truncate">{s.name}</div>
            </div>
            <button className="ml-auto text-xs text-primary">Follow</button>
          </div>
        ))}
      </div>
      {/* footer links */}
      <div className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Goldsainte
      </div>
    </div>
  );
}
