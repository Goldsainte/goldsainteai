import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LuxuryStepIndicator } from "@/components/onboarding/LuxuryStepIndicator";
import { LuxurySelectionCard } from "@/components/onboarding/LuxurySelectionCard";
import { ProfilePhotoUploader } from "@/pages/traveler/components/ProfilePhotoUploader";
import { DestinationAutocompleteNominatim } from "@/components/preferences/DestinationAutocompleteNominatim";
import { FeaturedPhotosUploader } from "@/components/onboarding/FeaturedPhotosUploader";
import { BrandAlignmentSelector } from "@/components/onboarding/BrandAlignmentSelector";
import { LegalComplianceAcceptance } from "@/components/onboarding/LegalComplianceAcceptance";
import { TikTokVerificationButton } from "@/components/onboarding/TikTokVerificationButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, Camera, Globe, MapPin, Sparkles, CreditCard, 
  TrendingUp, Instagram, Youtube, Video, Shield, 
  MessageCircle, Clock, Wallet, Heart,
  CheckCircle, DollarSign, FileText, Users, Mic,
  Play, BookOpen, ArrowRight, Star, Building2, Image
} from "lucide-react";

const STEPS = [
  { title: "Identity", icon: User },
  { title: "Social", icon: Globe },
  { title: "Niche", icon: Sparkles },
  { title: "Destinations", icon: MapPin },
  { title: "Portfolio", icon: Image },
  { title: "Brands", icon: Building2 },
  { title: "How It Works", icon: BookOpen },
  { title: "Pricing", icon: DollarSign },
  { title: "Commitment", icon: Shield },
  { title: "Safety", icon: Heart },
  { title: "AI Identity", icon: Mic },
  { title: "Legal", icon: FileText },
  { title: "Payment", icon: CreditCard },
];

const TRAVEL_NICHES = [
  { value: "luxury", label: "Luxury & Ultra-Luxury", description: "5-star resorts, private villas, exclusive experiences" },
  { value: "adventure", label: "Adventure & Outdoors", description: "Hiking, diving, safaris, extreme sports" },
  { value: "wellness", label: "Wellness & Spa", description: "Retreats, yoga, meditation, healing journeys" },
  { value: "culinary", label: "Food & Culinary", description: "Fine dining, cooking classes, food tours" },
  { value: "cultural", label: "Culture & History", description: "Museums, architecture, local traditions" },
  { value: "romantic", label: "Romantic & Honeymoons", description: "Couples getaways, proposals, anniversaries" },
  { value: "family", label: "Family Travel", description: "Kid-friendly destinations, multi-gen trips" },
  { value: "solo", label: "Solo Travel", description: "Independent journeys, self-discovery" },
  { value: "design", label: "Design Hotels", description: "Boutique, architectural gems, aesthetic stays" },
  { value: "sustainable", label: "Sustainable Travel", description: "Eco-lodges, conservation, responsible tourism" },
];

const CONTENT_STYLES = [
  { value: "cinematic", label: "Cinematic", description: "High-production, movie-like visuals" },
  { value: "documentary", label: "Documentary", description: "Storytelling, in-depth exploration" },
  { value: "vlog", label: "Vlog-style", description: "Personal, day-in-the-life content" },
  { value: "photo", label: "Photo-focused", description: "Stunning photography, visual inspiration" },
  { value: "guides", label: "Guides & Tips", description: "Practical advice, how-tos, itineraries" },
  { value: "aesthetic", label: "Aesthetic & Mood", description: "Vibes, atmosphere, sensory content" },
];

const BUDGET_LEVELS = [
  { value: "budget", label: "Budget-Friendly", description: "Under $100/day experiences" },
  { value: "mid", label: "Mid-Range", description: "$100-300/day sweet spot" },
  { value: "luxury", label: "Luxury", description: "$300-1000/day experiences" },
  { value: "ultra", label: "Ultra-Luxury", description: "$1000+/day exclusive" },
];

const PLATFORMS = [
  { value: "tiktok", label: "TikTok", icon: Video },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "youtube", label: "YouTube", icon: Youtube },
  { value: "multi", label: "Multi-Platform", icon: Globe },
];

