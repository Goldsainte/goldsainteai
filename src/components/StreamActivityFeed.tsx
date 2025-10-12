import React, { useEffect, useState } from 'react';
import { connect, StreamClient, EnrichedActivity } from 'getstream';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StreamActivityFeed = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<EnrichedActivity[]>([]);
  const [feedClient, setFeedClient] = useState<StreamClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const initFeed = async () => {
      try {
        // Get Stream token
        const { data } = await supabase.functions.invoke('stream-token', {
          body: { userId: user.id },
        });

        if (!data?.apiKey || !data?.token) throw new Error('Failed to get Stream credentials');

        // Initialize Stream client
        const client = connect(data.apiKey, data.token, data.userId);
        setFeedClient(client);

        // Get timeline feed
        const timelineFeed = client.feed('timeline', user.id);
        const response = await timelineFeed.get({ limit: 25 });
        
        setActivities(response.results as EnrichedActivity[]);
        setLoading(false);

        // Subscribe to real-time updates
        await timelineFeed.subscribe((data) => {
          if (data.new) {
            setActivities(prev => [(data.new as any) as EnrichedActivity, ...prev]);
          }
        });
      } catch (error) {
        console.error('Failed to initialize activity feed:', error);
        setLoading(false);
      }
    };

    initFeed();

    return () => {
      if (feedClient) {
        // Cleanup subscriptions
      }
    };
  }, [user]);

  const handleReaction = async (activityId: string, kind: 'like' | 'comment') => {
    if (!feedClient) return;

    try {
      await feedClient.reactions.add(kind, activityId, {}, { userId: user?.id });
      
      // Update local state
      setActivities(prev => prev.map(activity => {
        if (activity.id === activityId) {
          const counts = activity.reaction_counts || {};
          return {
            ...activity,
            reaction_counts: {
              ...counts,
              [kind]: (counts[kind] || 0) + 1
            }
          };
        }
        return activity;
      }));
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="h-20 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-6">
        <TrendingUp className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Activity Feed</h2>
      </div>

      {activities.map((activity) => (
        <Card key={activity.id} className="p-4 hover:bg-accent/50 transition-colors">
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10">
              <img 
                src={(activity.actor as any)?.data?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.actor}`} 
                alt={(activity.actor as any)?.data?.name || 'User'}
                className="rounded-full"
              />
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold">{(activity.actor as any)?.data?.name || 'User'}</span>
                  <span className="text-muted-foreground mx-2">•</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {(activity as any).content && (
                <p className="text-sm mb-3">{(activity as any).content}</p>
              )}

              {(activity as any).image && (
                <img 
                  src={(activity as any).image} 
                  alt="Activity"
                  className="rounded-lg w-full max-h-96 object-cover mb-3"
                />
              )}

              <div className="flex items-center gap-6 text-muted-foreground">
                <button 
                  onClick={() => handleReaction(activity.id, 'like')}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{activity.reaction_counts?.like || 0}</span>
                </button>
                
                <button 
                  onClick={() => handleReaction(activity.id, 'comment')}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{activity.reaction_counts?.comment || 0}</span>
                </button>
                
                <button className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default StreamActivityFeed;
