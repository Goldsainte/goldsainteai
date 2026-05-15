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
import { CreatorMediaUploader, type MediaEntry } from "@/components/creator/CreatorMediaUploader";
import { BrandAlignmentSelector } from "@/components/onboarding/BrandAlignmentSelector";
import { LegalComplianceAcceptance } from "@/components/onboarding/LegalComplianceAcceptance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  User, Globe, MapPin, Sparkles,
  TrendingUp, Instagram, Youtube, Video, Shield,
  MessageCircle, Clock, Wallet, Heart,
  DollarSign, FileText, Star, Building2, Image,
  ArrowRight
} from "lucide-react";

const STEPS = [
  { title: "About You", icon: User },
  { title: "Social Profile", icon: Globe },
  { title: "Your Niche", icon: Sparkles },
  { title: "Portfolio", icon: Image },
  { title: "Standards", icon: Shield },
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
  { value: "commission_only", label: "Commission Only", description: "I earn when travelers book through my content.", icon: TrendingUp },
  { value: "planning_fees", label: "Planning Fees", description: "I charge for custom trip planning plus commissions.", icon: FileText },
  { value: "custom_itineraries", label: "Custom Itineraries", description: "I sell detailed, bookable itineraries as products.", icon: MapPin },
  { value: "premium_content", label: "Premium Content", description: "I offer exclusive destination guides and resources.", icon: Star },
];

const RESPONSE_TIMES = [
  { value: 4, label: "Within 4 hours", description: "Lightning fast" },
  { value: 12, label: "Within 12 hours", description: "Same-day" },
  { value: 24, label: "Within 24 hours", description: "Next-day" },
  { value: 48, label: "Within 48 hours", description: "Flexible" },
];

