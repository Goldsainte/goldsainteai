import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Loader2, DollarSign, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

export default function CommissionDashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCommission: 0,
    totalStripeFees: 0,
    netProfit: 0,
    bookingCount: 0,
    avgCommissionPerBooking: 0
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    loadCommissionData();
  }, [user, authLoading, navigate]);

  // Allow admins full access to commission data

  const loadCommissionData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, guests(*)')
        .eq('status', 'confirmed')
        .not('commission_earned', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBookings(data || []);

      // Calculate stats
      const totalRevenue = data?.reduce((sum, b) => sum + parseFloat(String(b.total_price || 0)), 0) || 0;
      const totalCommission = data?.reduce((sum, b) => sum + parseFloat(String(b.commission_earned || 0)), 0) || 0;
      const totalStripeFees = data?.reduce((sum, b) => sum + parseFloat(String(b.stripe_fee || 0)), 0) || 0;
      const netProfit = data?.reduce((sum, b) => sum + parseFloat(String(b.net_profit || 0)), 0) || 0;
      const bookingCount = data?.length || 0;

      setStats({
        totalRevenue,
        totalCommission,
        totalStripeFees,
        netProfit,
        bookingCount,
        avgCommissionPerBooking: bookingCount > 0 ? netProfit / bookingCount : 0
      });
    } catch (error) {
      console.error('Error loading commission data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Commission Dashboard</h1>
          <p className="text-muted-foreground">Track your earnings and booking performance</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">From {stats.bookingCount} bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Gross Commission</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">${stats.totalCommission.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">15% markup</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Stripe Fees</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">-${stats.totalStripeFees.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Processing fees</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">${stats.netProfit.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Avg ${stats.avgCommissionPerBooking.toFixed(2)}/booking</p>
                </CardContent>
              </Card>
            </div>

            {/* Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No commission earnings yet. Start booking to see your earnings here!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary">{booking.booking_reference}</Badge>
                              <Badge>{booking.booking_type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {booking.guests?.first_name} {booking.guests?.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(booking.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">${parseFloat(booking.total_price).toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">Customer Paid</div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Base Cost</div>
                            <div className="font-semibold">${parseFloat(booking.base_cost || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Markup (15%)</div>
                            <div className="font-semibold text-green-600">+${parseFloat(booking.markup_amount || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Stripe Fee</div>
                            <div className="font-semibold text-red-600">-${parseFloat(booking.stripe_fee || 0).toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs mb-1">Net Profit</div>
                            <div className="font-bold text-primary">${parseFloat(booking.net_profit || 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}