const PRICING_MODELS = [
  { value: "commission_only", label: "Commission Only", description: "I earn when travelers book through my content. No upfront fees.", icon: TrendingUp },
  { value: "planning_fees", label: "Planning Fees", description: "I charge for custom trip planning in addition to commissions.", icon: FileText },
  { value: "custom_itineraries", label: "Custom Itineraries", description: "I sell detailed, bookable itineraries as products.", icon: MapPin },
  { value: "premium_content", label: "Premium Content", description: "I offer exclusive destination guides and premium resources.", icon: Star },
];

const RESPONSE_TIMES = [
  { value: 4, label: "Within 4 hours", description: "Lightning fast responses" },
  { value: 12, label: "Within 12 hours", description: "Same-day responses" },
  { value: 24, label: "Within 24 hours", description: "Next-day responses" },
  { value: 48, label: "Within 48 hours", description: "Flexible timeline" },
];

const AI_TONES = [
  { value: "chic", label: "Chic & Sophisticated", description: "Refined, elegant, understated luxury" },
  { value: "playful", label: "Playful & Adventurous", description: "Fun, energetic, spontaneous vibes" },
  { value: "cinematic", label: "Cinematic & Editorial", description: "Dramatic, visual storytelling" },
  { value: "warm", label: "Warm & Conversational", description: "Friendly, approachable, personal" },
];

const AI_AUDIENCES = [
  { value: "couples", label: "Couples", description: "Romantic travelers" },
  { value: "solo", label: "Solo Travelers", description: "Independent explorers" },
  { value: "families", label: "Families", description: "Parents with kids" },
  { value: "groups", label: "Groups", description: "Friends & celebrations" },
  { value: "luxury_seekers", label: "Luxury Seekers", description: "High-end travelers" },
  { value: "budget_conscious", label: "Budget-Conscious", description: "Value-focused travelers" },
];

const LANGUAGES = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese", 
  "Mandarin", "Japanese", "Korean", "Arabic", "Hindi", "Dutch"
];

