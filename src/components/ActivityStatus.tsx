import { usePresence } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';

interface ActivityStatusProps {
  userId: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ActivityStatus = ({ 
  userId, 
  showText = false, 
  size = 'sm',
  className 
}: ActivityStatusProps) => {
  const { isUserOnline, getLastSeen } = usePresence();
  const online = isUserOnline(userId);
  const lastSeen = getLastSeen(userId);

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border-2 border-background",
          online ? "bg-green-500" : "bg-muted-foreground/50",
          sizeClasses[size]
        )}
      />
      {showText && (
        <span className="text-xs text-muted-foreground">
          {online ? 'Active now' : lastSeen || 'Offline'}
        </span>
      )}
    </div>
  );
};
