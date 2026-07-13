import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NOTIFICATION_ICONS: Record<string, string> = {
  like: '❤️',
  comment: '💬',
  follow: '👤',
  tag: '🏷️',
  collaboration_invite: '🤝',
  collaboration_accepted: '✅',
  partnership_request: '💼',
  partnership_approved: '✅',
  partnership_rejected: '❌',
  moment_reply: '💬',
  moment_interaction: '⭐',
  message_received: '✉️',
  verification: '🛡️',
  new_proposal: '📋',
  proposal_accepted: '✅',
  proposal_declined: '❌',
  tier_upgrade: '🏆',
};

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  // Stored notification links may be absolute URLs (e.g.
  // "https://goldsainte.ai/contract/<id>/sign"). react-router treats absolute
  // URLs as relative segments and mangles them into /notifications/https:/...
  // — so same-origin links are converted to their path before navigating, and
  // genuinely external links leave via the browser instead of the router.
  const openNotificationLink = (raw: string) => {
    try {
      if (/^https?:\/\//i.test(raw)) {
        const url = new URL(raw);
        if (url.origin === window.location.origin) {
          navigate(url.pathname + url.search + url.hash);
        } else {
          window.location.assign(raw);
        }
        return;
      }
      navigate(raw.startsWith("/") ? raw : `/${raw}`);
    } catch {
      /* malformed link — stay put rather than 404 */
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      openNotificationLink(notification.action_url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">
                      {NOTIFICATION_ICONS[notification.type] || '📢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message || 'New notification'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
