import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  User,
  Globe,
  Palette,
  MapPin,
  BadgeCheck,
  Camera,
  Instagram,
  Link as LinkIcon,
  DollarSign,
  Shield,
  MessageSquare,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LuxuryStepIndicator } from "@/components/onboarding/LuxuryStepIndicator";
import { LuxurySelectionCard } from "@/components/onboarding/LuxurySelectionCard";
import { LuxuryFormSection } from "@/components/onboarding/LuxuryFormSection";
import { DestinationAutocompleteNominatim } from "@/components/preferences/DestinationAutocompleteNominatim";
import { ProfilePhotoUploader } from "@/pages/traveler/components/ProfilePhotoUploader";
import { cn } from "@/lib/utils";

const NICHE_OPTIONS = [
  { label: "European city breaks", description: "Paris, Rome, Barcelona & beyond" },
  { label: "Beach escapes", description: "Coastal retreats & island hopping" },
  { label: "Design hotels", description: "Boutique stays & architectural gems" },
  { label: "Villas & homes", description: "Private rentals & luxury properties" },
  { label: "Adventure", description: "Hiking, diving & outdoor thrills" },
  { label: "Wellness", description: "Spas, retreats & mindful travel" },
  { label: "Food & wine", description: "Culinary journeys & tastings" },
  { label: "Nightlife", description: "Clubs, bars & after-hours" },
  { label: "Family-friendly", description: "Kid-approved destinations" },
  { label: "Hidden gems", description: "Off-the-beaten-path discoveries" },
];

const CONTENT_STYLE_OPTIONS = [
  { label: "Cinematic", description: "Polished, film-like visuals" },
  { label: "Documentary", description: "Storytelling & cultural deep-dives" },
  { label: "Vlog-style", description: "Personal, day-in-my-life format" },
  { label: "Photo-focused", description: "Photography-first content" },
  { label: "Guides & tips", description: "Practical travel advice" },
  { label: "Aesthetic reels", description: "Mood-driven short-form content" },
];

const BUDGET_OPTIONS = [
  { label: "Affordable-chic", description: "Style on a smart budget" },
  { label: "Classic luxury", description: "Four-star elegance" },
  { label: "Ultra-luxury", description: "Five-star & beyond" },
];

const PLATFORM_OPTIONS = [
  { label: "TikTok", icon: "🎵" },
  { label: "Instagram", icon: "📸" },
  { label: "YouTube", icon: "▶️" },
  { label: "Multi-platform", icon: "🌐" },
];

const STEPS = [
  { title: "Identity", icon: User },
  { title: "Social", icon: Globe },
  { title: "Niche", icon: Palette },
  { title: "Regions", icon: MapPin },
  { title: "Platform", icon: BadgeCheck },
  { title: "Launch", icon: Sparkles },
];

