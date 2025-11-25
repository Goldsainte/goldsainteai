import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import logomark from "@/assets/logomark-gold.png";

type StyleTag =
  | "Design-led"
  | "Coastal"
  | "Urban"
  | "Heritage"
  | "Wellness"
  | "Adventure"
  | "Desert"
  | "Mountain";

const STYLE_TAGS: StyleTag[] = [
  "Design-led",
  "Coastal",
  "Urban",
  "Heritage",
  "Wellness",
  "Adventure",
  "Desert",
  "Mountain",
];

const BRAND_TYPES = [
  "Hotel",
  "Resort",
  "Villa / Home",
  "Boutique Stay",
  "Restaurant / Bar",
  "Experience Brand",
  "Retail / Design Brand",
];

export default function BrandOnboardingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [website, setWebsite] = useState("");
  const [brandType, setBrandType] = useState("");
  const [primaryRegions, setPrimaryRegions] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [styleTags, setStyleTags] = useState<string[]>([]);

  // Brand applications are ANONYMOUS - no auth required
  useEffect(() => {
    // No need to load existing profile for anonymous applications
    setLoading(false);

  }, []);

  const toggleTag = (tag: string) => {
    setStyleTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    // Anonymous submission - no auth required
    setError(null);

    if (!brandName.trim()) {
      setError("Please enter your brand name.");
      return;
    }
    if (!brandType.trim()) {
      setError("Please choose a brand category.");
      return;
    }

    setSaving(true);
    try {
      const regionsArray = primaryRegions
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      // Create anonymous application record (no brand_profile_id yet)
      const { data: application, error: appError } = await supabase
        .from('brand_applications')
        .insert({
          brand_name: brandName.trim(),
          brand_type: brandType,
          primary_contact_email: 'placeholder@temp.com', // Must collect actual email in full form
          primary_contact_name: brandName.trim(), // Temporary - should collect actual name
          primary_contact_phone: '+10000000000', // Temporary - must collect actual phone
          website: website.trim() || null,
          regions: regionsArray,
          style_tags: styleTags,
          tagline: tagline.trim() || null,
          bio: bio.trim() || null,
          status: 'pending_verification',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (appError) {
        console.error("Error creating application:", appError);
        setError("We couldn't create your application. Please try again.");
        return;
      }

      // Initiate Stripe Identity verification (anonymous)
      const { data: verificationData, error: verificationError } = 
        await supabase.functions.invoke('create-stripe-identity-session', {
          body: {
            email: 'placeholder@temp.com', // Must collect actual email in full form
            firstName: brandName.trim().split(' ')[0],
            lastName: 'Brand',
            applicationType: 'brand',
            applicationId: application.id,
          },
        });

      if (verificationError) {
        console.error("Verification error:", verificationError);
        setError("We couldn't start identity verification. Please contact support.");
        return;
      }

      // Redirect to Stripe Identity
      window.location.href = verificationData.url;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-xs text-muted-foreground">Preparing your studio…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start">
        {/* Left: hero copy */}
        <div className="md:w-2/5 space-y-4">
          <div className="flex items-center gap-2">
            <img
              src={logomark}
              alt="Goldsainte"
              className="h-10 w-10 rounded-full border border-[#E5DFC6] bg-[#0a2225]"
            />
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#7A7151]">
              Goldsainte Brand Studio
            </span>
          </div>

          <h1 className="font-secondary text-3xl md:text-4xl text-[#0a2225]">
            Let&apos;s set the tone for your brand on Goldsainte.
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Think of this as your Farfetch x Mr &amp; Mrs Smith moment: a clean,
            cinematic space where travelers, creators, and agents discover your
            world through collections, moodboards, and experiences.
          </p>

          <p className="text-[11px] text-[#8C8470]">
            You can refine all of this later in your Brand Console. For now,
            we&apos;re capturing the essentials to start curating the right
            travelers and creators to you.
          </p>
        </div>

        {/* Right: brand form */}
        <div className="md:w-3/5">
          <Card className="border border-border bg-card/90 backdrop-blur-sm rounded-[32px] shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-card-foreground">
                Brand profile basics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="brandName">Brand name</Label>
                <Input
                  id="brandName"
                  placeholder="e.g. Goldsainte Residences, Hotel Delaunay"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  placeholder="https://"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Brand category</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {BRAND_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      className={`rounded-2xl border px-3 py-2 text-left transition-all ${
                        brandType === type
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-card-foreground"
                      }`}
                      onClick={() => setBrandType(type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="regions">
                  Primary regions or destinations
                </Label>
                <Input
                  id="regions"
                  placeholder="e.g. Amalfi Coast, Caribbean, London, Marrakech"
                  value={primaryRegions}
                  onChange={(e) => setPrimaryRegions(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Comma-separated. This helps us match you to travelers already
                  dreaming about these places.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="tagline">Tagline (optional)</Label>
                <Input
                  id="tagline"
                  placeholder="A single line that captures your world."
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="bio">Short brand story</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder="Who are you for? What makes stays or experiences with you feel special, cinematic, or unforgettable?"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Style & vibe tags</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`rounded-full border px-3 py-1 text-[11px] ${
                        styleTags.includes(tag)
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-card-foreground"
                      }`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {styleTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {styleTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-border bg-muted/50 text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}

              <Button
                className="mt-2 w-full rounded-full text-sm font-semibold"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving brand profile…" : "Continue to Brand Console"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
