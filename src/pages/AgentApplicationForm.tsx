import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Step10Documents } from "@/components/applications/steps/Step10Documents";

const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" }, { code: "CA", name: "California" }, { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" }, { code: "DC", name: "District of Columbia" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" }, { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" }, { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" }, { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" }, { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" }, { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" }, { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" }, { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
  { code: "PR", name: "Puerto Rico" }, { code: "VI", name: "U.S. Virgin Islands" },
  { code: "GU", name: "Guam" }, { code: "AS", name: "American Samoa" }, { code: "MP", name: "Northern Mariana Islands" },
];

const YEARS_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];

type AgentApplicationData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  agencyName: string;
  businessType: "independent" | "agency" | "tour_operator" | "dmc" | "";
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessCountry: string;
  yearEstablished: string;
  website: string;
  businessLicenseNumber: string;
  yearsExperience: string;
  // Step 2: Credentials
  iataNumber: string;
  arcNumber: string;
  cliaNumber: string;
  hostAgencyName: string;
  specializations: string[];
  preferredDestinations: string;
  otherCertifications: string;
  // Step 3: Sales & Presence
  annualSalesVolume: string;
  averageTripValue: string;
  monthlyBookings: string;
  primaryFocus: string[];
  instagramHandle: string;
  tiktokHandle: string;
  linkedinProfileUrl: string;
  whyGoldsainte: string;
  // Step 4: Insurance & Legal
  errorsOmissionsInsurance: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceCoverage: string;
  taxIdEIN: string;
  businessLicenseFile: File | null;
  insuranceCertificateFile: File | null;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedVendor: boolean;
};

const ALLOWED_BUSINESS_TYPES = ["independent", "agency", "tour_operator", "dmc"] as const;
type BusinessType = (typeof ALLOWED_BUSINESS_TYPES)[number];

const LEGACY_BUSINESS_TYPE_MAP: Record<string, BusinessType> = {
  sole_proprietor: "independent",
  partnership: "agency",
  llc: "agency",
  corporation: "agency",
};

const normalizeBusinessType = (value: unknown): BusinessType | "" => {
  if (typeof value !== "string") return "";

  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

  if ((ALLOWED_BUSINESS_TYPES as readonly string[]).includes(normalized)) {
    return normalized as BusinessType;
  }

  return LEGACY_BUSINESS_TYPE_MAP[normalized] ?? "";
};

const luxuryInputClasses = "min-h-[48px] w-full max-w-full border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm box-border";
const luxurySelectClasses = "min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

