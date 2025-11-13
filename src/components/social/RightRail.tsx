import { useAuth } from "@/contexts/AuthContext";

export default function RightRail() {
  const { user } = useAuth();

  return (
    <div className="sticky top-8 space-y-6">
      {user && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div>
            <p className="font-semibold text-sm">{user.email?.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground">Active now</p>
          </div>
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground">Suggested for you</h3>
          <button className="text-xs font-semibold">See All</button>
        </div>
        
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <p className="text-sm font-semibold">traveler_{i}</p>
                <p className="text-xs text-muted-foreground">Suggested for you</p>
              </div>
              <button className="text-xs font-semibold text-primary">Follow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