export default function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);

  // Step 1: Identity
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [homeBase, setHomeBase] = useState("");

  // Step 2: Social
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [tiktokFollowers, setTiktokFollowers] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3: Niche & Style
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);

  // Step 4: Destinations
  const [destinations, setDestinations] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [travelPov, setTravelPov] = useState("");

  // Step 7: Pricing
  const [pricingModel, setPricingModel] = useState("commission_only");
  const [planningFee, setPlanningFee] = useState("");
  const [itineraryFee, setItineraryFee] = useState("");

  // Step 8: Commitment
  const [responseTime, setResponseTime] = useState(24);
  const [acceptsTransparency, setAcceptsTransparency] = useState(false);

  // Step 9: Safety
  const [acceptsSafetyPolicy, setAcceptsSafetyPolicy] = useState(false);

  // Step 10: AI Identity
  const [aiTone, setAiTone] = useState("");
  const [aiAudiences, setAiAudiences] = useState<string[]>([]);
  const [travelPhilosophy, setTravelPhilosophy] = useState("");

  // NEW: Portfolio
  const [featuredPhotos, setFeaturedPhotos] = useState<string[]>([]);

  // NEW: Brand Alignment
  const [preferredBrandTiers, setPreferredBrandTiers] = useState<string[]>([]);
  const [preferredHotelBrands, setPreferredHotelBrands] = useState<string[]>([]);
  const [aestheticAlignment, setAestheticAlignment] = useState<string[]>([]);

  // NEW: Legal Compliance
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [creatorAgreementAccepted, setCreatorAgreementAccepted] = useState(false);
  const [transparencyAccepted, setTransparencyAccepted] = useState(false);

  // NEW: TikTok Verification
  const [tiktokVerified, setTiktokVerified] = useState(false);
  const [verifiedFollowerCount, setVerifiedFollowerCount] = useState<number | undefined>();

  // Stripe setup tracking
  const [stripeSetupStarted, setStripeSetupStarted] = useState(false);

  // Check for TikTok OAuth callback and existing Stripe setup
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const tiktokSuccess = searchParams.get("tiktok_verified");
    const followers = searchParams.get("followers");
    
    if (tiktokSuccess === "true" && followers) {
      setTiktokVerified(true);
      setVerifiedFollowerCount(parseInt(followers));
      toast.success("TikTok account verified successfully!");
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Check if Stripe is already set up
    async function checkStripe() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.stripe_account_id) {
        setStripeSetupStarted(true);
      }
    }
    checkStripe();
  }, [searchParams, user]);

  const handleSkip = async () => {
    try {
      if (!user) return;
      await supabase
        .from("profiles")
        .update({
          account_type: "creator",
          role: "creator",
          display_name: displayName || undefined,
          avatar_url: avatarUrl || undefined,
          bio: bio || undefined,
        })
        .eq("id", user.id);
      toast.success("Progress saved! You can finish onboarding anytime from your dashboard.");
      navigate("/creator-dashboard");
    } catch (error) {
      console.error("Error saving partial progress:", error);
      toast.error("Failed to save progress.");
    }
  };

  const toggleNiche = (value: string) => {
    setSelectedNiches(prev => 
      prev.includes(value) ? prev.filter(n => n !== value) : [...prev, value]
    );
  };

  const toggleStyle = (value: string) => {
    setSelectedStyles(prev => 
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  const toggleBudget = (value: string) => {
    setSelectedBudgets(prev => 
      prev.includes(value) ? prev.filter(b => b !== value) : [...prev, value]
    );
  };

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const toggleAudience = (value: string) => {
    setAiAudiences(prev =>
      prev.includes(value) ? prev.filter(a => a !== value) : [...prev, value]
    );
  };

  const addDestination = (dest: string) => {
    if (dest && !destinations.includes(dest)) {
      setDestinations(prev => [...prev, dest]);
    }
  };

  const removeDestination = (dest: string) => {
    setDestinations(prev => prev.filter(d => d !== dest));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return displayName.trim().length > 0 && bio.trim().length > 0 && homeBase.trim().length > 0;
      case 1: return primaryPlatform.length > 0;
      case 2: return selectedNiches.length > 0;
      case 3: return destinations.length > 0;
      case 4: return true; // Portfolio optional
      case 5: return true; // Brand alignment optional
      case 6: return true; // How it works
      case 7: return pricingModel.length > 0;
      case 8: return acceptsTransparency;
      case 9: return acceptsSafetyPolicy;
      case 10: return true; // AI Identity optional
      case 11: return tosAccepted && privacyAccepted && creatorAgreementAccepted; // Legal required
      case 12: return stripeSetupStarted; // Payment required
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          avatar_url: avatarUrl || null,
          bio: bio || null,
          home_base: homeBase || null,
          primary_platform: primaryPlatform || null,
          tiktok_handle: tiktokHandle || null,
          tiktok_followers: tiktokFollowers ? parseInt(tiktokFollowers) : null,
          instagram_handle: instagramHandle || null,
          website: website || null,
          creator_niches: selectedNiches,
          content_style_tags: selectedStyles,
          creator_budget_levels: selectedBudgets,
          destinations_focus_tags: destinations,
          languages: selectedLanguages,
          creator_pov: travelPov || null,
          pricing_model: pricingModel,
          planning_fee_amount: planningFee ? parseInt(planningFee) * 100 : null,
          itinerary_fee_amount: itineraryFee ? parseInt(itineraryFee) * 100 : null,
          response_commitment_hours: responseTime,
          accepts_transparency_agreement: acceptsTransparency,
          transparency_agreement_signed_at: acceptsTransparency ? now : null,
          accepts_safety_policy: acceptsSafetyPolicy,
          safety_policy_signed_at: acceptsSafetyPolicy ? now : null,
          ai_persona_tone: aiTone || null,
          ai_persona_audience: aiAudiences.length > 0 ? aiAudiences : null,
          travel_philosophy: travelPhilosophy || null,
          // NEW: Portfolio
          featured_photos: featuredPhotos.length > 0 ? featuredPhotos : null,
          // NEW: Brand Alignment
          preferred_brand_tiers: preferredBrandTiers.length > 0 ? preferredBrandTiers : null,
          preferred_hotel_brands: preferredHotelBrands.length > 0 ? preferredHotelBrands : null,
          aesthetic_alignment: aestheticAlignment.length > 0 ? aestheticAlignment : null,
          // NEW: Legal Compliance
          tos_accepted_at: tosAccepted ? now : null,
          privacy_accepted_at: privacyAccepted ? now : null,
          creator_agreement_accepted_at: creatorAgreementAccepted ? now : null,
          tos_version: tosAccepted ? "1.0" : null,
          privacy_version: privacyAccepted ? "1.0" : null,
          creator_agreement_version: creatorAgreementAccepted ? "1.0" : null,
          // NEW: TikTok Verification
          tiktok_verified: tiktokVerified,
          tiktok_follower_count: verifiedFollowerCount || null,
          tiktok_verified_at: tiktokVerified ? now : null,
          // Final
          role: "creator",
          account_type: "creator",
          has_completed_creator_onboarding: true,
          onboarding_completed: true,
          onboarding_completed_at: now,
          is_profile_complete: true,
        })
        .eq("id", user.id);

      if (error) throw error;
      setShowWelcomeCard(true);
    } catch (error: any) {
      console.error("Error saving creator profile:", error);
      toast.error("Failed to save your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeSetup = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      const { data, error } = await supabase.functions.invoke("stripe-connect-link", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (error) throw error;
      if (data?.url) {
        setStripeSetupStarted(true);
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error starting Stripe setup:", error);
      toast.error("Failed to start payment setup. Please try again.");
    }
  };

  // Welcome Card Screen
  if (showWelcomeCard) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#C7A962] rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-lg w-full text-center">
          <h1 className="font-secondary text-4xl md:text-5xl text-[#0a2225] mb-4">
            Welcome to Goldsainte.
          </h1>
          <p className="text-[#6B7280] text-lg mb-12">
            Your journeys inspire the world.
          </p>

          <div className="bg-white border-2 border-[#C7A962] rounded-2xl p-8 shadow-lg">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-[#C7A962]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-[#FDF9F0] border-2 border-[#C7A962] flex items-center justify-center">
                <User className="w-10 h-10 text-[#C7A962]" />
              </div>
            )}
            
            <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">
              {displayName}
            </h2>
            
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FDF9F0] border border-[#C7A962] rounded-full text-sm text-[#C7A962] font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Creator Partner
            </div>

            {travelPhilosophy && (
              <p className="text-[#6B7280] text-sm italic mt-4 px-4">
                "{travelPhilosophy}"
              </p>
            )}
          </div>

          <Button
            onClick={() => navigate("/creator-dashboard")}
            className="mt-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white px-8 py-6 rounded-xl text-lg"
          >
            View Your Dashboard
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7A962]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C7A962]/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <p className="text-[#C7A962] text-sm tracking-widest uppercase mb-2">
            Creator Studio
          </p>
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
            Creator Studio by <span className="italic">Goldsainte AI</span>
          </h1>
          <p className="text-[#6B7280] mt-3 text-lg">
            Share your journeys. Earn commissions. Inspire travelers globally.
          </p>
        </div>

        <div className="mb-8">
          <LuxuryStepIndicator
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={setCurrentStep}
          />
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-3xl transform rotate-1 shadow-sm border border-[#E5DFC6]" />
          <div className="absolute inset-0 bg-white rounded-3xl transform -rotate-1 shadow-sm border border-[#E5DFC6]" />
          
          <div className="relative bg-white rounded-3xl shadow-lg border border-[#E5DFC6] p-6 md:p-10">
            
            {/* Step 1: Identity */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Creator Identity</h2>
                  <p className="text-[#6B7280]">How travelers will discover you</p>
                </div>

                <div className="flex justify-center mb-6">
                  <ProfilePhotoUploader 
                    userId={user?.id || ''} 
                    currentAvatarUrl={avatarUrl || null} 
                    displayName={displayName}
                    onUploadComplete={setAvatarUrl} 
                    size="lg" 
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-[#0a2225] font-medium">Display Name *</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your creative name or brand"
                      className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-[#0a2225] font-medium">Bio / Tagline *</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="What makes your content unique?"
                      className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label className="text-[#0a2225] font-medium">Home Base *</Label>
                    <Input
                      value={homeBase}
                      onChange={(e) => setHomeBase(e.target.value)}
                      placeholder="City, Country"
                      className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Social Universe */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Social Universe</h2>
                  <p className="text-[#6B7280]">Where do you create magic?</p>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Primary Platform *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {PLATFORMS.map((platform) => (
                      <LuxurySelectionCard
                        key={platform.value}
                        label={platform.label}
                        icon={platform.icon}
                        selected={primaryPlatform === platform.value}
                        onSelect={() => setPrimaryPlatform(platform.value)}
                        variant="single"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#0a2225] font-medium">TikTok Handle</Label>
                    <Input value={tiktokHandle} onChange={(e) => setTiktokHandle(e.target.value)} placeholder="@yourhandle" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-[#0a2225] font-medium">TikTok Followers</Label>
                    <Input value={tiktokFollowers} onChange={(e) => setTiktokFollowers(e.target.value)} placeholder="e.g., 50000" type="number" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                  </div>
                </div>

                {/* TikTok Verification */}
                <TikTokVerificationButton
                  tiktokHandle={tiktokHandle}
                  isVerified={tiktokVerified}
                  followerCount={verifiedFollowerCount}
                  onVerificationComplete={(verified, followers) => {
                    setTiktokVerified(verified);
                    setVerifiedFollowerCount(followers);
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#0a2225] font-medium">Instagram Handle</Label>
                    <Input value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourhandle" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-[#0a2225] font-medium">Instagram Followers</Label>
                    <Input value={instagramFollowers} onChange={(e) => setInstagramFollowers(e.target.value)} placeholder="e.g., 25000" type="number" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium">Website / Portfolio</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                </div>
              </div>
            )}

            {/* Step 3: Niche & Style */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Travel Niche & Style</h2>
                  <p className="text-[#6B7280]">Help us match you with the right travelers</p>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Travel Niches * <span className="text-[#6B7280] font-normal">(select all that apply)</span></Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRAVEL_NICHES.map((niche) => (
                      <LuxurySelectionCard key={niche.value} label={niche.label} description={niche.description} selected={selectedNiches.includes(niche.value)} onSelect={() => toggleNiche(niche.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Content Style</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CONTENT_STYLES.map((style) => (
                      <LuxurySelectionCard key={style.value} label={style.label} description={style.description} selected={selectedStyles.includes(style.value)} onSelect={() => toggleStyle(style.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Budget Levels You Feature</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {BUDGET_LEVELS.map((budget) => (
                      <LuxurySelectionCard key={budget.value} label={budget.label} description={budget.description} selected={selectedBudgets.includes(budget.value)} onSelect={() => toggleBudget(budget.value)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Destinations */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Where You Create Magic</h2>
                  <p className="text-[#6B7280]">Your destination expertise</p>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Primary Destinations * <span className="text-[#6B7280] font-normal">(regions you know best)</span></Label>
                  <DestinationAutocompleteNominatim 
                    value={destinations} 
                    onChange={setDestinations}
                    maxSelections={10}
                  />
                  {destinations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {destinations.map((dest) => (
                        <span key={dest} className="inline-flex items-center gap-1 px-3 py-1 bg-[#FDF9F0] border border-[#C7A962] rounded-full text-sm text-[#0a2225]">
                          {dest}
                          <button onClick={() => removeDestination(dest)} className="ml-1 text-[#6B7280] hover:text-[#0a2225]">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Languages You Create In</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button key={lang} type="button" onClick={() => toggleLanguage(lang)} className={`px-4 py-2 rounded-full text-sm transition-all ${selectedLanguages.includes(lang) ? "bg-[#C7A962] text-white" : "bg-[#FDF9F0] text-[#0a2225] border border-[#E5DFC6] hover:border-[#C7A962]"}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium">Your Travel Point of View</Label>
                  <Textarea value={travelPov} onChange={(e) => setTravelPov(e.target.value)} placeholder="What's your unique perspective on travel?" className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl min-h-[120px]" />
                </div>
              </div>
            )}

            {/* Step 5: Portfolio */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Portfolio</h2>
                  <p className="text-[#6B7280]">Showcase your best travel content</p>
                </div>

                <FeaturedPhotosUploader
                  userId={user?.id || ""}
                  photos={featuredPhotos}
                  onPhotosChange={setFeaturedPhotos}
                  maxPhotos={6}
                />

                <div className="bg-[#FDF9F0] rounded-xl p-4 border border-[#E5DFC6]">
                  <p className="text-sm text-[#6B7280]">
                    <span className="text-[#C7A962] font-medium">Tip:</span> Upload your most stunning travel photos. These appear on your profile and help travelers understand your aesthetic.
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Brand Alignment */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Brand Alignment</h2>
                  <p className="text-[#6B7280]">Which brands match your style?</p>
                </div>

                <BrandAlignmentSelector
                  selectedTiers={preferredBrandTiers}
                  onTiersChange={setPreferredBrandTiers}
                  selectedBrands={preferredHotelBrands}
                  onBrandsChange={setPreferredHotelBrands}
                  selectedAesthetics={aestheticAlignment}
                  onAestheticsChange={setAestheticAlignment}
                />
              </div>
            )}

            {/* Step 7: How Goldsainte Works */}
            {currentStep === 6 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">How Goldsainte Works</h2>
                  <p className="text-[#6B7280]">Understanding the three-sided marketplace</p>
                </div>

                <div className="space-y-4">
                  {[
                    { step: 1, title: "Traveler Posts a Trip Request", desc: "A traveler describes their dream trip, budget, and preferences. AI matches them with creators and agents." },
                    { step: 2, title: "You Create & Collaborate", desc: "Build storyboards, refine itineraries, and work with certified agents to craft the perfect journey." },
                    { step: 3, title: "Booking & Escrow", desc: "Traveler books and pays through Goldsainte. Funds are held in escrow until trip completion." },
                    { step: 4, title: "You Get Paid", desc: "After trip completion, your commission is released automatically. No chasing payments." },
                  ].map((item) => (
                    <div key={item.step} className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#C7A962] rounded-full flex items-center justify-center text-white font-medium">{item.step}</div>
                        <div>
                          <h3 className="font-medium text-[#0a2225] mb-1">{item.title}</h3>
                          <p className="text-sm text-[#6B7280]">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-[#0a2225] to-[#1a3a3f] rounded-2xl p-6 text-white">
                  <h3 className="font-secondary text-lg mb-4 flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-[#C7A962]" />
                    Commission Example
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-white/80">Booking Value</span><span className="font-medium">$3,000</span></div>
                    <div className="flex justify-between"><span className="text-white/80">Platform Fee (3.5%)</span><span className="text-white/60">-$105</span></div>
                    <div className="flex justify-between"><span className="text-white/80">Your Commission (10-20%)</span><span className="text-[#C7A962] font-medium">$300 - $600</span></div>
                    <hr className="border-white/20" />
                    <div className="flex justify-between pt-1"><span className="text-white/80">Payout Timing</span><span className="font-medium">After trip completion</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8: Pricing Model */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Pricing Model</h2>
                  <p className="text-[#6B7280]">How do you want to earn on Goldsainte?</p>
                </div>

                <div className="space-y-3">
                  {PRICING_MODELS.map((model) => (
                    <LuxurySelectionCard key={model.value} label={model.label} description={model.description} icon={model.icon} selected={pricingModel === model.value} onSelect={() => setPricingModel(model.value)} variant="single" />
                  ))}
                </div>

                {(pricingModel === "planning_fees" || pricingModel === "custom_itineraries") && (
                  <div className="mt-6 p-4 bg-[#FDF9F0] rounded-xl border border-[#E5DFC6]">
                    <Label className="text-[#0a2225] font-medium mb-3 block">{pricingModel === "planning_fees" ? "Planning Fee Amount" : "Itinerary Price"}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[#6B7280]">$</span>
                      <Input value={pricingModel === "planning_fees" ? planningFee : itineraryFee} onChange={(e) => pricingModel === "planning_fees" ? setPlanningFee(e.target.value) : setItineraryFee(e.target.value)} placeholder="e.g., 150" type="number" className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl" />
                    </div>
                    <p className="text-xs text-[#6B7280] mt-2">This is in addition to your commission on bookings</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 9: Commitment */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Goldsainte Commitment</h2>
                  <p className="text-[#6B7280]">Our partnership expectations</p>
                </div>

                <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-[#C7A962] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-[#0a2225] mb-2">Transparency Agreement</h3>
                      <p className="text-sm text-[#6B7280] mb-4">To protect both creators and travelers, all communications and transactions must stay on Goldsainte.</p>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox 
                          checked={acceptsTransparency} 
                          onCheckedChange={(checked) => setAcceptsTransparency(checked as boolean)} 
                          className="mt-0.5 border-[#C7A962] data-[state=checked]:bg-[#C7A962] data-[state=checked]:border-[#C7A962]" 
                        />
                        <span className="text-sm text-[#0a2225]">I agree to keep all communications on Goldsainte. No external DMs, no off-platform deals. *</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block flex items-center gap-2"><Clock className="w-4 h-4 text-[#C7A962]" />Response Commitment</Label>
                  <p className="text-sm text-[#6B7280] mb-3">How quickly will you respond to traveler inquiries?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {RESPONSE_TIMES.map((time) => (
                      <LuxurySelectionCard key={time.value} label={time.label} description={time.description} selected={responseTime === time.value} onSelect={() => setResponseTime(time.value)} variant="single" />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 10: Safety & Conduct */}
            {currentStep === 9 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Safety & Conduct</h2>
                  <p className="text-[#6B7280]">Protecting our community</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                    <h3 className="font-medium text-[#0a2225] mb-3 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-[#C7A962]" />Communication Standards</h3>
                    <ul className="text-sm text-[#6B7280] space-y-2">
                      <li>• Maintain timely responses (respond within 24–48 hours unless otherwise specified)</li>
                      <li>• Use clear, concise, and professional language at all times</li>
                      <li>• Respond professionally and respectfully to all inquiries</li>
                      <li>• Respect traveler boundaries and communication preferences</li>
                      <li>• Never solicit personal relationships or interactions outside the platform</li>
                      <li>• Keep all communication on-platform for transparency and safety</li>
                    </ul>
                  </div>

                  <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                    <h3 className="font-medium text-[#0a2225] mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-[#C7A962]" />Harassment Policy</h3>
                    <ul className="text-sm text-[#6B7280] space-y-2">
                      <li>• Zero tolerance for harassment, discrimination, or inappropriate behavior</li>
                      <li>• Do not use profanity, abusive language, or intimidating tone</li>
                      <li>• Do not pressure travelers into bookings or upsells</li>
                      <li>• Respect cultural differences and diverse traveler identities</li>
                      <li>• Harassment includes online, verbal, visual, or implied behavior</li>
                      <li>• Consequences may include permanent removal depending on severity</li>
                    </ul>
                  </div>

                  <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                    <h3 className="font-medium text-[#0a2225] mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-[#C7A962]" />Traveler Safety</h3>
                    <ul className="text-sm text-[#6B7280] space-y-2">
                      <li>• Verify all recommendations meet local laws and safety regulations</li>
                      <li>• Never provide medical, legal, or emergency advice beyond publicly available guidance</li>
                      <li>• Disclose any potential risks associated with activities or destinations</li>
                      <li>• Do not accompany travelers in person unless part of an approved service</li>
                      <li>• Prioritize traveler privacy—never share personal or trip details outside the platform</li>
                      <li>• Only recommend vetted, safe experiences and accommodations</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-[#C7A962]">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox 
                      checked={acceptsSafetyPolicy} 
                      onCheckedChange={(checked) => setAcceptsSafetyPolicy(checked as boolean)} 
                      className="mt-0.5 border-[#C7A962] data-[state=checked]:bg-[#C7A962] data-[state=checked]:border-[#C7A962]" 
                    />
                    <span className="text-sm text-[#0a2225]">I have read and agree to Goldsainte's Creator Safety & Conduct Policy. I understand that violations may result in account suspension or termination. *</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 11: AI Identity */}
            {currentStep === 10 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your AI Identity</h2>
                  <p className="text-[#6B7280]">Help Goldsainte AI represent you authentically</p>
                </div>

                <div className="bg-[#FDF9F0] rounded-2xl p-4 border border-[#E5DFC6] mb-6">
                  <p className="text-sm text-[#6B7280]"><span className="text-[#C7A962] font-medium">Optional but powerful:</span> These settings help Goldsainte.AI match you with the right travelers and respond on your behalf in your authentic voice.</p>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Your Tone & Voice</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {AI_TONES.map((tone) => (
                      <LuxurySelectionCard key={tone.value} label={tone.label} description={tone.description} selected={aiTone === tone.value} onSelect={() => setAiTone(tone.value)} variant="single" />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Who's Your Ideal Audience? <span className="text-[#6B7280] font-normal">(select all that apply)</span></Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {AI_AUDIENCES.map((audience) => (
                      <LuxurySelectionCard key={audience.value} label={audience.label} description={audience.description} selected={aiAudiences.includes(audience.value)} onSelect={() => toggleAudience(audience.value)} />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium">Travel Philosophy Statement</Label>
                  <p className="text-sm text-[#6B7280] mb-2">A signature message that captures your essence (shown on your profile)</p>
                  <Textarea value={travelPhilosophy} onChange={(e) => setTravelPhilosophy(e.target.value)} placeholder="e.g., 'I curate sophisticated, intentional journeys centered around design, culture, and connection.'" className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl min-h-[100px]" />
                </div>

                {aiTone && (
                  <div className="bg-gradient-to-br from-[#0a2225] to-[#1a3a3f] rounded-2xl p-6 text-white">
                    <h3 className="font-secondary text-lg mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#C7A962]" />How Goldsainte AI Might Respond For You</h3>
                    <p className="text-sm text-white/80 italic">
                      {aiTone === "chic" && '"This creator specializes in refined, design-forward experiences. Their aesthetic is understated luxury—think boutique hotels, curated dining, and moments of quiet elegance."'}
                      {aiTone === "playful" && '"Get ready for an adventure! This creator brings energy and spontaneity to every trip. Perfect for travelers who love discovering hidden gems and saying yes to the unexpected."'}
                      {aiTone === "cinematic" && '"Every journey tells a story. This creator captures destinations through a cinematic lens, transforming trips into visual narratives that you\'ll remember forever."'}
                      {aiTone === "warm" && '"Think of them as a well-traveled friend who genuinely wants to help you find the perfect trip. They bring warmth, authenticity, and personal recommendations to every interaction."'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 12: Legal Compliance */}
            {currentStep === 11 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Legal Agreements</h2>
                  <p className="text-[#6B7280]">Review and accept our creator policies</p>
                </div>

                <LegalComplianceAcceptance
                  tosAccepted={tosAccepted}
                  onTosChange={setTosAccepted}
                  privacyAccepted={privacyAccepted}
                  onPrivacyChange={setPrivacyAccepted}
                  creatorAgreementAccepted={creatorAgreementAccepted}
                  onCreatorAgreementChange={setCreatorAgreementAccepted}
                  transparencyAccepted={transparencyAccepted}
                  onTransparencyChange={setTransparencyAccepted}
                />
              </div>
            )}

            {/* Step 13: Payment Setup */}
            {currentStep === 12 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Payment Setup</h2>
                  <p className="text-[#6B7280]">How you'll get paid for your work</p>
                </div>

                <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#C7A962] rounded-full flex items-center justify-center"><CreditCard className="w-6 h-6 text-white" /></div>
                    <div>
                      <h3 className="font-medium text-[#0a2225] mb-1">Secure Payouts via Stripe</h3>
                      <p className="text-sm text-[#6B7280]">We use Stripe Connect for fast, secure payouts. You'll need to complete verification to receive commissions.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]"><CheckCircle className="w-5 h-5 text-[#C7A962]" /><span>Bank account or debit card for payouts</span></div>
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]"><CheckCircle className="w-5 h-5 text-[#C7A962]" /><span>Tax information (W9 for US creators)</span></div>
                  <div className="flex items-center gap-3 text-sm text-[#6B7280]"><CheckCircle className="w-5 h-5 text-[#C7A962]" /><span>Identity verification for security</span></div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#E5DFC6]">
                  <h3 className="font-medium text-[#0a2225] mb-4">Payout Schedule</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-[#6B7280]">Commission Release</span><span className="text-[#0a2225]">After trip completion</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Payout Frequency</span><span className="text-[#0a2225]">Daily (minimum delay)</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Processing Time</span><span className="text-[#0a2225]">1-2 business days</span></div>
                  </div>
                </div>

                <p className="text-sm text-[#6B7280] text-center">Complete Stripe Connect setup to launch your profile. This is required to receive commissions.</p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-10 pt-6 border-t border-[#E5DFC6]">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="text-[#6B7280] hover:text-[#0a2225] hover:bg-[#FDF9F0]">Back</Button>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-[#6B7280] hover:text-[#C7A962] hover:bg-[#FDF9F0] text-sm"
                >
                  Skip for Now
                </Button>
              </div>

              <div className="flex gap-3">
                {currentStep === 12 && (
                  <Button variant="outline" onClick={handleStripeSetup} className="border-[#C7A962] text-[#C7A962] hover:bg-[#C7A962] hover:text-white">
                    <CreditCard className="w-4 h-4 mr-2" />{stripeSetupStarted ? "Stripe Connected ✓" : "Set Up Stripe Now"}
                  </Button>
                )}

                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={handleNext} disabled={!canProceed()} className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white px-8">Continue</Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isSubmitting || !canProceed()} className="bg-[#C7A962] hover:bg-[#C7A962]/90 text-white px-8">
                    {isSubmitting ? "Launching..." : "Launch My Profile"}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">Step {currentStep + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}