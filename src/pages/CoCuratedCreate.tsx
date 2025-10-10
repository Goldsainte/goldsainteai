import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, MapPin, Users, DollarSign, ImageIcon, 
  FileText, Settings, Sparkles, ArrowLeft, ArrowRight, Save,
  Plus, Trash2, Upload, Video, Check
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function CoCuratedCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [agentId, setAgentId] = useState<string | null>(null);

  // Step 1: Trip Basics
  const [packageName, setPackageName] = useState("");
  const [tripType, setTripType] = useState("group");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [brandHandle, setBrandHandle] = useState("");
  const [agentAccreditation, setAgentAccreditation] = useState("");
  
  // Step 2: Trip Details & Itinerary
  const [destination, setDestination] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableUntil, setAvailableUntil] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [itineraryDays, setItineraryDays] = useState<Array<{
    day: number;
    title: string;
    description: string;
    activities: string;
    meals: string[];
    accommodation: string;
    isFeatured: boolean;
  }>>([{ day: 1, title: "", description: "", activities: "", meals: [], accommodation: "", isFeatured: false }]);

  // Step 3: Inclusions & Exclusions
  const [inclusions, setInclusions] = useState<string[]>(["", "", ""]);
  const [exclusions, setExclusions] = useState<string[]>(["", "", ""]);
  const [upgradeOptions, setUpgradeOptions] = useState<Array<{ name: string; price: string }>>([]);
  const [minGroupSize, setMinGroupSize] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");

  // Step 4: Pricing & Payment
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesaleCost, setWholesaleCost] = useState("");
  const [depositPercentage, setDepositPercentage] = useState("30");
  const [paymentPlanType, setPaymentPlanType] = useState("deposit_final");
  const [paymentMilestones, setPaymentMilestones] = useState<Array<{
    name: string;
    percentage: string;
    daysBeforeTrip: string;
  }>>([]);
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [agentCommission, setAgentCommission] = useState("40");
  const [influencerCommission, setInfluencerCommission] = useState("40");

  // Step 5: Media & Branding
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [creatorVideoUrl, setCreatorVideoUrl] = useState("");
  const [hashtags, setHashtags] = useState("");

  // Step 6: Booking Settings
  const [bookingDeadlineDays, setBookingDeadlineDays] = useState("7");
  const [bookingApprovalType, setBookingApprovalType] = useState("auto");
  const [minSignupsToConfirm, setMinSignupsToConfirm] = useState("");

  // Step 7: Legal & Disclaimers
  const [waiverText, setWaiverText] = useState("");
  const [travelRequirements, setTravelRequirements] = useState("");
  const [emergencyContactRequired, setEmergencyContactRequired] = useState(true);
  const [termsConditions, setTermsConditions] = useState("");

  // Step 8: Marketing Copy
  const [whyThisTrip, setWhyThisTrip] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [idealFor, setIdealFor] = useState("");
  const [highlights, setHighlights] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    fetchAgentId();
  }, []);

  const fetchAgentId = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('travel_agents')
      .select('id')
      .eq('user_id', user.id)
      .single();
    if (data) setAgentId(data.id);
  };

  const totalSteps = 8;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const calculateMargin = () => {
    const retail = parseFloat(retailPrice) || 0;
    const wholesale = parseFloat(wholesaleCost) || 0;
    const margin = retail - wholesale;
    const agentCom = margin * (parseFloat(agentCommission) / 100);
    const influencerCom = margin * (parseFloat(influencerCommission) / 100);
    const platformFee = margin * (20 / 100);
    return { margin, agentCom, influencerCom, platformFee };
  };

  const addItineraryDay = () => {
    const newDay = itineraryDays.length + 1;
    setItineraryDays([...itineraryDays, { 
      day: newDay, 
      title: "", 
      description: "", 
      activities: "", 
      meals: [], 
      accommodation: "", 
      isFeatured: false 
    }]);
  };

  const saveDraft = async () => {
    if (!agentId) {
      toast.error('Please sign in as an agent');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agent_packages')
        .insert({
          agent_id: agentId,
          package_name: packageName,
          description,
          destination,
          duration_days: parseInt(duration) || 0,
          retail_price: parseFloat(retailPrice) || 0,
          wholesale_cost: parseFloat(wholesaleCost) || 0,
          agent_commission_percentage: parseFloat(agentCommission),
          influencer_commission_percentage: parseFloat(influencerCommission),
          status: 'draft',
          trip_type: tripType,
          min_group_size: parseInt(minGroupSize) || null,
          max_participants: parseInt(maxParticipants) || null,
          inclusions: inclusions.filter(i => i.trim()),
          exclusions: exclusions.filter(e => e.trim()),
          available_from: availableFrom || null,
          available_until: availableUntil || null,
          deposit_percentage: parseFloat(depositPercentage),
          payment_plan_type: paymentPlanType,
          cancellation_policy: cancellationPolicy,
          refund_policy: refundPolicy,
          booking_deadline_days: parseInt(bookingDeadlineDays),
          booking_approval_type: bookingApprovalType,
          min_signups_to_confirm: parseInt(minSignupsToConfirm) || null,
          why_this_trip: whyThisTrip,
          agent_notes: agentNotes,
          ideal_for: idealFor,
          highlights: highlights.filter(h => h.trim()),
          cover_image_url: coverImageUrl,
          creator_video_url: creatorVideoUrl,
          hashtags: hashtags.split(',').map(h => h.trim()).filter(h => h),
          waiver_text: waiverText,
          travel_requirements: travelRequirements,
          emergency_contact_required: emergencyContactRequired,
          terms_conditions: termsConditions,
        });

      if (error) throw error;
      toast.success('Draft saved successfully!');
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast.error(error.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!agentId) {
      toast.error('Please sign in as an agent');
      return;
    }

    if (!packageName || !destination || !duration || !retailPrice || !wholesaleCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { data: packageData, error: packageError } = await supabase
        .from('agent_packages')
        .insert({
          agent_id: agentId,
          package_name: packageName,
          description,
          destination,
          duration_days: parseInt(duration),
          retail_price: parseFloat(retailPrice),
          wholesale_cost: parseFloat(wholesaleCost),
          agent_commission_percentage: parseFloat(agentCommission),
          influencer_commission_percentage: parseFloat(influencerCommission),
          status: 'pending',
          trip_type: tripType,
          min_group_size: parseInt(minGroupSize) || null,
          max_participants: parseInt(maxParticipants) || null,
          inclusions: inclusions.filter(i => i.trim()),
          exclusions: exclusions.filter(e => e.trim()),
          available_from: availableFrom || null,
          available_until: availableUntil || null,
          deposit_percentage: parseFloat(depositPercentage),
          payment_plan_type: paymentPlanType,
          cancellation_policy: cancellationPolicy,
          refund_policy: refundPolicy,
          booking_deadline_days: parseInt(bookingDeadlineDays),
          booking_approval_type: bookingApprovalType,
          min_signups_to_confirm: parseInt(minSignupsToConfirm) || null,
          why_this_trip: whyThisTrip,
          agent_notes: agentNotes,
          ideal_for: idealFor,
          highlights: highlights.filter(h => h.trim()),
          cover_image_url: coverImageUrl,
          creator_video_url: creatorVideoUrl,
          hashtags: hashtags.split(',').map(h => h.trim()).filter(h => h),
          waiver_text: waiverText,
          travel_requirements: travelRequirements,
          emergency_contact_required: emergencyContactRequired,
          terms_conditions: termsConditions,
        })
        .select()
        .single();

      if (packageError) throw packageError;

      // Insert itinerary days
      if (itineraryDays.length > 0) {
        const itineraryInserts = itineraryDays
          .filter(day => day.title.trim())
          .map(day => ({
            package_id: packageData.id,
            day_number: day.day,
            title: day.title,
            description: day.description,
            activities: { items: day.activities.split(',').map(a => a.trim()).filter(a => a) },
            meals_included: day.meals,
            accommodation: day.accommodation,
            is_featured_day: day.isFeatured,
          }));

        if (itineraryInserts.length > 0) {
          await supabase.from('package_itinerary').insert(itineraryInserts);
        }
      }

      // Insert payment milestones if any
      if (paymentMilestones.length > 0) {
        const milestoneInserts = paymentMilestones
          .filter(m => m.name.trim())
          .map((m, idx) => ({
            package_id: packageData.id,
            milestone_number: idx + 1,
            milestone_name: m.name,
            amount_percentage: parseFloat(m.percentage),
            due_days_before_trip: parseInt(m.daysBeforeTrip),
          }));

        if (milestoneInserts.length > 0) {
          await supabase.from('package_payment_milestones').insert(milestoneInserts);
        }
      }

      toast.success('CoCurated™ trip created successfully! Pending review.');
      navigate('/cocurated-dashboard');
    } catch (error: any) {
      console.error('Error creating package:', error);
      toast.error(error.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStepContent = () => {
    const { margin, agentCom, influencerCom, platformFee } = calculateMargin();

    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trip Owner & Collaborator Info
              </CardTitle>
              <CardDescription>Define who's creating this trip and how commissions are split</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Trip Title *</Label>
                <Input
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Luxury Bali Wellness Retreat"
                  required
                />
              </div>

              <div>
                <Label>Trip Type *</Label>
                <Select value={tripType} onValueChange={setTripType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group Trip</SelectItem>
                    <SelectItem value="private">Private Trip</SelectItem>
                    <SelectItem value="retreat">Retreat</SelectItem>
                    <SelectItem value="couple">Couple/Honeymoon</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="luxury">Luxury Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Brand Name / Handle (Creator)</Label>
                <Input
                  value={brandHandle}
                  onChange={(e) => setBrandHandle(e.target.value)}
                  placeholder="@wanderlust_adventures"
                />
              </div>

              <div>
                <Label>Agent IATA / Accreditation</Label>
                <Input
                  value={agentAccreditation}
                  onChange={(e) => setAgentAccreditation(e.target.value)}
                  placeholder="IATA #12345678"
                />
              </div>

              <div>
                <Label>Invite Collaborator (Optional)</Label>
                <Input
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="influencer@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Invite an influencer to co-create this trip</p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-base">Commission Split</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm">Agent %</Label>
                    <Input
                      type="number"
                      value={agentCommission}
                      onChange={(e) => setAgentCommission(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Influencer %</Label>
                    <Input
                      type="number"
                      value={influencerCommission}
                      onChange={(e) => setInfluencerCommission(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Platform takes 20% of margin</p>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Trip Details & Itinerary
              </CardTitle>
              <CardDescription>Describe the destination, dates, and day-by-day activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Destination *</Label>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Bali, Indonesia"
                    required
                  />
                </div>
                <div>
                  <Label>Duration (Days) *</Label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="7"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Available From</Label>
                  <Input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Available Until</Label>
                  <Input
                    type="date"
                    value={availableUntil}
                    onChange={(e) => setAvailableUntil(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Trip Description *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="An unforgettable journey through paradise..."
                  rows={4}
                  required
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base">Day-by-Day Itinerary</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                    <Plus className="h-4 w-4 mr-1" /> Add Day
                  </Button>
                </div>

                <div className="space-y-4">
                  {itineraryDays.map((day, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">Day {day.day}</Badge>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={day.isFeatured}
                            onCheckedChange={(checked) => {
                              const updated = [...itineraryDays];
                              updated[index].isFeatured = checked as boolean;
                              setItineraryDays(updated);
                            }}
                          />
                          <span className="text-sm">Featured Day</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="Day Title"
                          value={day.title}
                          onChange={(e) => {
                            const updated = [...itineraryDays];
                            updated[index].title = e.target.value;
                            setItineraryDays(updated);
                          }}
                        />
                        <Textarea
                          placeholder="Day Description"
                          value={day.description}
                          onChange={(e) => {
                            const updated = [...itineraryDays];
                            updated[index].description = e.target.value;
                            setItineraryDays(updated);
                          }}
                          rows={2}
                        />
                        <Input
                          placeholder="Activities (comma-separated)"
                          value={day.activities}
                          onChange={(e) => {
                            const updated = [...itineraryDays];
                            updated[index].activities = e.target.value;
                            setItineraryDays(updated);
                          }}
                        />
                        <Input
                          placeholder="Accommodation"
                          value={day.accommodation}
                          onChange={(e) => {
                            const updated = [...itineraryDays];
                            updated[index].accommodation = e.target.value;
                            setItineraryDays(updated);
                          }}
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Inclusions & Exclusions
              </CardTitle>
              <CardDescription>What's included in the price and what's not</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Included in Price</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInclusions([...inclusions, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {inclusions.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const updated = [...inclusions];
                          updated[index] = e.target.value;
                          setInclusions(updated);
                        }}
                        placeholder="e.g., 5-star hotel, daily breakfast, airport transfer"
                      />
                      {inclusions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setInclusions(inclusions.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Not Included</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setExclusions([...exclusions, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {exclusions.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => {
                          const updated = [...exclusions];
                          updated[index] = e.target.value;
                          setExclusions(updated);
                        }}
                        placeholder="e.g., International flights, travel insurance, tips"
                      />
                      {exclusions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setExclusions(exclusions.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Upgrade Options (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeOptions([...upgradeOptions, { name: "", price: "" }])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Upgrade
                  </Button>
                </div>
                <div className="space-y-2">
                  {upgradeOptions.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        className="flex-1"
                        value={option.name}
                        onChange={(e) => {
                          const updated = [...upgradeOptions];
                          updated[index].name = e.target.value;
                          setUpgradeOptions(updated);
                        }}
                        placeholder="Upgrade name"
                      />
                      <Input
                        type="number"
                        className="w-32"
                        value={option.price}
                        onChange={(e) => {
                          const updated = [...upgradeOptions];
                          updated[index].price = e.target.value;
                          setUpgradeOptions(updated);
                        }}
                        placeholder="Price"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setUpgradeOptions(upgradeOptions.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Group Size</Label>
                  <Input
                    type="number"
                    value={minGroupSize}
                    onChange={(e) => setMinGroupSize(e.target.value)}
                    placeholder="4"
                    min="1"
                  />
                </div>
                <div>
                  <Label>Maximum Participants</Label>
                  <Input
                    type="number"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    placeholder="12"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Payment Plan
              </CardTitle>
              <CardDescription>Set pricing, deposits, and commission structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Wholesale Cost (Backend) *</Label>
                  <Input
                    type="number"
                    value={wholesaleCost}
                    onChange={(e) => setWholesaleCost(e.target.value)}
                    placeholder="3500"
                    required
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">What you pay suppliers</p>
                </div>
                <div>
                  <Label>Retail Price (Per Person) *</Label>
                  <Input
                    type="number"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(e.target.value)}
                    placeholder="5000"
                    required
                    step="0.01"
                  />
                  <p className="text-xs text-muted-foreground mt-1">What customers pay</p>
                </div>
              </div>

              {margin > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Margin:</span>
                    <span className="text-primary font-bold">${margin.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Agent Commission ({agentCommission}%):</span>
                    <span>${agentCom.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Influencer Commission ({influencerCommission}%):</span>
                    <span>${influencerCom.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span>Platform Fee (20%):</span>
                    <span className="text-muted-foreground">${platformFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div>
                <Label>Deposit Percentage</Label>
                <Input
                  type="number"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value)}
                  placeholder="30"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-muted-foreground mt-1">% of total price required as deposit</p>
              </div>

              <div>
                <Label>Payment Plan Type</Label>
                <Select value={paymentPlanType} onValueChange={setPaymentPlanType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit_final">Deposit + Final Payment</SelectItem>
                    <SelectItem value="monthly">Monthly Installments</SelectItem>
                    <SelectItem value="milestone">Milestone-Based</SelectItem>
                    <SelectItem value="full_upfront">Full Payment Upfront</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentPlanType === 'milestone' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Payment Milestones</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentMilestones([...paymentMilestones, { name: "", percentage: "", daysBeforeTrip: "" }])}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Milestone
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {paymentMilestones.map((milestone, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          className="flex-1"
                          value={milestone.name}
                          onChange={(e) => {
                            const updated = [...paymentMilestones];
                            updated[index].name = e.target.value;
                            setPaymentMilestones(updated);
                          }}
                          placeholder="Milestone name"
                        />
                        <Input
                          type="number"
                          className="w-24"
                          value={milestone.percentage}
                          onChange={(e) => {
                            const updated = [...paymentMilestones];
                            updated[index].percentage = e.target.value;
                            setPaymentMilestones(updated);
                          }}
                          placeholder="%"
                        />
                        <Input
                          type="number"
                          className="w-32"
                          value={milestone.daysBeforeTrip}
                          onChange={(e) => {
                            const updated = [...paymentMilestones];
                            updated[index].daysBeforeTrip = e.target.value;
                            setPaymentMilestones(updated);
                          }}
                          placeholder="Days before"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setPaymentMilestones(paymentMilestones.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label>Cancellation Policy</Label>
                <Textarea
                  value={cancellationPolicy}
                  onChange={(e) => setCancellationPolicy(e.target.value)}
                  placeholder="Free cancellation up to 30 days before departure..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Refund Policy</Label>
                <Textarea
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  placeholder="Full refund if canceled 30+ days before, 50% if 15-29 days..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media & Branding
              </CardTitle>
              <CardDescription>Upload photos, videos, and set hashtags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Cover Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Main banner image for the trip</p>
              </div>

              <div>
                <Label>Creator Video / Welcome Message URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={creatorVideoUrl}
                    onChange={(e) => setCreatorVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Optional video introduction</p>
              </div>

              <div>
                <Label>Hashtags</Label>
                <Input
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="#luxury, #wellness, #bali, #retreat"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated hashtags for search & social</p>
              </div>

              <div className="p-4 border-2 border-dashed rounded-lg text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload additional gallery images (up to 15)</p>
                <Button type="button" variant="outline" size="sm" className="mt-2">
                  Choose Files
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Booking Settings
              </CardTitle>
              <CardDescription>Configure how bookings are handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Booking Deadline (Days Before Trip)</Label>
                <Input
                  type="number"
                  value={bookingDeadlineDays}
                  onChange={(e) => setBookingDeadlineDays(e.target.value)}
                  placeholder="7"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Last day customers can book</p>
              </div>

              <div>
                <Label>Booking Approval Type</Label>
                <Select value={bookingApprovalType} onValueChange={setBookingApprovalType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic Confirmation</SelectItem>
                    <SelectItem value="manual">Manual Approval Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Minimum Sign-Ups to Confirm Trip</Label>
                <Input
                  type="number"
                  value={minSignupsToConfirm}
                  onChange={(e) => setMinSignupsToConfirm(e.target.value)}
                  placeholder="6"
                  min="1"
                />
                <p className="text-xs text-muted-foreground mt-1">Trip will be confirmed once this many travelers book</p>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Legal, Insurance & Disclaimers
              </CardTitle>
              <CardDescription>Important legal and safety information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Waiver / Release Form Text</Label>
                <Textarea
                  value={waiverText}
                  onChange={(e) => setWaiverText(e.target.value)}
                  placeholder="By booking this trip, I acknowledge..."
                  rows={4}
                />
              </div>

              <div>
                <Label>COVID / Travel Health Requirements</Label>
                <Textarea
                  value={travelRequirements}
                  onChange={(e) => setTravelRequirements(e.target.value)}
                  placeholder="Valid passport, proof of vaccination, travel insurance..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={emergencyContactRequired}
                  onCheckedChange={(checked) => setEmergencyContactRequired(checked as boolean)}
                />
                <Label className="font-normal">Require emergency contact information from travelers</Label>
              </div>

              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={termsConditions}
                  onChange={(e) => setTermsConditions(e.target.value)}
                  placeholder="Full terms and conditions for this trip..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Trip Story & Marketing Copy
              </CardTitle>
              <CardDescription>Sell the experience and connect with travelers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>"Why This Trip" Section</Label>
                <Textarea
                  value={whyThisTrip}
                  onChange={(e) => setWhyThisTrip(e.target.value)}
                  placeholder="This isn't just a trip—it's a transformation. Imagine waking up to..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Use the creator's voice to inspire</p>
              </div>

              <div>
                <Label>Agent Notes / Insider Tips</Label>
                <Textarea
                  value={agentNotes}
                  onChange={(e) => setAgentNotes(e.target.value)}
                  placeholder="As a local expert, I recommend visiting in shoulder season..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Ideal For</Label>
                <Input
                  value={idealFor}
                  onChange={(e) => setIdealFor(e.target.value)}
                  placeholder="Honeymooners, solo travelers, wellness seekers"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label>Trip Highlights</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHighlights([...highlights, ""])}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={highlight}
                        onChange={(e) => {
                          const updated = [...highlights];
                          updated[index] = e.target.value;
                          setHighlights(updated);
                        }}
                        placeholder="e.g., Private villa with infinity pool"
                      />
                      {highlights.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setHighlights(highlights.filter((_, i) => i !== index))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl mx-auto py-8 px-4">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">Create CoCurated<span className="text-base align-super">™</span> Trip</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Build your travel package with a comprehensive wizard
              </p>
            </div>
            <Badge variant="outline">
              Step {currentStep} of {totalSteps}
            </Badge>
          </div>

          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Trip Basics</span>
              <span>Details</span>
              <span>Inclusions</span>
              <span>Pricing</span>
              <span>Media</span>
              <span>Booking</span>
              <span>Legal</span>
              <span>Story</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {renderStepContent()}

          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveDraft}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>

              {currentStep < totalSteps ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  Submit for Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}