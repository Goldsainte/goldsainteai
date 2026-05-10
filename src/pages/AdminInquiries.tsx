import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, MessageSquare, User, Clock } from "lucide-react";
import { format } from "date-fns";

interface Inquiry {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  inquiry_source: string;
  conversation_data: any;
  status: string;
  priority: string;
  created_at: string;
  assigned_agent_id: string | null;
  ai_match_score: number | null;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

interface DisputeSubmission {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  booking_reference: string | null;
  dispute_type: string;
  description: string;
  preferred_contact_method: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function AdminInquiries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [disputes, setDisputes] = useState<DisputeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data, error } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (error || !data) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to view this page.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch inquiries
      const { data: inquiriesData, error: inquiriesError } = await supabase
        .from('agent_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (inquiriesError) throw inquiriesError;
      setInquiries(inquiriesData || []);

      // Fetch all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get emails from auth.users via edge function or direct query
      const profilesWithEmails = profilesData || [];
      setUsers(profilesWithEmails as any);

      // Fetch dispute submissions
      const { data: disputesData, error: disputesError } = await supabase
        .from('dispute_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (disputesError) throw disputesError;
      setDisputes(disputesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInquiryStatus = async (inquiryId: string, newStatus: string) => {
    const { error } = await supabase
      .from('agent_inquiries')
      .update({ 
        status: newStatus,
        contacted_at: newStatus === 'contacted' ? new Date().toISOString() : undefined
      })
      .eq('id', inquiryId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Inquiry status updated.",
    });
    fetchData();
  };

  const updateDisputeStatus = async (disputeId: string, newStatus: string) => {
    const { error } = await supabase
      .from('dispute_submissions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', disputeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update dispute status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Dispute status updated.",
    });
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#C7A962]';
      case 'contacted': return 'bg-[#0c4d47]';
      case 'converted': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-serif font-bold mb-8 font-secondary">Admin Dashboard</h1>

        <Tabs defaultValue="inquiries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="inquiries">
              Agent Inquiries ({inquiries.length})
            </TabsTrigger>
            <TabsTrigger value="disputes">
              Dispute Submissions ({disputes.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              All Users ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Contact Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <Card key={inquiry.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-semibold">{inquiry.guest_name}</span>
                                <Badge className={getPriorityColor(inquiry.priority)}>
                                  {inquiry.priority}
                                </Badge>
                                <Badge className={getStatusColor(inquiry.status)}>
                                  {inquiry.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {inquiry.guest_email}
                                </div>
                                {inquiry.guest_phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {inquiry.guest_phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(inquiry.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3" />
                                Source: {inquiry.inquiry_source}
                                {inquiry.ai_match_score && (
                                  <span className="ml-2">• AI Match Score: {inquiry.ai_match_score.toFixed(2)}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {inquiry.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateInquiryStatus(inquiry.id, 'contacted')}
                                >
                                  Mark Contacted
                                </Button>
                              )}
                              {inquiry.status === 'contacted' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateInquiryStatus(inquiry.id, 'converted')}
                                >
                                  Mark Converted
                                </Button>
                              )}
                            </div>
                          </div>
                          {inquiry.conversation_data && Object.keys(inquiry.conversation_data).length > 0 && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm font-semibold mb-2">Conversation Details:</p>
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(inquiry.conversation_data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    {inquiries.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No inquiries yet.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Registered Users</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-2">
                    {users.map((profile) => (
                      <Card key={profile.id} className="border">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">
                                {profile.first_name || ''} {profile.last_name || ''}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Joined: {format(new Date(profile.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {users.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No users found.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dispute Resolution Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {disputes.map((dispute) => (
                      <Card key={dispute.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-semibold">{dispute.name}</span>
                                <Badge className={getStatusColor(dispute.status)}>
                                  {dispute.status}
                                </Badge>
                                <Badge variant="outline">{dispute.dispute_type}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {dispute.email}
                                </div>
                                {dispute.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {dispute.phone}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(dispute.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              </div>
                              {dispute.booking_reference && (
                                <p className="text-xs text-muted-foreground">
                                  Booking Ref: {dispute.booking_reference}
                                </p>
                              )}
                              {dispute.preferred_contact_method && (
                                <p className="text-xs text-muted-foreground">
                                  Preferred Contact: {dispute.preferred_contact_method}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {dispute.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateDisputeStatus(dispute.id, 'under_review')}
                                  >
                                    Start Review
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDisputeStatus(dispute.id, 'closed')}
                                  >
                                    Close
                                  </Button>
                                </>
                              )}
                              {dispute.status === 'under_review' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => updateDisputeStatus(dispute.id, 'resolved')}
                                  >
                                    Mark Resolved
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateDisputeStatus(dispute.id, 'escalated')}
                                  >
                                    Escalate
                                  </Button>
                                </>
                              )}
                              {dispute.status === 'escalated' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateDisputeStatus(dispute.id, 'resolved')}
                                >
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <p className="text-sm font-semibold mb-2">Description:</p>
                            <p className="text-sm whitespace-pre-wrap">{dispute.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {disputes.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No dispute submissions yet.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}