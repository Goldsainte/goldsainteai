import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type AgentApplicationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirm: string;
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
  governmentIdFile: File | null;
  professionalHeadshotFile: File | null;
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

export default function AgentApplicationForm() {
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
    password: "",
    passwordConfirm: "",
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
    governmentIdFile: null,
    professionalHeadshotFile: null,
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedVendor: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const DRAFT_STORAGE_KEY = "agent_application_draft";

  // Restore draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          businessType: normalizeBusinessType(parsed.businessType),
        }));
        toast({ title: "Draft restored", description: "We restored your previous answers." });
      }
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave non-file fields whenever formData changes
  useEffect(() => {
    try {
      const {
        businessLicenseFile: _a,
        insuranceCertificateFile: _b,
        governmentIdFile: _c,
        professionalHeadshotFile: _d,
        password: _p,
        passwordConfirm: _pc,
        ...persistable
      } = formData;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(persistable));
    } catch {
      /* noop */
    }
  }, [formData]);

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
      if (!formData.password || formData.password.length < 8) {
        toast({ title: "Password must be at least 8 characters", variant: "destructive" });
        return false;
      }
      if (formData.password !== formData.passwordConfirm) {
        toast({ title: "Passwords don't match", variant: "destructive" });
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

  const handleFileUpload = async (file: File, fieldName: string) => {
    try {
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum is 50MB per file.`,
          variant: "destructive",
        });
        return null;
      }
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${fieldName}.${fileExt}`;
      const filePath = `agent-applications/${formData.email}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('application-documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      return filePath;
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
  };

  const saveDraftApplication = async () => {
    setIsLoading(true);
    try {
      const normalizedBusinessType = normalizeBusinessType(formData.businessType);

      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error("Please fill in all required personal information fields");
      }
      if (!formData.agencyName || !normalizedBusinessType) {
        throw new Error("Please fill in all required business information fields");
      }

      // File uploads
      let businessLicensePath = null;
      let insuranceCertPath = null;
      let govIdPath = null;
      let headshotPath = null;

      if (formData.businessLicenseFile) {
        businessLicensePath = await handleFileUpload(formData.businessLicenseFile, 'business_license');
      }
      if (formData.insuranceCertificateFile) {
        insuranceCertPath = await handleFileUpload(formData.insuranceCertificateFile, 'insurance_certificate');
      }
      if (formData.governmentIdFile) {
        govIdPath = await handleFileUpload(formData.governmentIdFile, 'government_id');
      }
      if (formData.professionalHeadshotFile) {
        headshotPath = await handleFileUpload(formData.professionalHeadshotFile, 'headshot');
      }

      const extendedData = {
        arcNumber: formData.arcNumber,
        cliaNumber: formData.cliaNumber,
        otherCertifications: formData.otherCertifications,
        instagramHandle: formData.instagramHandle,
        tiktokHandle: formData.tiktokHandle,
        linkedinProfileUrl: formData.linkedinProfileUrl,
      };

      const clientId = crypto.randomUUID();

      const { error: applicationError } = await supabase
        .from('agent_applications')
        .insert({
          id: clientId,
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
          document_government_id: govIdPath,
          document_headshot: headshotPath,
          accepted_terms: formData.acceptedTerms,
          accepted_privacy: formData.acceptedPrivacy,
          accepted_vendor: formData.acceptedVendor,
          extended_data: extendedData,
          status: 'pending_verification',
        });

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
        localStorage.removeItem(DRAFT_STORAGE_KEY);
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
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Phone *</Label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Password *</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={luxuryInputClasses}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Confirm Password *</Label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  className={luxuryInputClasses}
                  placeholder="Re-enter password"
                />
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
                <Input value={formData.businessAddress} onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">City</Label>
                <Input value={formData.businessCity} onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">State</Label>
                <Input value={formData.businessState} onChange={(e) => setFormData({ ...formData, businessState: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="text-sm font-medium text-[#0a2225]">Years of Experience</Label>
                <Input type="number" value={formData.yearsExperience} onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })} className={luxuryInputClasses} />
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
                { key: "acceptedPrivacy" as const, label: "Privacy Policy", link: "/privacy" },
                { key: "acceptedVendor" as const, label: "Agent Partnership Agreement", link: "/vendor-agreement" },
              ].map(({ key, label, link }) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData[key]}
                    onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked as boolean })}
                    className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47] mt-0.5"
                  />
                  <label className="text-sm text-[#0a2225]">
                    I accept the <a href={link} target="_blank" className="text-[#C7A962] hover:underline">{label}</a> *
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
            <SectionHeader title="Document Upload" />
            <p className="text-sm text-[#6B7280] -mt-4">Upload the supporting documents needed to complete your application.</p>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Business License", key: "businessLicenseFile" as const },
                  { label: "Insurance Certificate", key: "insuranceCertificateFile" as const },
                  { label: "Government ID", key: "governmentIdFile" as const },
                  { label: "Professional Headshot", key: "professionalHeadshotFile" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <Label className="text-sm text-[#0a2225]">{label}</Label>
                    <label className="mt-1 flex items-center justify-center w-full px-4 py-4 border-2 border-dashed border-[#E5DFC6] rounded-xl cursor-pointer hover:bg-[#F5EFE1]/50 transition-colors">
                      <div className="text-center">
                        {formData[key] ? (
                          <p className="text-sm text-[#0c4d47] font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{formData[key]!.name}</p>
                        ) : (
                          <><Upload className="mx-auto h-6 w-6 text-[#C7A962]" /><p className="mt-1 text-xs text-[#6B7280]">Click to upload</p></>
                        )}
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setFormData({ ...formData, [key]: file });
                      }} />
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#9A9079]">PDF, JPG, or PNG accepted. Max 50MB per file.</p>
            </div>

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
              <h3 className="mb-3 font-secondary text-2xl text-[#0a2225]">Identity Verification Required</h3>
              <p className="text-base text-[#6B7280] max-w-md mx-auto">
                All travel agents must complete identity verification through Stripe Identity.
                This typically takes 2-3 minutes.
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