function AgentApplicationFormInner() {
  const { user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const prefillData = location.state as {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;

  const [step, setStep] = useState(1);
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentApplicationData>({
    firstName: prefillData?.firstName || "",
    lastName: prefillData?.lastName || "",
    email: prefillData?.email || "",
    phone: prefillData?.phone || "",
    dateOfBirth: "",
    agencyName: "",
    businessType: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessZip: "",
    businessCountry: "US",
    yearEstablished: "",
    website: "",
    businessLicenseNumber: "",
    yearsExperience: "",
    iataNumber: "",
    arcNumber: "",
    cliaNumber: "",
    hostAgencyName: "",
    specializations: [],
    preferredDestinations: "",
    otherCertifications: "",
    annualSalesVolume: "",
    averageTripValue: "",
    monthlyBookings: "",
    primaryFocus: [],
    instagramHandle: "",
    tiktokHandle: "",
    linkedinProfileUrl: "",
    whyGoldsainte: "",
    errorsOmissionsInsurance: false,
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceCoverage: "",
    taxIdEIN: "",
    businessLicenseFile: null,
    insuranceCertificateFile: null,
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedVendor: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const LEGACY_DRAFT_STORAGE_KEY = "agent_application_draft";
  const DRAFT_STORAGE_KEY = user?.id
    ? `agent_application_draft:${user.id}`
    : null;

  // Prefill from the authenticated user's profile + auth metadata as soon
  // as the session is ready. Editable, but no retyping required.
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata ?? {}) as Record<string, any>;
    setFormData((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      firstName: prev.firstName || meta.first_name || "",
      lastName: prev.lastName || meta.last_name || "",
      phone: prev.phone || meta.phone || meta.phone_number || "",
    }));
    // Hydrate from profile too (richer source if trigger has run)
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, email")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile) return;
      setFormData((prev) => ({
        ...prev,
        email: prev.email || profile.email || "",
        firstName: prev.firstName || profile.first_name || "",
        lastName: prev.lastName || profile.last_name || "",
        phone: prev.phone || profile.phone || "",
      }));
    })();
    // Also load any existing in-flight application for this user
    (async () => {
      const { data: existing } = await supabase
        .from("agent_applications")
        .select("id, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        setDraftApplicationId(existing.id);
        setApplicationId(existing.id);
      }
    })();
  }, [user]);

  // Offer to restore an earlier draft (opt-in, so a brand-new signup
  // never inherits another applicant's cached answers).
  useEffect(() => {
    // Wait until we know who the user is — drafts are now per-user scoped
    // so a brand-new account never sees another applicant's leftover draft.
    if (!DRAFT_STORAGE_KEY || !user) return;
    try {
      let saved = localStorage.getItem(DRAFT_STORAGE_KEY);

      // One-time migration: if the legacy unscoped draft exists and its
      // email matches the current user, claim it for them. Otherwise
      // discard it — it belonged to a different applicant on this browser.
      const legacy = localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
      if (legacy) {
        try {
          const legacyParsed = JSON.parse(legacy);
          const legacyEmail = (legacyParsed?.email || "").toLowerCase();
          const currentEmail = (user.email || "").toLowerCase();
          if (!saved && legacyEmail && currentEmail && legacyEmail === currentEmail) {
            localStorage.setItem(DRAFT_STORAGE_KEY, legacy);
            saved = legacy;
          }
        } catch {
          /* discard malformed legacy draft */
        }
        localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
      }

      if (!saved) return;
      const parsed = JSON.parse(saved);
      const label = [parsed?.firstName, parsed?.lastName].filter(Boolean).join(" ")
        || parsed?.email
        || "an unfinished application";
      const resume = window.confirm(
        `Resume your previous draft for ${label}?\n\nClick Cancel to start a new application.`
      );
      if (resume) {
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          businessType: normalizeBusinessType(parsed.businessType),
        }));
        toast({ title: "Draft restored" });
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Autosave non-file fields whenever formData changes
  useEffect(() => {
    if (!DRAFT_STORAGE_KEY) return;
    try {
      const {
        businessLicenseFile: _a,
        insuranceCertificateFile: _b,
        ...persistable
      } = formData;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* noop */
    }
  }, [formData, DRAFT_STORAGE_KEY]);

  // Per-step validation with friendly toasts
  const validateStep = (currentStep: number): boolean => {
    const missing = (label: string) => {
      toast({ title: `${label} required`, variant: "destructive" });
      return false;
    };
    if (currentStep === 1) {
      if (!formData.firstName?.trim()) return missing("First name");
      if (!formData.lastName?.trim()) return missing("Last name");
      if (!formData.email?.trim()) return missing("Email");
      if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        toast({ title: "Valid email required", variant: "destructive" });
        return false;
      }
      if (!formData.phone?.trim()) return missing("Phone");
      if (!formData.agencyName?.trim()) return missing("Agency name");
      if (!formData.businessType) return missing("Business type");
      return true;
    }
    if (currentStep === 2) {
      if (formData.specializations.length === 0) {
        toast({ title: "Select at least one specialization", variant: "destructive" });
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (!formData.annualSalesVolume) return missing("Annual sales volume");
      if (!formData.averageTripValue) return missing("Average trip value");
      if (formData.primaryFocus.length === 0) {
        toast({ title: "Select at least one primary focus", variant: "destructive" });
        return false;
      }
      if (!formData.whyGoldsainte?.trim()) return missing("Why Goldsainte");
      return true;
    }
    if (currentStep === 4) {
      if (!formData.acceptedTerms || !formData.acceptedPrivacy || !formData.acceptedVendor) {
        toast({ title: "Please accept all legal agreements", variant: "destructive" });
        return false;
      }
      return true;
    }
    return true;
  };

  const goToStep = (target: number) => {
    if (target > step && !validateStep(step)) return;
    setStep(target);
  };

  const totalSteps = 6;
  const stepLabels = ["You & Your Business", "Credentials", "Sales & Presence", "Insurance & Legal", "Documents", "Verification"];

  const specializationOptions = [
    "Luxury Travel", "Adventure Travel", "Honeymoons & Romance", "Family Travel",
    "Group Travel", "Corporate Travel", "Destination Weddings", "Cruises",
    "All-Inclusive Resorts", "Wellness & Spa", "Culinary Travel", "Safari & Wildlife",
  ];

  const primaryFocusOptions = [
    "High-Net-Worth Clients ($50k+ trips)", "Luxury Leisure Travel",
    "Destination Weddings", "Group Bookings",
    "Corporate Incentive Travel", "Milestone Celebrations",
  ];

  // Uploads run through a service-role edge function because, with email
  // confirmation enabled, there is no auth session immediately after signUp()
  // and the browser cannot satisfy the storage RLS policy. Throws on failure
  // so the caller can block submission and keep the user on the Documents step.
  const handleFileUpload = async (
    file: File,
    fieldName: string,
    userId: string,
    email: string,
  ): Promise<string> => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 50MB per file.`,
      );
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('userId', userId);
    fd.append('applicationEmail', email);
    fd.append('fieldName', fieldName);

    const { data, error } = await supabase.functions.invoke(
      'upload-application-document',
      { body: fd },
    );
    if (error) throw new Error(error.message || `Failed to upload ${fieldName}`);
    if (!data?.path) throw new Error((data as any)?.error || `Failed to upload ${fieldName}`);
    return data.path as string;
  };

  const saveDraftApplication = async () => {
    setIsLoading(true);
    setFormData((prev: any) => ({ ...prev, __documentUploadError: undefined }));
    try {
      const normalizedBusinessType = normalizeBusinessType(formData.businessType);

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error("Please fill in all required personal information fields");
      }
      if (!formData.agencyName || !normalizedBusinessType) {
        throw new Error("Please fill in all required business information fields");
      }
      // Require a confirmed authenticated user before attempting any upload.
      // The route is gated upstream, but we double-check here so an expired
      // or not-yet-ready session produces a clear error on the Documents step
      // instead of a backend 403 from upload-application-document.
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!sessionData?.session?.access_token || !authUser?.id) {
        setStep(5);
        const msg = "Your session isn't ready yet. Please sign in again and retry.";
        setFormData((prev: any) => ({ ...prev, __documentUploadError: msg }));
        throw new Error(msg);
      }
      if (!authUser.email_confirmed_at) {
        setStep(5);
        const msg = "Please confirm your email before uploading documents, then retry.";
        setFormData((prev: any) => ({ ...prev, __documentUploadError: msg }));
        throw new Error(msg);
      }
      if ((authUser.email ?? '').toLowerCase() !== (formData.email ?? '').toLowerCase()) {
        setStep(5);
        const msg = "The application email doesn't match your signed-in account. Please sign in with the matching email.";
        setFormData((prev: any) => ({ ...prev, __documentUploadError: msg }));
        throw new Error(msg);
      }

      // Verify required documents are present before attempting uploads so we
      // keep the user on the Documents step with a clear message rather than
      // producing an application with null document paths.
      const requiredDocs: Array<{ file: File | null | undefined; field: string; label: string }> = [
        { file: formData.businessLicenseFile, field: 'business_license', label: 'Business License' },
        { file: formData.insuranceCertificateFile, field: 'insurance_certificate', label: 'Insurance Certificate' },
      ];
      const missing = requiredDocs.find((d) => !d.file);
      if (missing) {
        setStep(5);
        throw new Error(`${missing.label} is required. Please upload it before continuing.`);
      }

      let businessLicensePath: string;
      let insuranceCertPath: string;
      try {
        businessLicensePath = await handleFileUpload(formData.businessLicenseFile!, 'business_license', authUser.id, formData.email);
        insuranceCertPath = await handleFileUpload(formData.insuranceCertificateFile!, 'insurance_certificate', authUser.id, formData.email);
      } catch (uploadErr: any) {
        setStep(5);
        const msg = uploadErr?.message || 'Document upload failed. Please try again.';
        setFormData((prev: any) => ({ ...prev, __documentUploadError: msg }));
        throw new Error(msg);
      }

      const extendedData = {
        arcNumber: formData.arcNumber,
        cliaNumber: formData.cliaNumber,
        otherCertifications: formData.otherCertifications,
        instagramHandle: formData.instagramHandle,
        tiktokHandle: formData.tiktokHandle,
        linkedinProfileUrl: formData.linkedinProfileUrl,
      };

      // Use the existing in-flight application id if we have one (resume),
      // otherwise mint a new one. We upsert by id so resuming overwrites
      // instead of producing a second row.
      const clientId = draftApplicationId ?? crypto.randomUUID();

      const { error: applicationError } = await supabase
        .from('agent_applications')
        .upsert({
          id: clientId,
          user_id: authUser.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth || null,
          agency_name: formData.agencyName,
          business_type: normalizedBusinessType,
          business_address: formData.businessAddress,
          business_city: formData.businessCity,
          business_state: formData.businessState,
          business_postal_code: formData.businessZip,
          business_country: formData.businessCountry,
          year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
          website: formData.website || null,
          business_registration_number: formData.businessLicenseNumber || null,
          tax_id: formData.taxIdEIN || null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          specialties: formData.specializations,
          primary_focus: formData.primaryFocus,
          average_trip_value: formData.averageTripValue || null,
          monthly_bookings: formData.monthlyBookings || null,
          destinations: formData.preferredDestinations ? [formData.preferredDestinations] : [],
          why_goldsainte: formData.whyGoldsainte || null,
          license_number: formData.iataNumber || null,
          annual_sales_volume: formData.annualSalesVolume || null,
          host_agency_name: formData.hostAgencyName || null,
          insurance_provider: formData.insuranceProvider || null,
          insurance_policy_number: formData.insurancePolicyNumber || null,
          insurance_coverage_amount: formData.insuranceCoverage ? parseFloat(formData.insuranceCoverage) : null,
          document_business_license: businessLicensePath,
          document_insurance_cert: insuranceCertPath,
          accepted_terms: formData.acceptedTerms,
          accepted_privacy: formData.acceptedPrivacy,
          accepted_vendor: formData.acceptedVendor,
          extended_data: extendedData,
          status: 'pending_verification',
        }, { onConflict: 'id' });

      if (applicationError) throw new Error(applicationError.message || 'Failed to save application');

      setDraftApplicationId(clientId);
      setApplicationId(clientId);
      localStorage.setItem('agent_application_email', formData.email);
      localStorage.setItem('agent_application_id', clientId);
      setStep(6);

      // Send confirmation email (non-blocking) via the unified transactional
      // email system so styling matches the rest of the app's emails and the
      // CTA link points to the real /application/status route.
      supabase.functions
        .invoke('send-transactional-email', {
          body: {
            templateName: 'application-received-professional',
            recipientEmail: formData.email,
            idempotencyKey: `agent-application-received-${clientId}`,
            templateData: { agentName: formData.firstName },
          },
        })
        .catch((e) => console.error('application email failed:', e));

      // Clear local draft now that it's persisted server-side
      try {
        if (DRAFT_STORAGE_KEY) localStorage.removeItem(DRAFT_STORAGE_KEY);
        localStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
      } catch {
        /* noop */
      }

      toast({
        title: "Application saved",
        description: "Now complete identity verification to submit your application.",
      });
    } catch (error: any) {
      console.error('Error in saveDraftApplication:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Please check all required fields and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startStripeVerification = async () => {
    if (!draftApplicationId) {
      toast({ title: "Error", description: "Please complete all previous steps first", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-identity-verification', {
        body: {
          email: formData.email,
          applicationType: 'agent',
          metadata: { applicationId: draftApplicationId, firstName: formData.firstName, lastName: formData.lastName },
        },
      });
      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (error: any) {
      console.error('Stripe verification error:', error);
      toast({ title: "Verification setup failed", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
      <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">{title}</h3>
    </div>
  );

  const NavButtons = ({ onBack, onNext, nextLabel, nextDisabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) => (
    <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
      {onBack ? (
        <Button variant="outline" onClick={onBack} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      ) : <div />}
      <Button onClick={onNext} disabled={nextDisabled || isLoading} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <>{nextLabel || "Next"} <ArrowRight className="ml-2 h-4 w-4" /></>}
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <SectionHeader title="You & Your Business" />
            <p className="text-sm text-[#6B7280] -mt-4">Tell us about yourself and your agency.</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">First Name *</Label>
                <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Last Name *</Label>
                <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Email *</Label>
                <Input type="email" value={formData.email} readOnly className={`${luxuryInputClasses} bg-[#FDF9F0] cursor-not-allowed`} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Phone *</Label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Agency Name *</Label>
                <Input value={formData.agencyName} onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Business Type *</Label>
                <Select value={formData.businessType} onValueChange={(value: BusinessType) => setFormData({ ...formData, businessType: value })}>
                  <SelectTrigger className={luxurySelectClasses}><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="independent">Independent Advisor</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="tour_operator">Tour Operator</SelectItem>
                    <SelectItem value="dmc">DMC / Destination Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-[#0a2225]">Business Address</Label>
                <Input
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  className={luxuryInputClasses}
                  autoComplete="street-address"
                  name="street-address"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">City</Label>
                <Input
                  value={formData.businessCity}
                  onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                  className={luxuryInputClasses}
                  autoComplete="address-level2"
                  name="city"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">State</Label>
                <Select
                  value={formData.businessState}
                  onValueChange={(value) => setFormData({ ...formData, businessState: value })}
                >
                  <SelectTrigger className={luxurySelectClasses} aria-label="State">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>
                        {s.name} ({s.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Hidden input so browser autofill of "address-level1" can still populate the value */}
                <input
                  type="text"
                  tabIndex={-1}
                  aria-hidden="true"
                  autoComplete="address-level1"
                  name="state"
                  value={formData.businessState}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    if (!v) return;
                    // Accept either "CA" or "California" from autofill
                    const match = US_STATES.find(
                      (s) => s.code.toLowerCase() === v.toLowerCase() || s.name.toLowerCase() === v.toLowerCase(),
                    );
                    if (match) setFormData({ ...formData, businessState: match.code });
                  }}
                  style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">ZIP Code</Label>
                <Input
                  value={formData.businessZip}
                  onChange={(e) => setFormData({ ...formData, businessZip: e.target.value })}
                  className={luxuryInputClasses}
                  autoComplete="postal-code"
                  name="postal-code"
                  placeholder="10001"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Years of Experience</Label>
                <Select
                  value={formData.yearsExperience}
                  onValueChange={(value) => setFormData({ ...formData, yearsExperience: value })}
                >
                  <SelectTrigger className={luxurySelectClasses} aria-label="Years of experience">
                    <SelectValue placeholder="Select years" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS_OPTIONS.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y === "10+" ? "10+ years" : `${y} year${y === "1" ? "" : "s"}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Website</Label>
                <Input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={luxuryInputClasses} placeholder="https://" />
              </div>
            </div>
            <NavButtons onNext={() => goToStep(2)} />
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <SectionHeader title="Credentials & Expertise" />
            <p className="text-sm text-[#6B7280] -mt-4">Share your professional credentials and areas of expertise.</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">IATA Number</Label>
                <Input value={formData.iataNumber} onChange={(e) => setFormData({ ...formData, iataNumber: e.target.value })} className={luxuryInputClasses} placeholder="Optional" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">ARC Number</Label>
                <Input value={formData.arcNumber} onChange={(e) => setFormData({ ...formData, arcNumber: e.target.value })} className={luxuryInputClasses} placeholder="Optional" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">CLIA Number</Label>
                <Input value={formData.cliaNumber} onChange={(e) => setFormData({ ...formData, cliaNumber: e.target.value })} className={luxuryInputClasses} placeholder="Optional" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Host Agency</Label>
                <Input value={formData.hostAgencyName} onChange={(e) => setFormData({ ...formData, hostAgencyName: e.target.value })} className={luxuryInputClasses} placeholder="If applicable" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium text-[#0a2225]">Other Certifications</Label>
                <Input value={formData.otherCertifications} onChange={(e) => setFormData({ ...formData, otherCertifications: e.target.value })} className={luxuryInputClasses} placeholder="CTA, CTC, etc." />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#0a2225]">Specializations</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {specializationOptions.map((spec) => (
                  <div key={spec} className="flex items-center space-x-2">
                    <Checkbox
                      id={`spec-${spec}`}
                      checked={formData.specializations.includes(spec)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          specializations: checked
                            ? [...formData.specializations, spec]
                            : formData.specializations.filter(s => s !== spec)
                        });
                      }}
                      className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                    />
                    <label htmlFor={`spec-${spec}`} className="text-sm cursor-pointer text-[#0a2225]">{spec}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#0a2225]">Preferred Destinations</Label>
              <Input value={formData.preferredDestinations} onChange={(e) => setFormData({ ...formData, preferredDestinations: e.target.value })} className={luxuryInputClasses} placeholder="e.g. Maldives, Italy, Japan" />
            </div>

            <NavButtons onBack={() => setStep(1)} onNext={() => goToStep(3)} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <SectionHeader title="Sales & Presence" />
            <p className="text-sm text-[#6B7280] -mt-4">Help us understand your business volume and online presence.</p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Annual Sales Volume</Label>
                <Select value={formData.annualSalesVolume} onValueChange={(value) => setFormData({ ...formData, annualSalesVolume: value })}>
                  <SelectTrigger className={luxurySelectClasses}><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_250k">Under $250K</SelectItem>
                    <SelectItem value="250k_500k">$250K - $500K</SelectItem>
                    <SelectItem value="500k_1m">$500K - $1M</SelectItem>
                    <SelectItem value="1m_5m">$1M - $5M</SelectItem>
                    <SelectItem value="over_5m">Over $5M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Average Trip Value</Label>
                <Select value={formData.averageTripValue} onValueChange={(value) => setFormData({ ...formData, averageTripValue: value })}>
                  <SelectTrigger className={luxurySelectClasses}><SelectValue placeholder="Select range" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_5k">Under $5,000</SelectItem>
                    <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10k_25k">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                    <SelectItem value="over_50k">Over $50,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Monthly Bookings</Label>
                <Input value={formData.monthlyBookings} onChange={(e) => setFormData({ ...formData, monthlyBookings: e.target.value })} className={luxuryInputClasses} placeholder="e.g. 10-20" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#0a2225]">Primary Focus</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {primaryFocusOptions.map((focus) => (
                  <div key={focus} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${focus}`}
                      checked={formData.primaryFocus.includes(focus)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          primaryFocus: checked
                            ? [...formData.primaryFocus, focus]
                            : formData.primaryFocus.filter(f => f !== focus)
                        });
                      }}
                      className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                    />
                    <label htmlFor={`focus-${focus}`} className="text-sm cursor-pointer text-[#0a2225]">{focus}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Instagram</Label>
                <Input value={formData.instagramHandle} onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })} className={luxuryInputClasses} placeholder="@handle" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">TikTok</Label>
                <Input value={formData.tiktokHandle} onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })} className={luxuryInputClasses} placeholder="@handle" />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">LinkedIn</Label>
                <Input value={formData.linkedinProfileUrl} onChange={(e) => setFormData({ ...formData, linkedinProfileUrl: e.target.value })} className={luxuryInputClasses} placeholder="URL" />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-[#0a2225]">Why Goldsainte?</Label>
              <Textarea value={formData.whyGoldsainte} onChange={(e) => setFormData({ ...formData, whyGoldsainte: e.target.value })} className={`${luxuryInputClasses} min-h-[100px]`} placeholder="What excites you about partnering with Goldsainte?" />
            </div>

            <NavButtons onBack={() => setStep(2)} onNext={() => goToStep(4)} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <SectionHeader title="Insurance & Legal" />
            <p className="text-sm text-[#6B7280] -mt-4">Provide insurance details and accept our terms.</p>

            {/* Insurance */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.errorsOmissionsInsurance}
                  onCheckedChange={(checked) => setFormData({ ...formData, errorsOmissionsInsurance: checked as boolean })}
                  className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                />
                <Label className="text-sm text-[#0a2225] cursor-pointer">I carry Errors & Omissions (E&O) Insurance</Label>
              </div>
              {formData.errorsOmissionsInsurance && (
                <div className="grid gap-4 md:grid-cols-3 pl-7">
                  <div>
                    <Label className="text-sm text-[#0a2225]">Insurance Provider</Label>
                    <Input value={formData.insuranceProvider} onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })} className={luxuryInputClasses} />
                  </div>
                  <div>
                    <Label className="text-sm text-[#0a2225]">Policy Number</Label>
                    <Input value={formData.insurancePolicyNumber} onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })} className={luxuryInputClasses} />
                  </div>
                  <div>
                    <Label className="text-sm text-[#0a2225]">Coverage Amount ($)</Label>
                    <Input type="number" value={formData.insuranceCoverage} onChange={(e) => setFormData({ ...formData, insuranceCoverage: e.target.value })} className={luxuryInputClasses} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-[#0a2225]">Tax ID / EIN</Label>
              <Input value={formData.taxIdEIN} onChange={(e) => setFormData({ ...formData, taxIdEIN: e.target.value })} className={luxuryInputClasses} placeholder="XX-XXXXXXX" />
            </div>

            {/* Legal Acceptance */}
            <div className="space-y-4 border-t border-[#E5DFC6] pt-6">
              <h4 className="font-medium text-[#0a2225]">Legal Agreements</h4>
              {[
                { key: "acceptedTerms" as const, label: "Terms of Service", link: "/terms" },
                { key: "acceptedPrivacy" as const, label: "Privacy Policy", link: "/privacy-cookies" },
                { key: "acceptedVendor" as const, label: "Agent Partnership Agreement", link: "/legal/agent-agreement" },
              ].map(({ key, label, link }) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData[key]}
                    onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked as boolean })}
                    className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47] mt-0.5"
                  />
                  <label className="text-sm text-[#0a2225]">
                    I accept the <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#C7A962] hover:underline">{label}</a> *
                  </label>
                </div>
              ))}
            </div>

            <NavButtons
              onBack={() => setStep(3)}
              onNext={() => goToStep(5)}
              nextLabel="Continue to Documents"
              nextDisabled={!formData.acceptedTerms || !formData.acceptedPrivacy || !formData.acceptedVendor}
            />
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <Step10Documents formData={formData} setFormData={setFormData} />

            <NavButtons
              onBack={() => setStep(4)}
              onNext={saveDraftApplication}
              nextLabel="Continue to Verification"
            />
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF9F0] border border-[#C7A962]/30">
                <Shield className="h-10 w-10 text-[#C7A962]" />
              </div>
              <h3 className="mb-3 font-secondary text-2xl text-[#0a2225]">One Last Step — Verify Your Identity</h3>
              <p className="text-base text-[#6B7280] max-w-md mx-auto">
                Completing Stripe Identity verification activates your advisor account
                <strong className="text-[#0a2225]"> immediately</strong> — there is no waiting period
                or admin review. Takes 2–3 minutes.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0]/50 p-6">
              <h4 className="mb-3 text-sm font-semibold text-[#0a2225]">What you'll need:</h4>
              <ul className="space-y-2 text-sm text-[#6B7280]">
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />Government-issued photo ID</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />Device with camera for selfie verification</li>
                <li className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />2-3 minutes to complete</li>
              </ul>
            </div>

            <Button
              type="button"
              onClick={startStripeVerification}
              disabled={isLoading}
              className="w-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full min-h-[52px] text-base"
              size="lg"
            >
              {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Setting up verification...</> : <><Shield className="mr-2 h-5 w-5" />Start Identity Verification</>}
            </Button>

            <p className="text-center text-xs text-[#9A9079]">
              Your information is secure and encrypted. <em className="font-secondary">Goldsainte</em> uses Stripe Identity for verification and does not store your government ID.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-3 sm:px-4 py-8 md:py-16 overflow-x-hidden">
      <div className="mx-auto max-w-4xl w-full">
        <div className="mb-10 text-center">
          <h1 className="mb-4 font-secondary text-[26px] md:text-[31px] lg:text-[36px] text-[#0a2225]">
            Grow Your Luxury Travel Business With <em>Goldsainte</em>
          </h1>
          <p className="text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            Become part of an exclusive advisor network where you can collaborate with creators, publish signature trips, and connect with travelers who value elevated experiences.
          </p>

          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i + 1 <= step ? 'bg-[#C7A962]' : 'bg-[#E5DFC6]'}`} />
              ))}
            </div>
            <span className="text-xs text-[#6B7280] ml-3">Step {step} of {totalSteps}</span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {stepLabels.map((label, index) => (
              <div
                key={label}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  index + 1 < step ? 'bg-[#0c4d47] text-[#E5DFC6]'
                    : index + 1 === step ? 'bg-[#C7A962] text-white'
                    : 'bg-[#E5DFC6] text-[#6B7280]'
                }`}
              >
                {index + 1 < step && <CheckCircle2 className="h-3 w-3 inline mr-1" />}
                {label}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-white border border-[#E5DFC6] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <CardContent className="p-4 sm:p-6 md:p-10">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Outer gate. The form body lives in AgentApplicationFormInner and only
// mounts AFTER we've confirmed the user is signed in and email-confirmed.
// This guarantees no prefill effect, draft-restore prompt, or autosave
// runs for an unauthenticated visitor — and the form never flashes.
export default function AgentApplicationForm() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF9F0]">
        <Loader2 className="h-6 w-6 animate-spin text-[#0c4d47]" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/auth?mode=signup&role=agent" replace />;
  }
  if (!user.email_confirmed_at) {
    return <Navigate to="/auth?mode=signup&role=agent" replace />;
  }

  return <AgentApplicationFormInner />;
}