export default function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);

  // Step 1: About You
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [website, setWebsite] = useState("");

  // Step 2: Your Niche
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);

  // Step 3: Portfolio (all optional)
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [featuredPhotos, setFeaturedPhotos] = useState<string[]>([]);
  const [creatorMedia, setCreatorMedia] = useState<MediaEntry[]>([]);
  const [preferredBrandTiers, setPreferredBrandTiers] = useState<string[]>([]);
  const [preferredHotelBrands, setPreferredHotelBrands] = useState<string[]>([]);
  const [aestheticAlignment, setAestheticAlignment] = useState<string[]>([]);
  const [pricingModel, setPricingModel] = useState("commission_only");
  const [planningFee, setPlanningFee] = useState("");
  const [itineraryFee, setItineraryFee] = useState("");

  // Step 4: Standards & Legal
  const [responseTime, setResponseTime] = useState(24);
  const [acceptsTransparency, setAcceptsTransparency] = useState(false);
  const [acceptsSafetyPolicy, setAcceptsSafetyPolicy] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [creatorAgreementAccepted, setCreatorAgreementAccepted] = useState(false);
  const [transparencyAccepted, setTransparencyAccepted] = useState(false);


  const [searchParams] = useSearchParams();

  // Pre-populate from existing profile data for returning users
  useEffect(() => {
    async function loadExistingProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, full_name, avatar_url, bio, home_base, primary_platform, tiktok_handle, instagram_handle, website, creator_niches, content_style_tags, creator_budget_levels, destinations_focus_tags, cover_image_url, featured_photos, preferred_brand_tiers, preferred_hotel_brands, aesthetic_alignment, pricing_model, planning_fee_amount, itinerary_fee_amount, response_commitment_hours, stripe_account_id")
        .eq("id", user.id)
        .maybeSingle();
      if (!data) return;

      if (data.display_name) setDisplayName(data.display_name);
      else if (data.full_name) setDisplayName(data.full_name);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.bio) setBio(data.bio);
      if (data.home_base) setHomeBase(data.home_base);
      if (data.primary_platform) setPrimaryPlatform(data.primary_platform);
      if (data.tiktok_handle) setTiktokHandle(data.tiktok_handle);
      if (data.instagram_handle) setInstagramHandle(data.instagram_handle);
      if (data.website) setWebsite(data.website);
      if (data.creator_niches?.length) setSelectedNiches(data.creator_niches);
      if (data.content_style_tags?.length) setSelectedStyles(data.content_style_tags);
      if (data.creator_budget_levels?.length) setSelectedBudgets(data.creator_budget_levels);
      if (data.destinations_focus_tags?.length) setDestinations(data.destinations_focus_tags);
      if (data.cover_image_url) setCoverImageUrl(data.cover_image_url);
      if (data.featured_photos?.length) setFeaturedPhotos(data.featured_photos as string[]);
      if (data.preferred_brand_tiers?.length) setPreferredBrandTiers(data.preferred_brand_tiers);
      if (data.preferred_hotel_brands?.length) setPreferredHotelBrands(data.preferred_hotel_brands);
      if (data.aesthetic_alignment?.length) setAestheticAlignment(data.aesthetic_alignment);
      if (data.pricing_model) setPricingModel(data.pricing_model);
      if (data.planning_fee_amount) setPlanningFee(String(data.planning_fee_amount / 100));
      if (data.itinerary_fee_amount) setItineraryFee(String(data.itinerary_fee_amount / 100));
      if (data.response_commitment_hours) setResponseTime(data.response_commitment_hours);
      
    }
    loadExistingProfile();
  }, [user]);

  const handleSkip = async () => {
    try {
      if (!user) return;
      const updateData: Record<string, any> = {
        account_type: "creator",
        role: "creator",
      };
      if (displayName) {
        updateData.display_name = displayName;
        updateData.full_name = displayName;
      }
      if (avatarUrl) updateData.avatar_url = avatarUrl;
      if (bio) updateData.bio = bio;
      if (homeBase) updateData.home_base = homeBase;
      if (selectedNiches.length) updateData.creator_niches = selectedNiches;
      if (selectedBudgets.length) updateData.creator_budget_levels = selectedBudgets;
      
      await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);
      toast.success("Progress saved! You can finish onboarding anytime from your dashboard.");
      navigate("/creator-dashboard");
    } catch (error) {
      console.error("Error saving partial progress:", error);
      toast.error("Failed to save progress.");
    }
  };

  const toggleSelection = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setter((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const removeDestination = (dest: string) => {
    setDestinations((prev) => prev.filter((d) => d !== dest));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return displayName.trim().length > 0 && bio.trim().length > 0 && homeBase.trim().length > 0;
      case 1:
        if (primaryPlatform.length === 0) return false;
        if (primaryPlatform === "tiktok") return tiktokHandle.trim().length > 0;
        if (primaryPlatform === "instagram") return instagramHandle.trim().length > 0;
        if (primaryPlatform === "youtube") return website.trim().length > 0;
        if (primaryPlatform === "multi")
          return (
            tiktokHandle.trim().length > 0 ||
            instagramHandle.trim().length > 0 ||
            website.trim().length > 0
          );
        return true;
      case 2:
        return selectedNiches.length > 0 && destinations.length > 0;
      case 3:
        return true; // All optional
      case 4:
        return acceptsTransparency && acceptsSafetyPolicy && tosAccepted && privacyAccepted && creatorAgreementAccepted;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          full_name: displayName,
          avatar_url: avatarUrl || null,
          bio: bio || null,
          home_base: homeBase || null,
          cover_image_url: coverImageUrl || null,
          primary_platform: primaryPlatform || null,
          tiktok_handle: tiktokHandle || null,
          instagram_handle: instagramHandle || null,
          website: website || null,
          creator_niches: selectedNiches,
          content_style_tags: selectedStyles,
          creator_budget_levels: selectedBudgets,
          destinations_focus_tags: destinations,
          pricing_model: pricingModel,
          planning_fee_amount: planningFee ? parseInt(planningFee) * 100 : null,
          itinerary_fee_amount: itineraryFee ? parseInt(itineraryFee) * 100 : null,
          response_commitment_hours: responseTime,
          accepts_transparency_agreement: acceptsTransparency,
          transparency_agreement_signed_at: acceptsTransparency ? now : null,
          accepts_safety_policy: acceptsSafetyPolicy,
          safety_policy_signed_at: acceptsSafetyPolicy ? now : null,
          featured_photos: featuredPhotos.length > 0 ? featuredPhotos : null,
          preferred_brand_tiers: preferredBrandTiers.length > 0 ? preferredBrandTiers : null,
          preferred_hotel_brands: preferredHotelBrands.length > 0 ? preferredHotelBrands : null,
          aesthetic_alignment: aestheticAlignment.length > 0 ? aestheticAlignment : null,
          tos_accepted_at: tosAccepted ? now : null,
          privacy_accepted_at: privacyAccepted ? now : null,
          creator_agreement_accepted_at: creatorAgreementAccepted ? now : null,
          tos_version: tosAccepted ? "1.0" : null,
          privacy_version: privacyAccepted ? "1.0" : null,
          creator_agreement_version: creatorAgreementAccepted ? "1.0" : null,
          // Deferred fields — send null so DB columns aren't broken
          tiktok_followers: null,
          tiktok_verified: false,
          tiktok_follower_count: null,
          tiktok_verified_at: null,
          languages: null,
          creator_pov: null,
          ai_persona_tone: null,
          ai_persona_audience: null,
          travel_philosophy: null,
          // Final
          role: "creator",
          account_type: "creator",
          has_completed_creator_onboarding: true,
          onboarding_completed: true,
          onboarding_completed_at: now,
          is_profile_complete: true,
          creator_status: "pending",
        })
        .eq("id", user.id);

      if (error) throw error;

      // Save creator media items
      if (creatorMedia.length > 0) {
        const mediaRows = creatorMedia.map((item, idx) => ({
          user_id: user.id,
          media_type: item.media_type,
          source: item.source,
          url: item.url,
          thumbnail_url: item.thumbnail_url || null,
          external_url: item.external_url || null,
          caption: item.caption || null,
          sort_order: idx,
        }));
        await supabase.from("creator_media").upsert(mediaRows, { onConflict: "id" });
      }

      setShowWelcomeCard(true);
    } catch (error: any) {
      console.error("Error saving creator profile:", error);
      toast.error("Failed to save your profile. Please try again.");
    } finally {
      setIsSubmitting(false);
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
          <p className="text-[#6B7280] text-lg mb-12">Your journeys inspire the world.</p>

          <div className="bg-white border-2 border-[#C7A962] rounded-2xl p-8 shadow-lg">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-[#C7A962]"
              loading="lazy"/>
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-[#FDF9F0] border-2 border-[#C7A962] flex items-center justify-center">
                <User className="w-10 h-10 text-[#C7A962]" />
              </div>
            )}

            <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">{displayName}</h2>

            <div className="inline-flex items-center gap-2 px-4 py-1 bg-[#FDF9F0] border border-[#C7A962] rounded-full text-sm text-[#C7A962] font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Creator Partner
            </div>
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
          <p className="text-[#C7A962] text-sm tracking-widest uppercase mb-2">Creator Setup</p>
          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
            Creator Dashboard by <span className="italic">Goldsainte AI</span>
          </h1>
          <p className="text-[#6B7280] mt-3 text-lg">
            Share your journeys. Earn commissions. Inspire travelers globally.
          </p>
        </div>

        <div className="mb-8">
          <LuxuryStepIndicator steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-white rounded-3xl transform rotate-1 shadow-sm border border-[#E5DFC6]" />
          <div className="absolute inset-0 bg-white rounded-3xl transform -rotate-1 shadow-sm border border-[#E5DFC6]" />

          <div className="relative bg-white rounded-3xl shadow-lg border border-[#E5DFC6] p-6 md:p-10">
            {/* ── Step 1: About You ── */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">About You</h2>
                  <p className="text-[#6B7280]">How travelers will discover you</p>
                </div>

                <div className="flex justify-center mb-6">
                  <ProfilePhotoUploader
                    userId={user?.id || ""}
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

            {/* ── Step 2: Social Profile ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Social Profile</h2>
                  <p className="text-[#6B7280]">Where travelers can find your work</p>
                </div>

                {/* Primary Platform */}
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

                {/* Social handles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#0a2225] font-medium">TikTok Handle</Label>
                    <Input
                      value={tiktokHandle}
                      onChange={(e) => setTiktokHandle(e.target.value)}
                      placeholder="@yourhandle"
                      className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-[#0a2225] font-medium">Instagram Handle</Label>
                    <Input
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      placeholder="@yourhandle"
                      className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium">Website / Portfolio</Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="mt-2 border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* ── Step 3: Your Niche ── */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Niche</h2>
                  <p className="text-[#6B7280]">Help us match you with the right travelers</p>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">
                    Travel Niches * <span className="text-[#6B7280] font-normal">(select all that apply)</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRAVEL_NICHES.map((niche) => (
                      <LuxurySelectionCard
                        key={niche.value}
                        label={niche.label}
                        description={niche.description}
                        selected={selectedNiches.includes(niche.value)}
                        onSelect={() => toggleSelection(setSelectedNiches, niche.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Content Style</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CONTENT_STYLES.map((style) => (
                      <LuxurySelectionCard
                        key={style.value}
                        label={style.label}
                        description={style.description}
                        selected={selectedStyles.includes(style.value)}
                        onSelect={() => toggleSelection(setSelectedStyles, style.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Budget Levels You Feature</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {BUDGET_LEVELS.map((budget) => (
                      <LuxurySelectionCard
                        key={budget.value}
                        label={budget.label}
                        description={budget.description}
                        selected={selectedBudgets.includes(budget.value)}
                        onSelect={() => toggleSelection(setSelectedBudgets, budget.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">
                    Primary Destinations * <span className="text-[#6B7280] font-normal">(regions you know best)</span>
                  </Label>
                  <DestinationAutocompleteNominatim
                    value={destinations}
                    onChange={setDestinations}
                    maxSelections={10}
                  />
                  {destinations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {destinations.map((dest) => (
                        <span
                          key={dest}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#FDF9F0] border border-[#C7A962] rounded-full text-sm text-[#0a2225]"
                        >
                          {dest}
                          <button onClick={() => removeDestination(dest)} className="ml-1 text-[#6B7280] hover:text-[#0a2225]">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 4: Your Portfolio (all optional) ── */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Your Portfolio</h2>
                  <p className="text-[#6B7280]">Showcase your work — everything here is optional</p>
                </div>

                {/* Cover Image */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Cover / Hero Image</Label>
                  <p className="text-xs text-[#6B7280] mb-3">This appears as the banner at the top of your public profile.</p>
                  {coverImageUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-[#E5DFC6] aspect-[3/1]">
                      <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy"/>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl("")}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <span className="text-white text-sm">✕</span>
                      </button>
                    </div>
                  ) : (
                    <label className="block aspect-[3/1] rounded-xl border-2 border-dashed border-[#E5DFC6] hover:border-[#C7A962] transition-colors cursor-pointer flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          if (file.size > 50 * 1024 * 1024) { toast.error("Max 50MB"); return; }
                          const ext = file.name.split(".").pop();
                          const path = `${user.id}/cover/${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                          if (error) { toast.error("Upload failed"); return; }
                          const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
                          setCoverImageUrl(publicUrl);
                          toast.success("Cover image uploaded!");
                        }}
                      />
                      <div className="text-center">
                        <Image className="w-8 h-8 text-[#C7A962] mx-auto mb-2" />
                        <span className="text-sm text-[#6B7280]">Upload cover image</span>
                      </div>
                    </label>
                  )}
                </div>

                {/* Featured Photos */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Featured Photos</Label>
                  <FeaturedPhotosUploader
                    userId={user?.id || ""}
                    photos={featuredPhotos}
                    onPhotosChange={setFeaturedPhotos}
                    maxPhotos={6}
                  />
                  <p className="text-xs text-[#6B7280] mt-2">
                    <span className="text-[#C7A962] font-medium">Tip:</span> Upload your most stunning travel photos.
                  </p>
                </div>

                {/* Media Gallery — videos, reels, social links */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-1 block">Content Gallery</Label>
                  <p className="text-xs text-[#6B7280] mb-3">Upload videos, reels, or paste Instagram / TikTok links to showcase your content.</p>
                  <CreatorMediaUploader
                    userId={user?.id || ""}
                    media={creatorMedia}
                    onMediaChange={setCreatorMedia}
                    maxItems={12}
                  />
                </div>

                {/* Brand Alignment */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Brand Alignment</Label>
                  <BrandAlignmentSelector
                    selectedTiers={preferredBrandTiers}
                    onTiersChange={setPreferredBrandTiers}
                    selectedBrands={preferredHotelBrands}
                    onBrandsChange={setPreferredHotelBrands}
                    selectedAesthetics={aestheticAlignment}
                    onAestheticsChange={setAestheticAlignment}
                  />
                </div>

                {/* Pricing Model */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block">Pricing Model</Label>
                  <div className="space-y-3">
                    {PRICING_MODELS.map((model) => (
                      <LuxurySelectionCard
                        key={model.value}
                        label={model.label}
                        description={model.description}
                        icon={model.icon}
                        selected={pricingModel === model.value}
                        onSelect={() => setPricingModel(model.value)}
                        variant="single"
                      />
                    ))}
                  </div>

                  {(pricingModel === "planning_fees" || pricingModel === "custom_itineraries") && (
                    <div className="mt-4 p-4 bg-[#FDF9F0] rounded-xl border border-[#E5DFC6]">
                      <Label className="text-[#0a2225] font-medium mb-3 block">
                        {pricingModel === "planning_fees" ? "Planning Fee Amount" : "Itinerary Price"}
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[#6B7280]">$</span>
                        <Input
                          value={pricingModel === "planning_fees" ? planningFee : itineraryFee}
                          onChange={(e) =>
                            pricingModel === "planning_fees"
                              ? setPlanningFee(e.target.value)
                              : setItineraryFee(e.target.value)
                          }
                          placeholder="e.g., 150"
                          type="number"
                          className="border-[#E5DFC6] focus:border-[#C7A962] focus:ring-[#C7A962] rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 5: Standards & Legal ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="font-secondary text-2xl text-[#0a2225] mb-2">Standards & Legal</h2>
                  <p className="text-[#6B7280]">Our partnership commitments</p>
                </div>

                {/* Response Commitment */}
                <div>
                  <Label className="text-[#0a2225] font-medium mb-3 block flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C7A962]" />
                    Response Commitment
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {RESPONSE_TIMES.map((time) => (
                      <LuxurySelectionCard
                        key={time.value}
                        label={time.label}
                        description={time.description}
                        selected={responseTime === time.value}
                        onSelect={() => setResponseTime(time.value)}
                        variant="single"
                      />
                    ))}
                  </div>
                </div>

                {/* Transparency */}
                <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-[#C7A962] flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-medium text-[#0a2225] mb-2">Transparency Agreement</h3>
                      <p className="text-sm text-[#6B7280] mb-4">
                        All communications and transactions must stay on Goldsainte.
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={acceptsTransparency}
                          onCheckedChange={(checked) => setAcceptsTransparency(checked as boolean)}
                          className="mt-0.5 border-[#C7A962] data-[state=checked]:bg-[#C7A962] data-[state=checked]:border-[#C7A962]"
                        />
                        <span className="text-sm text-[#0a2225]">
                          I agree to keep all communications on Goldsainte. *
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Safety & Conduct */}
                <div className="bg-[#FDF9F0] rounded-2xl p-6 border border-[#E5DFC6]">
                  <h3 className="font-medium text-[#0a2225] mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#C7A962]" />
                    Safety & Conduct
                  </h3>
                  <ul className="text-sm text-[#6B7280] space-y-1 mb-4">
                    <li>• Zero tolerance for harassment or discrimination</li>
                    <li>• Verify recommendations meet local safety regulations</li>
                    <li>• Prioritize traveler privacy at all times</li>
                    <li>• Only recommend vetted, safe experiences</li>
                  </ul>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={acceptsSafetyPolicy}
                      onCheckedChange={(checked) => setAcceptsSafetyPolicy(checked as boolean)}
                      className="mt-0.5 border-[#C7A962] data-[state=checked]:bg-[#C7A962] data-[state=checked]:border-[#C7A962]"
                    />
                    <span className="text-sm text-[#0a2225]">
                      I agree to Goldsainte's Safety & Conduct Policy. *
                    </span>
                  </label>
                </div>

                {/* Legal Documents */}
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

            {/* Navigation */}
            <div className="flex justify-between mt-10 pt-6 border-t border-[#E5DFC6]">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-[#6B7280] hover:text-[#0a2225] hover:bg-[#FDF9F0]"
                >
                  Back
                </Button>
                {currentStep < STEPS.length - 1 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-[#6B7280] hover:text-[#C7A962] hover:bg-[#FDF9F0] text-sm"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-[#0a2225] hover:bg-[#0a2225]/90 text-white px-8"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed()}
                    className="bg-[#C7A962] hover:bg-[#C7A962]/90 text-white px-8"
                  >
                    {isSubmitting ? "Launching..." : "Launch My Profile"}
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
