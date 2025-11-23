import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Sparkles, User, PenSquare, Building2, Globe, AlertCircle, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Role = "traveler" | "creator" | "agent";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Form state
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [primaryPlatform, setPrimaryPlatform] = useState("");
  const [website, setWebsite] = useState("");
  
  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Check authentication
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
      
      if (!user) {
        navigate("/auth?redirect=/onboarding");
      } else {
        checkOnboardingStatus(user.id);
      }
    }
    getUser();
  }, [navigate]);

  // Check if user already completed onboarding
  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_completed, role, full_name, display_name")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      
      if (data?.onboarding_completed) {
        toast.info("You've already completed onboarding!");
        navigate("/marketplace");
        return;
      }
      
      // Pre-fill any existing data
      if (data?.full_name) setFullName(data.full_name);
      if (data?.display_name) setDisplayName(data.display_name);
      if (data?.role) setRole(data.role as Role);
    } catch (err) {
      console.error("Error checking onboarding status:", err);
    }
  };

  // Check display name availability with debounce
  useEffect(() => {
    if (!displayName || displayName.length < 3) {
      setNameAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingName(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("display_name", displayName.trim())
          .neq("id", user?.id || "")
          .single();
        
        setNameAvailable(!data);
      } catch (err: any) {
        // No match found means name is available
        if (err.code === "PGRST116") {
          setNameAvailable(true);
        } else {
          console.error("Error checking name:", err);
        }
      } finally {
        setCheckingName(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [displayName, user]);

  // Validate form
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!role) errors.push("Please select how you'll use Goldsainte");
    if (!fullName.trim()) errors.push("Full name is required");
    if (!displayName.trim()) errors.push("Display name is required");
    if (displayName && displayName.length < 3) errors.push("Display name must be at least 3 characters");
    if (displayName && displayName.length > 30) errors.push("Display name must be under 30 characters");
    if (bio && bio.length > 500) errors.push("Bio must be under 500 characters");
    if (nameAvailable === false) errors.push("This display name is already taken");
    
    // Role-specific validation
    if (role === "agent" && agencyName && agencyName.length > 100) {
      errors.push("Agency name must be under 100 characters");
    }
    
    if (website && !isValidUrl(website)) {
      errors.push("Please enter a valid website URL");
    }
    
    return errors;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setErrors([]);
    setSubmitting(true);
    
    try {
      if (!user) throw new Error("Not authenticated");

      // Final check on display name
      if (nameAvailable === false) {
        toast.error("Display name is taken. Please choose another.");
        setSubmitting(false);
        return;
      }

      // Prepare update data
      const updateData: any = {
        full_name: fullName.trim(),
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        role: role,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add role-specific fields
      if (role === "agent") {
        updateData.agency_name = agencyName.trim() || null;
        updateData.website = website.trim() || null;
      }
      
      if (role === "creator") {
        updateData.primary_platform = primaryPlatform || null;
        updateData.website = website.trim() || null;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;

      // Success! Welcome the user
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Welcome to Goldsainte, {displayName}!</span>
          <span className="text-xs">Taking you to your personalized dashboard...</span>
        </div>
      );
      
      // Role-based redirect
      setTimeout(() => {
        const redirectMap = {
          creator: "/creator-lab",
          agent: "/marketplace?tab=trip-requests", 
          traveler: "/marketplace"
        };
        navigate(redirectMap[role!]);
      }, 1500);
      
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast.error(err.message || "Failed to complete onboarding. Please try again.");
      setSubmitting(false);
    }
  };

  // Skip onboarding for now
  const handleSkip = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ role: "traveler" })
        .eq("id", user.id);
    }
    navigate("/marketplace");
  };

  const roleCards: { id: Role; label: string; title: string; body: string; icon: string }[] = [
    {
      id: "traveler",
      label: "Traveler",
      title: "Post trips and match with creators + agents",
      body: "Share your wishlist, non-negotiables and preferred style. Goldsainte pairs you with a team that designs and runs the journey.",
      icon: "✈️"
    },
    {
      id: "creator",
      label: "Creator",
      title: "Design storyboards and co-sell trips",
      body: "Turn your content into bookable journeys, collaborate with agents, and bring your audience into the Goldsainte marketplace.",
      icon: "🎬"
    },
    {
      id: "agent",
      label: "Travel Agent",
      title: "Plug in expertise, contracts and logistics",
      body: "Layer your operations, contracts and inventory into creator-led storyboards to deliver white-glove execution.",
      icon: "🎯"
    },
  ];

  const roleHelperText =
    role === "traveler"
      ? "We'll tailor your dashboard around trip requests, saved storyboards and bookings."
      : role === "creator"
      ? "We'll unlock the Goldsainte Creator Lab, storyboards, and marketplace tools to help you co-sell trips."
      : role === "agent"
      ? "We'll focus your view on proposals, traveler pipelines, and operations."
      : "Choose the role that best matches how you'll primarily use Goldsainte. You can collaborate across roles later.";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-pulse">
            <Sparkles className="h-8 w-8 mx-auto text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#07161f,_#02060a_45%,_#f5efe0_120%)] text-foreground">
      <Header />

      <main className="flex justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-black/55 px-6 py-8 shadow-2xl backdrop-blur-md md:px-10 md:py-10">
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-[#E5DFC6]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Goldsainte onboarding</span>
          </div>

          {/* Heading */}
          <div className="space-y-2 md:space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#F7F2E6] md:text-3xl">
              Tell us how you travel with Goldsainte
            </h1>
            <p className="max-w-xl text-xs leading-relaxed text-[#C1BBA2] md:text-sm">
              Choose your role and set up a short profile. This helps us match the
              right travelers, creators and agents — and keeps the marketplace safe
              and curated.
            </p>
          </div>

          {/* Error display */}
          {errors.length > 0 && (
            <Alert variant="destructive" className="mt-6 border-red-900/50 bg-red-950/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            {/* Roles */}
            <section className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#E5DFC6]">
                How are you using Goldsainte? *
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {roleCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setRole(card.id)}
                    className={cn(
                      "flex h-full flex-col rounded-2xl border px-3.5 py-3 text-left transition",
                      "border-white/12 bg-white/5 hover:border-[#BFAD72] hover:bg-white/[0.07]",
                      role === card.id &&
                        "border-[#BFAD72] bg-white/[0.10] ring-1 ring-[#BFAD72]"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{card.icon}</span>
                      <span className="text-xs font-semibold text-[#F7F2E6]">
                        {card.label}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] font-medium leading-snug text-[#E5DFC6]">
                      {card.title}
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#A6A08A]">
                      {card.body}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#A9A393]">{roleHelperText}</p>
            </section>

            {/* Name fields */}
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-[#F7F2E6]">
                    <User className="h-3.5 w-3.5" />
                    Full name *
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your legal name"
                    required
                    className="h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:border-[#BFAD72] focus:ring-0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-medium text-[#F7F2E6]">
                    <PenSquare className="h-3.5 w-3.5" />
                    Display name * 
                    {checkingName && (
                      <span className="text-[10px] text-[#A9A393]">Checking...</span>
                    )}
                    {!checkingName && nameAvailable === true && displayName.length >= 3 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-400">
                        <Check className="h-3 w-3" /> Available
                      </span>
                    )}
                    {!checkingName && nameAvailable === false && (
                      <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                        <X className="h-3 w-3" /> Taken
                      </span>
                    )}
                  </label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you'll appear publicly"
                    required
                    minLength={3}
                    maxLength={30}
                    className={cn(
                      "h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:ring-0",
                      nameAvailable === false ? "border-red-500/50 focus:border-red-500" : "focus:border-[#BFAD72]",
                      nameAvailable === true && displayName.length >= 3 ? "border-emerald-500/50" : ""
                    )}
                  />
                </div>
              </div>

              {/* Role-specific fields */}
              {role === "agent" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-xs font-medium text-[#F7F2E6]">
                      <Building2 className="h-3.5 w-3.5" />
                      Agency/Company
                    </label>
                    <Input
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="Your travel agency (optional)"
                      className="h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:border-[#BFAD72] focus:ring-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-xs font-medium text-[#F7F2E6]">
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://your-agency.com (optional)"
                      type="url"
                      className="h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:border-[#BFAD72] focus:ring-0"
                    />
                  </div>
                </div>
              )}

              {role === "creator" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[#F7F2E6]">
                      Primary Platform
                    </label>
                    <Select value={primaryPlatform} onValueChange={setPrimaryPlatform}>
                      <SelectTrigger className="h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6]">
                        <SelectValue placeholder="Select your main platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1 text-xs font-medium text-[#F7F2E6]">
                      <Globe className="h-3.5 w-3.5" />
                      Website/Link
                    </label>
                    <Input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Your content URL (optional)"
                      type="url"
                      className="h-11 rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:border-[#BFAD72] focus:ring-0"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#F7F2E6]">
                  Short bio
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder={
                    role === "creator"
                      ? "How do you like to create? Niches, destinations, visual style, audience..."
                      : role === "agent"
                      ? "Share your specialties: regions, supplier partners, client profile, non-negotiables..."
                      : "How do you like to travel? Styles, favorite destinations, non-negotiables..."
                  }
                  className="rounded-2xl border-white/15 bg-black/40 text-xs text-[#F7F2E6] placeholder:text-[#7F7864] focus:border-[#BFAD72] focus:ring-0 resize-none"
                />
                <div className="flex justify-between">
                  <p className="text-[10px] text-[#A9A393]">
                    This helps others understand your style at a glance
                  </p>
                  <p className="text-[10px] text-[#A9A393]">
                    {bio.length}/500
                  </p>
                </div>
              </div>
            </section>

            {/* Submit */}
            <section className="space-y-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || !role || !fullName.trim() || !displayName.trim() || nameAvailable === false}
                className="flex w-full items-center justify-center rounded-full bg-[#BFAD72] px-6 py-2.5 text-sm font-semibold text-[#111210] shadow-md transition hover:bg-[#d0c183] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Setting up your account..." : "Complete Onboarding"}
              </Button>
              
              <button
                type="button"
                onClick={handleSkip}
                className="w-full text-[11px] text-[#A9A393] hover:text-[#F7F2E6] transition"
              >
                Skip for now (you can complete this later)
              </button>
              
              <p className="text-[10px] text-center text-[#A9A393]">
                By continuing, you agree to keep conversations and bookings on Goldsainte
                so we can protect travelers and partners on both sides. Learn more in our{" "}
                <a
                  href="/terms"
                  className="underline underline-offset-2 hover:text-[#F7F2E6]"
                >
                  Terms & Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/cancellation-refund-policy"
                  className="underline underline-offset-2 hover:text-[#F7F2E6]"
                >
                  Cancellation & Refund Policy
                </a>
                .
              </p>
            </section>
          </form>
        </div>
      </main>
    </div>
  );
}
