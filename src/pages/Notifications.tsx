import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, Heart, MessageCircle, UserPlus, Tag, Users, Gift, Package, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata: any;
  link: string | null;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'like': return <Heart className="h-5 w-5 text-red-500" />;
    case 'comment': return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'follow': return <UserPlus className="h-5 w-5 text-green-500" />;
    case 'tag': return <Tag className="h-5 w-5 text-purple-500" />;
    case 'collaboration_invite': return <Users className="h-5 w-5 text-indigo-500" />;
    case 'collaboration_accepted': return <Check className="h-5 w-5 text-green-500" />;
    case 'partnership_request': return <Package className="h-5 w-5 text-amber-500" />;
    case 'partnership_approved': return <Check className="h-5 w-5 text-green-500" />;
    case 'partnership_rejected': return <Trash2 className="h-5 w-5 text-red-500" />;
    case 'moment_reply': return <MessageCircle className="h-5 w-5 text-blue-500" />;
    case 'direct_message': return <MessageCircle className="h-5 w-5 text-primary" />;
    case 'virtual_gift': return <Gift className="h-5 w-5 text-accent" />;
    case 'tier_upgrade': return <Megaphone className="h-5 w-5 text-accent" />;
    default: return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
    } else {
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    } else {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Notifications</CardTitle>
                {unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:bg-accent/5 ${
                    notification.is_read ? 'bg-background opacity-70' : 'bg-accent/10 border-accent/50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
