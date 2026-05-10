import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Users, ExternalLink, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface CollabRequest {
  id: string;
  trip_title: string;
  proposal_text: string;
  compensation: string | null;
  status: string;
  created_at: string;
  estimated_revenue: number;
  actual_revenue: number;
  trip_story_id: string | null;
  package_id: string | null;
  creator: {
    username: string;
    avatar_url: string | null;
    tiktok_username: string | null;
  } | null;
  trip_story: {
    id: string;
    title: string;
    tiktok_post_id: string | null;
  } | null;
  package: {
    id: string;
    title: string;
    status: string;
  } | null;
}

interface AgentCreatorCollabsProps {
  collabRequests: CollabRequest[];
  agentId: string;
  onRefresh: () => void;
}

export function AgentCreatorCollabs({ collabRequests, agentId, onRefresh }: AgentCreatorCollabsProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<any>(null);
  const [formData, setFormData] = useState({
    tripTitle: "",
    proposal: "",
    compensation: "",
    estimatedRevenue: "",
  });
  const [stats, setStats] = useState<{
    totalDeals: number;
    pendingDeals: number;
    activeDeals: number;
    totalRevenue: number;
    recentDeals: any[];
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke('agent-deals-stats', {
        body: {}
      });
      
      if (!error && data) {
        setStats(data);
      } else {
        console.error('Error loading stats:', error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const searchCreators = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, tiktok_username')
      .or(`username.ilike.%${query}%,tiktok_username.ilike.%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
  };

  const handleInviteCreator = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCreator) {
      toast.error("Please select a creator");
      return;
    }

    try {
      const { error } = await supabase
        .from('creator_collab_requests')
        .insert({
          agent_id: agentId,
          creator_id: selectedCreator.id,
          trip_title: formData.tripTitle,
          proposal_text: formData.proposal,
          compensation: formData.compensation || null,
          estimated_revenue: parseFloat(formData.estimatedRevenue) || 0,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Collaboration invite sent!");
      setInviteDialogOpen(false);
      setFormData({ tripTitle: "", proposal: "", compensation: "", estimatedRevenue: "" });
      setSelectedCreator(null);
      setSearchQuery("");
      setSearchResults([]);
      onRefresh();
      loadStats();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invite');
    }
  };

  const updateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('creator_collab_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(`Status updated to ${newStatus}`);
      onRefresh();
      loadStats();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#FDF9F0] text-[#C7A962] border-[#C7A962]/30';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'live': return 'bg-[#F0F7F6] text-[#0c4d47] border-[#0c4d47]/20';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalDeals}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold mt-1">{stats.pendingDeals}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#C7A962]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#C7A962]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold mt-1">{stats.activeDeals}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold mt-1">${stats.totalRevenue.toFixed(0)}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-[#0c4d47]/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#0c4d47]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invite Creator Button */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto">
            <Sparkles className="mr-2 h-4 w-4" />
            Invite Creator to Collaborate
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Creator to Collaborate</DialogTitle>
            <DialogDescription>
              Send a collaboration proposal to a TikTok creator to co-create a new trip package
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInviteCreator} className="space-y-4">
            {/* Creator Search */}
            <div className="space-y-2">
              <Label>Search Creator</Label>
              <Input
                placeholder="Search by username or TikTok handle..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchCreators(e.target.value);
                }}
              />
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((creator) => (
                    <button
                      key={creator.id}
                      type="button"
                      onClick={() => {
                        setSelectedCreator(creator);
                        setSearchQuery(creator.username);
                        setSearchResults([]);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                    >
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.username} className="h-full w-full object-cover" loading="lazy"/>
                        ) : (
                          <Users className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{creator.username}</div>
                        {creator.tiktok_username && (
                          <div className="text-xs text-muted-foreground">@{creator.tiktok_username}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedCreator && (
                <div className="p-3 border rounded-md bg-muted/50 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center overflow-hidden">
                    {selectedCreator.avatar_url ? (
                      <img src={selectedCreator.avatar_url} alt={selectedCreator.username} className="h-full w-full object-cover" loading="lazy"/>
                    ) : (
                      <Users className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{selectedCreator.username}</div>
                    {selectedCreator.tiktok_username && (
                      <div className="text-xs text-muted-foreground">@{selectedCreator.tiktok_username}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip-title">Trip Title *</Label>
              <Input
                id="trip-title"
                placeholder="e.g., 7-Day Iceland Adventure"
                value={formData.tripTitle}
                onChange={(e) => setFormData({ ...formData, tripTitle: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal">Proposal *</Label>
              <Textarea
                id="proposal"
                placeholder="Describe the trip concept, why you think this creator would be a great fit, and what you're offering..."
                value={formData.proposal}
                onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compensation">Compensation Offer</Label>
              <Input
                id="compensation"
                placeholder="e.g., 40% commission or $2,500 flat fee"
                value={formData.compensation}
                onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">Estimated Revenue</Label>
              <Input
                id="revenue"
                type="number"
                placeholder="0"
                value={formData.estimatedRevenue}
                onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value })}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setInviteDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Collaboration Requests List */}
      {collabRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collaborations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start inviting TikTok creators to co-create amazing trip packages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {collabRequests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{request.trip_title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {request.creator?.avatar_url ? (
                            <img src={request.creator.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy"/>
                          ) : (
                            <Users className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span>{request.creator?.username || 'Unknown'}</span>
                        {request.creator?.tiktok_username && (
                          <span className="text-xs">@{request.creator.tiktok_username}</span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Proposal</div>
                    <p className="text-sm text-muted-foreground">{request.proposal_text}</p>
                  </div>

                  {request.compensation && (
                    <div>
                      <div className="text-sm font-medium mb-1">Compensation</div>
                      <p className="text-sm text-muted-foreground">{request.compensation}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm">
                    {request.estimated_revenue > 0 && (
                      <div>
                        <span className="text-muted-foreground">Est. Revenue:</span>{" "}
                        <span className="font-medium">${request.estimated_revenue.toLocaleString()}</span>
                      </div>
                    )}
                    {request.actual_revenue > 0 && (
                      <div>
                        <span className="text-muted-foreground">Actual Revenue:</span>{" "}
                        <span className="font-medium">${request.actual_revenue.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {request.trip_story_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/trip/${request.trip_story_id}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View TikTok Story
                      </Button>
                    )}
                    {request.package_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/package/${request.package_id}`, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View Package
                      </Button>
                    )}
                    {request.status === 'accepted' && !request.trip_story_id && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(request.id, 'live')}
                      >
                        Mark as Live
                      </Button>
                    )}
                    {request.status === 'live' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateStatus(request.id, 'completed')}
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
