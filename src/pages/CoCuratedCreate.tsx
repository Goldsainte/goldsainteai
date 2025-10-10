import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CoCuratedCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    package_name: "",
    description: "",
    destination: "",
    duration_days: 0,
    wholesale_cost: 0,
    retail_price: 0,
    currency: "USD",
    agent_commission_percentage: 40,
    influencer_commission_percentage: 40,
    platform_fee_percentage: 20,
    available_from: "",
    available_until: "",
    max_participants: 0,
    terms_conditions: "",
  });
  
  const [inclusions, setInclusions] = useState<string[]>([""]);
  const [exclusions, setExclusions] = useState<string[]>([""]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (type: 'inclusion' | 'exclusion') => {
    if (type === 'inclusion') {
      setInclusions([...inclusions, ""]);
    } else {
      setExclusions([...exclusions, ""]);
    }
  };

  const updateItem = (type: 'inclusion' | 'exclusion', index: number, value: string) => {
    if (type === 'inclusion') {
      const updated = [...inclusions];
      updated[index] = value;
      setInclusions(updated);
    } else {
      const updated = [...exclusions];
      updated[index] = value;
      setExclusions(updated);
    }
  };

  const removeItem = (type: 'inclusion' | 'exclusion', index: number) => {
    if (type === 'inclusion') {
      setInclusions(inclusions.filter((_, i) => i !== index));
    } else {
      setExclusions(exclusions.filter((_, i) => i !== index));
    }
  };

  const calculateMargin = () => {
    const margin = formData.retail_price - formData.wholesale_cost;
    const agentCommission = margin * (formData.agent_commission_percentage / 100);
    const influencerCommission = margin * (formData.influencer_commission_percentage / 100);
    const platformFee = margin * (formData.platform_fee_percentage / 100);
    
    return { margin, agentCommission, influencerCommission, platformFee };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get agent_id from travel_agents table
      const { data: agentData, error: agentError } = await supabase
        .from('travel_agents')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (agentError || !agentData) {
        toast.error('You must be a registered travel agent to create packages');
        return;
      }

      const { error } = await supabase
        .from('agent_packages')
        .insert({
          ...formData,
          agent_id: agentData.id,
          inclusions: inclusions.filter(i => i.trim() !== ''),
          exclusions: exclusions.filter(e => e.trim() !== ''),
        });

      if (error) throw error;

      toast.success('CoCurated™ package created successfully!');
      navigate('/cocurated-marketplace');
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast.error(error.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const { margin, agentCommission, influencerCommission, platformFee } = calculateMargin();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">CoCurated™</h1>
          </div>
          <p className="text-sm text-muted-foreground">Create a travel package for influencers to promote with shared commissions</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Package Details</CardTitle>
            <CardDescription>Core information about your travel package</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="package_name">Package Name *</Label>
              <Input
                id="package_name"
                value={formData.package_name}
                onChange={(e) => handleInputChange('package_name', e.target.value)}
                placeholder="Luxury Bali Retreat"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="An unforgettable journey through paradise..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="destination">Destination *</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="Bali, Indonesia"
                  required
                />
              </div>
              <div>
                <Label htmlFor="duration_days">Duration (days) *</Label>
                <Input
                  id="duration_days"
                  type="number"
                  value={formData.duration_days || ''}
                  onChange={(e) => handleInputChange('duration_days', parseInt(e.target.value))}
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="available_from">Available From</Label>
                <Input
                  id="available_from"
                  type="date"
                  value={formData.available_from}
                  onChange={(e) => handleInputChange('available_from', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="available_until">Available Until</Label>
                <Input
                  id="available_until"
                  type="date"
                  value={formData.available_until}
                  onChange={(e) => handleInputChange('available_until', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="max_participants">Max Participants</Label>
              <Input
                id="max_participants"
                type="number"
                value={formData.max_participants || ''}
                onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                min="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Commission */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Commission Split</CardTitle>
            <CardDescription>Set your backend pricing and commission structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="wholesale_cost">Wholesale Cost (Backend) *</Label>
                <Input
                  id="wholesale_cost"
                  type="number"
                  value={formData.wholesale_cost || ''}
                  onChange={(e) => handleInputChange('wholesale_cost', parseFloat(e.target.value))}
                  placeholder="3500"
                  required
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">What you pay suppliers</p>
              </div>
              <div>
                <Label htmlFor="retail_price">Retail Price (Customer Pays) *</Label>
                <Input
                  id="retail_price"
                  type="number"
                  value={formData.retail_price || ''}
                  onChange={(e) => handleInputChange('retail_price', parseFloat(e.target.value))}
                  placeholder="5000"
                  required
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground mt-1">What customers pay</p>
              </div>
            </div>

            {margin > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">Total Margin:</span>
                  <span className="text-primary font-bold">${margin.toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="agent_commission">Your Commission (%)</Label>
                    <span className="text-sm font-semibold">${agentCommission.toFixed(2)}</span>
                  </div>
                  <Input
                    id="agent_commission"
                    type="number"
                    value={formData.agent_commission_percentage}
                    onChange={(e) => handleInputChange('agent_commission_percentage', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="influencer_commission">Influencer Commission (%)</Label>
                    <span className="text-sm font-semibold">${influencerCommission.toFixed(2)}</span>
                  </div>
                  <Input
                    id="influencer_commission"
                    type="number"
                    value={formData.influencer_commission_percentage}
                    onChange={(e) => handleInputChange('influencer_commission_percentage', parseFloat(e.target.value))}
                    min="0"
                    max="100"
                    step="1"
                  />
                </div>

                <div className="flex justify-between text-sm pt-2 border-t">
                  <span>Platform Fee ({formData.platform_fee_percentage}%):</span>
                  <span className="text-muted-foreground">${platformFee.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inclusions & Exclusions */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included & Excluded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Inclusions</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('inclusion')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {inclusions.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateItem('inclusion', index, e.target.value)}
                      placeholder="e.g., 5-star hotel accommodation"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem('inclusion', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Exclusions</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addItem('exclusion')}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {exclusions.map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={item}
                      onChange={(e) => updateItem('exclusion', index, e.target.value)}
                      placeholder="e.g., International flights"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem('exclusion', index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Terms & Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.terms_conditions}
              onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
              placeholder="Cancellation policy, booking requirements, etc."
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creating...' : 'Create CoCurated™ Package'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </div>
      </form>
      </main>
      <Footer />
    </div>
  );
}