export default function CreatorOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [homeBase, setHomeBase] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [tiktokFollowers, setTiktokFollowers] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [instagramFollowers, setInstagramFollowers] = useState("");
  const [website, setWebsite] = useState("");
  
  const [niches, setNiches] = useState<string[]>([]);
  const [contentStyles, setContentStyles] = useState<string[]>([]);
  const [budgetLevels, setBudgetLevels] = useState<string[]>([]);
  
  const [destinationFocus, setDestinationFocus] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [pov, setPov] = useState("");
  
  const [policyAccepted, setPolicyAccepted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?returnTo=/onboarding/creator");
    }
  }, [authLoading, user, navigate]);

  const toggleArrayValue = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    if (arr.includes(value)) {
      setArr(arr.filter((v) => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    
    if (!displayName.trim()) {
      toast.error("Please add your display name");
      setCurrentStep(0);
      return;
    }
    if (!policyAccepted) {
      toast.error("Please agree to the Goldsainte creator terms");
      setCurrentStep(4);
      return;
    }

    setSaving(true);
    try {
      // Update profile with creator data
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
          home_base: homeBase.trim() || null,
          avatar_url: avatarUrl,
          tiktok_handle: tiktokHandle.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
          website: website.trim() || null,
          primary_platform: primaryPlatform || null,
          creator_niches: niches,
          creator_budget_levels: budgetLevels,
          creator_pov: pov.trim() || null,
          content_style_tags: contentStyles,
          destinations_focus_tags: destinationFocus,
          languages: languages,
          role: "creator",
          account_type: "creator",
          has_completed_creator_onboarding: true,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          is_profile_complete: true,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error saving creator onboarding", error);
        toast.error("We couldn't save your profile. Please try again.");
        setSaving(false);
        return;
      }

      toast.success("Welcome to Goldsainte Creator Lab!");
      setTimeout(() => {
        navigate("/tiktok-lab");
      }, 800);
    } catch (err) {
      console.error("Error in handleFinish:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FDF9F0] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse">
            <Sparkles className="h-8 w-8 mx-auto text-[#C7A962]" />
          </div>
          <p className="text-sm text-[#6E6650]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF9F0]">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C7B892]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#C7B892]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative container max-w-4xl py-6 sm:py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="w-16 h-0.5 bg-[#C7B892] mx-auto mb-6" />
          <p className="uppercase tracking-[0.25em] text-[10px] sm:text-[11px] text-[#7A7151] mb-4 font-medium">
            Creator Onboarding
          </p>
          <h1 className="font-secondary text-[26px] md:text-[40px] leading-[1.15] text-[#0a2225] mb-4">
            Welcome to Goldsainte Creator Lab
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#6E6650] leading-relaxed">
            Let's build your creator profile so we can match you with the right travelers and agents.
          </p>
        </div>

        {/* Step Indicator */}
        <LuxuryStepIndicator 
          steps={STEPS} 
          currentStep={currentStep}
          onStepClick={(step) => step <= currentStep && setCurrentStep(step)}
        />

        {/* Main Card with stacked effect */}
        <div className="relative">
          <div className="absolute inset-x-2 top-3 bottom-0 rounded-[28px] bg-[#E5DFC6]/30 -z-10" />
          <div className="absolute inset-x-1 top-1.5 bottom-0 rounded-[28px] bg-[#E5DFC6]/50 -z-10" />
          
          <div className="rounded-[28px] border border-[#E5DFC6] bg-white/95 backdrop-blur-sm shadow-[0_24px_60px_rgba(10,34,37,0.12)]">
            <div className="p-5 sm:p-8 md:p-10">
              {/* Step 1: Identity */}
              {currentStep === 0 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      Your creator identity
                    </h2>
                    <p className="text-sm text-[#6E6650]">
                      How travelers and agents will see you on Goldsainte
                    </p>
                  </div>

                  {/* Profile Photo */}
                  <div className="flex justify-center">
                    {user && (
                      <ProfilePhotoUploader
                        userId={user.id}
                        currentAvatarUrl={avatarUrl}
                        displayName={displayName}
                        onUploadComplete={(url) => setAvatarUrl(url)}
                        size="lg"
                      />
                    )}
                  </div>

                  <LuxuryFormSection title="Display name" subtitle="Your creative name or brand">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. JetLag & Champagne"
                      className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                    />
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Bio" subtitle="What makes your travel content unique?" helperText="A few sentences about your travel style and what you're known for">
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="I create cinematic travel content that captures the soul of a destination..."
                      className="min-h-[100px] rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                    />
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Home base" subtitle="Where are you based?">
                    <Input
                      value={homeBase}
                      onChange={(e) => setHomeBase(e.target.value)}
                      placeholder="e.g. New York, London, Dubai"
                      className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                    />
                  </LuxuryFormSection>
                </div>
              )}

              {/* Step 2: Social Universe */}
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      Your social universe
                    </h2>
                    <p className="text-sm text-[#6E6650]">
                      Connect your platforms so travelers can discover your content
                    </p>
                  </div>

                  <LuxuryFormSection title="Primary platform" subtitle="Where does most of your audience follow you?">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {PLATFORM_OPTIONS.map((platform) => (
                        <LuxurySelectionCard
                          key={platform.label}
                          label={`${platform.icon} ${platform.label}`}
                          selected={primaryPlatform === platform.label}
                          onSelect={() => setPrimaryPlatform(platform.label)}
                          variant="single"
                        />
                      ))}
                    </div>
                  </LuxuryFormSection>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <LuxuryFormSection title="TikTok" icon={Globe}>
                      <div className="space-y-3">
                        <div className="flex items-center rounded-xl border border-[#E5DFC6] bg-white px-3">
                          <span className="text-[#6E6650] text-sm mr-1">@</span>
                          <Input
                            value={tiktokHandle}
                            onChange={(e) => setTiktokHandle(e.target.value)}
                            placeholder="yourhandle"
                            className="border-0 bg-transparent focus-visible:ring-0 px-0"
                          />
                        </div>
                        <Input
                          value={tiktokFollowers}
                          onChange={(e) => setTiktokFollowers(e.target.value)}
                          placeholder="Follower count (e.g. 50K)"
                          className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                        />
                      </div>
                    </LuxuryFormSection>

                    <LuxuryFormSection title="Instagram" icon={Instagram}>
                      <div className="space-y-3">
                        <div className="flex items-center rounded-xl border border-[#E5DFC6] bg-white px-3">
                          <span className="text-[#6E6650] text-sm mr-1">@</span>
                          <Input
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            placeholder="yourhandle"
                            className="border-0 bg-transparent focus-visible:ring-0 px-0"
                          />
                        </div>
                        <Input
                          value={instagramFollowers}
                          onChange={(e) => setInstagramFollowers(e.target.value)}
                          placeholder="Follower count (e.g. 25K)"
                          className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                        />
                      </div>
                    </LuxuryFormSection>
                  </div>

                  <LuxuryFormSection title="Website or portfolio" subtitle="Optional" icon={LinkIcon}>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yoursite.com"
                      className="rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                    />
                  </LuxuryFormSection>
                </div>
              )}

              {/* Step 3: Niche & Style */}
              {currentStep === 2 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      Your travel niche & style
                    </h2>
                    <p className="text-sm text-[#6E6650]">
                      This helps us match you with travelers who love your aesthetic
                    </p>
                  </div>

                  <LuxuryFormSection title="Travel niches" subtitle="What types of travel do you create content about?" helperText="Select all that apply">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {NICHE_OPTIONS.map((niche) => (
                        <LuxurySelectionCard
                          key={niche.label}
                          label={niche.label}
                          description={niche.description}
                          selected={niches.includes(niche.label)}
                          onSelect={() => toggleArrayValue(niches, setNiches, niche.label)}
                          variant="multi"
                        />
                      ))}
                    </div>
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Content style" subtitle="How would you describe your content?">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CONTENT_STYLE_OPTIONS.map((style) => (
                        <LuxurySelectionCard
                          key={style.label}
                          label={style.label}
                          description={style.description}
                          selected={contentStyles.includes(style.label)}
                          onSelect={() => toggleArrayValue(contentStyles, setContentStyles, style.label)}
                          variant="multi"
                        />
                      ))}
                    </div>
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Budget level" subtitle="What price range do you typically feature?">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {BUDGET_OPTIONS.map((budget) => (
                        <LuxurySelectionCard
                          key={budget.label}
                          label={budget.label}
                          description={budget.description}
                          selected={budgetLevels.includes(budget.label)}
                          onSelect={() => toggleArrayValue(budgetLevels, setBudgetLevels, budget.label)}
                          variant="multi"
                        />
                      ))}
                    </div>
                  </LuxuryFormSection>
                </div>
              )}

              {/* Step 4: Regions & Languages */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      Where you create magic
                    </h2>
                    <p className="text-sm text-[#6E6650]">
                      Tell us about the destinations you know best
                    </p>
                  </div>

                  <LuxuryFormSection title="Destination focus" subtitle="Which regions or countries do you specialize in?" helperText="We'll prioritize matching you with travelers interested in these places">
                    <DestinationAutocompleteNominatim
                      value={destinationFocus}
                      onChange={setDestinationFocus}
                      maxSelections={12}
                    />
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Languages" subtitle="What languages do you create content in?">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Arabic', 'Mandarin'].map((lang) => (
                        <LuxurySelectionCard
                          key={lang}
                          label={lang}
                          selected={languages.includes(lang)}
                          onSelect={() => toggleArrayValue(languages, setLanguages, lang)}
                          variant="multi"
                        />
                      ))}
                    </div>
                  </LuxuryFormSection>

                  <LuxuryFormSection title="Your travel point of view" subtitle="What makes your recommendations unique?">
                    <Textarea
                      value={pov}
                      onChange={(e) => setPov(e.target.value)}
                      placeholder="I focus on finding those hidden local spots that tourists never see. I believe the best travel experiences come from connecting with locals and experiencing authentic culture..."
                      className="min-h-[120px] rounded-xl border-[#E5DFC6] bg-white focus:border-[#C7B892] focus:ring-[#C7B892]/20"
                    />
                  </LuxuryFormSection>
                </div>
              )}

              {/* Step 5: How Goldsainte Works */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      How Goldsainte works for you
                    </h2>
                    <p className="text-sm text-[#6E6650]">
                      Turn your travel content into bookable experiences
                    </p>
                  </div>

                  {/* Visual explanation cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-[#F5EFE1] border border-[#E5DFC6]">
                      <div className="w-10 h-10 rounded-full bg-[#C7B892]/20 flex items-center justify-center mb-4">
                        <Sparkles className="w-5 h-5 text-[#7A7151]" />
                      </div>
                      <h3 className="font-medium text-[#0a2225] mb-2">Create storyboards</h3>
                      <p className="text-sm text-[#6E6650] leading-relaxed">
                        Turn your best trips into visual storyboards that travelers can book through Goldsainte.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F5EFE1] border border-[#E5DFC6]">
                      <div className="w-10 h-10 rounded-full bg-[#C7B892]/20 flex items-center justify-center mb-4">
                        <DollarSign className="w-5 h-5 text-[#7A7151]" />
                      </div>
                      <h3 className="font-medium text-[#0a2225] mb-2">Earn commissions</h3>
                      <p className="text-sm text-[#6E6650] leading-relaxed">
                        When travelers book trips inspired by your content, you earn a percentage of the booking value.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F5EFE1] border border-[#E5DFC6]">
                      <div className="w-10 h-10 rounded-full bg-[#C7B892]/20 flex items-center justify-center mb-4">
                        <Shield className="w-5 h-5 text-[#7A7151]" />
                      </div>
                      <h3 className="font-medium text-[#0a2225] mb-2">Protected payments</h3>
                      <p className="text-sm text-[#6E6650] leading-relaxed">
                        Goldsainte handles all payments, escrow, and automatic payouts. No invoices, no chasing DMs.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#F5EFE1] border border-[#E5DFC6]">
                      <div className="w-10 h-10 rounded-full bg-[#C7B892]/20 flex items-center justify-center mb-4">
                        <MessageSquare className="w-5 h-5 text-[#7A7151]" />
                      </div>
                      <h3 className="font-medium text-[#0a2225] mb-2">On-platform messaging</h3>
                      <p className="text-sm text-[#6E6650] leading-relaxed">
                        Communicate with travelers and agents safely on Goldsainte. Everything stays in one place.
                      </p>
                    </div>
                  </div>

                  {/* Policy acceptance */}
                  <div className="p-5 rounded-2xl bg-white border-2 border-[#E5DFC6]">
                    <label className="flex items-start gap-4 cursor-pointer">
                      <button
                        type="button"
                        onClick={() => setPolicyAccepted(!policyAccepted)}
                        className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all",
                          policyAccepted
                            ? "border-[#C7B892] bg-[#C7B892]"
                            : "border-[#D4CDB8] bg-white hover:border-[#C7B892]/60"
                        )}
                      >
                        {policyAccepted && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <div>
                        <p className="font-medium text-[#0a2225] text-sm">
                          I agree to keep trip conversations and payments on Goldsainte
                        </p>
                        <p className="text-xs text-[#6E6650] mt-1 leading-relaxed">
                          No external DMs, no direct payment links, no off-platform deals. This protects everyone and ensures you get paid.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: Launch */}
              {currentStep === 5 && (
                <div className="space-y-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-[#C7B892]/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-[#C7A962]" />
                    </div>
                    <h2 className="font-secondary text-xl sm:text-2xl text-[#0a2225] mb-2">
                      You're all set!
                    </h2>
                    <p className="text-sm text-[#6E6650] max-w-md mx-auto">
                      Your creator profile is ready. Head to Creator Lab to start building your first storyboard.
                    </p>
                  </div>

                  {/* Profile preview card */}
                  <div className="p-6 rounded-2xl bg-[#F5EFE1] border border-[#E5DFC6]">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-[#C7B892]/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-[#7A7151]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-secondary text-lg text-[#0a2225]">
                          {displayName || "Your Name"}
                        </h3>
                        {homeBase && (
                          <p className="text-sm text-[#6E6650] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {homeBase}
                          </p>
                        )}
                        {bio && (
                          <p className="text-sm text-[#6E6650] mt-2 line-clamp-2">{bio}</p>
                        )}
                        {niches.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {niches.slice(0, 4).map((niche) => (
                              <span
                                key={niche}
                                className="px-2 py-0.5 text-[10px] rounded-full bg-[#C7B892]/20 text-[#7A7151]"
                              >
                                {niche}
                              </span>
                            ))}
                            {niches.length > 4 && (
                              <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#C7B892]/20 text-[#7A7151]">
                                +{niches.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* What's next */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-[#0a2225] text-sm">What you can do in Creator Lab:</h4>
                    <ul className="space-y-2">
                      {[
                        "Create storyboards from your best trips",
                        "See incoming trip requests from travelers",
                        "Track your earnings and payouts",
                        "Collaborate with verified travel agents",
                      ].map((item) => (
                        <li key={item} className="flex items-center gap-2 text-sm text-[#6E6650]">
                          <div className="w-5 h-5 rounded-full bg-[#C7B892]/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-[#7A7151]" />
                          </div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-8 border-t border-[#E5DFC6]/40 mt-8">
                <Button
                  variant="ghost"
                  onClick={goPrev}
                  disabled={currentStep === 0}
                  className="text-[#6E6650] hover:text-[#0a2225] hover:bg-[#F5EFE1] text-sm rounded-full px-6 gap-2 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    onClick={goNext}
                    className="rounded-full px-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white gap-2 shadow-lg shadow-[#0a2225]/20"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
                    disabled={saving}
                    className="rounded-full px-8 bg-[#0a2225] hover:bg-[#0a2225]/90 text-white gap-2 shadow-lg shadow-[#0a2225]/20"
                  >
                    {saving ? (
                      <>
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Launching...
                      </>
                    ) : (
                      <>
                        Go to Creator Lab
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
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
