import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Step2BusinessCompliance } from "@/components/applications/steps/Step2BusinessCompliance";
import { Step3ProfessionalCredentials } from "@/components/applications/steps/Step3ProfessionalCredentials";
import { Step4ExperienceExpertise } from "@/components/applications/steps/Step4ExperienceExpertise";
import { Step5ClientSales } from "@/components/applications/steps/Step5ClientSales";
import { Step6OnlinePresence } from "@/components/applications/steps/Step6OnlinePresence";
import { Step7Technology } from "@/components/applications/steps/Step7Technology";
import { Step8EmergencyLegal } from "@/components/applications/steps/Step8EmergencyLegal";

type AgentApplicationData = {
  // Existing fields
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  agencyName: string;
  businessType: "sole_proprietor" | "partnership" | "llc" | "corporation" | "";
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessCountry: string;
  yearEstablished: string;
  website: string;
  iataNumber: string;
  arcNumber: string;
  cliaNumber: string;
  otherCertifications: string;
  yearsExperience: string;
  specializations: string[];
  sellerOfTravelLicense: string;
  sellerOfTravelState: string;
  businessLicenseNumber: string;
  taxIdEIN: string;
  annualRevenue: string;
  errorsOmissionsInsurance: boolean;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceCoverage: string;
  reference1Name: string;
  reference1Company: string;
  reference1Email: string;
  reference1Phone: string;
  reference2Name: string;
  reference2Company: string;
  reference2Email: string;
  reference2Phone: string;
  bankName: string;
  accountHolderName: string;
  accountType: "checking" | "savings" | "";
  routingNumber: string;
  accountNumber: string;
  primaryFocus: string[];
  averageTripValue: string;
  monthlyBookings: string;
  preferredDestinations: string;
  whyGoldsainte: string;
  businessLicenseFile: File | null;
  insuranceCertificateFile: File | null;
  governmentIdFile: File | null;
  professionalHeadshotFile: File | null;

  // Section 2: Business Compliance (NEW)
  dbaNames?: string;
  operatingStates?: string[];
  sellerOfTravelStates?: string[];
  floridaRegistrationNumber?: string;
  californiaRegistrationNumber?: string;
  hawaiiRegistrationNumber?: string;
  washingtonRegistrationNumber?: string;
  suretyBondAmount?: string;
  suretyBondProvider?: string;
  suretyBondExpiration?: string;
  backgroundCheckConsent?: boolean;
  criminalHistoryDisclosure?: string;

  // Section 3: Professional Credentials (NEW)
  iatanIdNumber?: string;
  astaVerifiedTravelAdvisor?: boolean;
  astaMembershipNumber?: string;
  travelInstituteCta?: boolean;
  travelInstituteCtc?: boolean;
  cliaCertificationLevel?: string;
  hostAgencyName?: string;
  hostAgencyAffiliation?: string;
  yearsWithHostAgency?: string;

  // Section 4: Experience & Expertise (NEW)
  countriesVisitedCount?: string;
  famTripsTakenLastYear?: string;
  continentsVisited?: string[];
  destinationExpertCertifications?: string[];
  cruiseExperienceLevel?: string;
  allInclusiveExperience?: string;
  accessibilityTravelExperience?: boolean;
  multigenerationalTravelExperience?: boolean;
  soloTravelBookingExperience?: boolean;
  languagesSpoken?: string[];

  // Section 5: Client Sales (NEW)
  annualSalesVolume?: string;
  numberOfActiveClients?: string;
  percentageRepeatClients?: string;
  percentageReferralBusiness?: string;
  bookingVolumeLast12Months?: string;
  averageCommissionPercentage?: string;
  clientDemographics?: string[];
  averageClientAgeRange?: string;
  gdsAccess?: string[];
  preferredBookingPlatforms?: string[];
  preferredSuppliers?: string[];
  consortiumMemberships?: string[];

  // Section 6: Online Presence (NEW)
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookPageUrl?: string;
  linkedinProfileUrl?: string;
  youtubeChannelUrl?: string;
  blogUrl?: string;
  googleBusinessProfile?: string;
  socialMediaFollowersTotal?: string;
  onlineReviewsCount?: string;
  averageReviewRating?: string;
  contentCreationExperience?: boolean;
  videoContentCreation?: boolean;
  influencerPartnerships?: boolean;
  emailMarketingPlatform?: string;
  emailListSize?: string;

  // Section 7: Technology (NEW)
  crmSoftware?: string;
  bookingPlatform?: string;
  accountingSoftware?: string;
  websitePlatform?: string;
  hasOwnBookingEngine?: boolean;
  comfortableWithTechnology?: number;
  videoConferencingTools?: string[];
  aiToolsExperience?: string[];

  // Section 8: Emergency & Legal (NEW)
  support24_7?: boolean;
  travelCrisisManagementTraining?: boolean;
  travelInsuranceLicensed?: boolean;
  emergencyContactPhone?: string;
  afterHoursAvailability?: string;
  crisisResponseExamples?: string;
  privacyPolicyUrl?: string;
  termsAndConditionsUrl?: string;
  gdprCompliant?: boolean;
  ccpaCompliant?: boolean;
  clientDataProtectionMeasures?: string;
  contractsWithClients?: boolean;
  legalCounselOnRetainer?: boolean;
  previousLegalIssues?: string;
  regulatoryViolations?: string;
};

export default function AgentApplicationForm() {
  const [step, setStep] = useState(1);
  const [stripeVerificationComplete, setStripeVerificationComplete] = useState(false);
  const [draftApplicationId, setDraftApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AgentApplicationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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
    iataNumber: "",
    arcNumber: "",
    cliaNumber: "",
    otherCertifications: "",
    yearsExperience: "",
    specializations: [],
    sellerOfTravelLicense: "",
    sellerOfTravelState: "",
    businessLicenseNumber: "",
    taxIdEIN: "",
    annualRevenue: "",
    errorsOmissionsInsurance: false,
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceCoverage: "",
    reference1Name: "",
    reference1Company: "",
    reference1Email: "",
    reference1Phone: "",
    reference2Name: "",
    reference2Company: "",
    reference2Email: "",
    reference2Phone: "",
    bankName: "",
    accountHolderName: "",
    accountType: "",
    routingNumber: "",
    accountNumber: "",
    primaryFocus: [],
    averageTripValue: "",
    monthlyBookings: "",
    preferredDestinations: "",
    whyGoldsainte: "",
    businessLicenseFile: null,
    insuranceCertificateFile: null,
    governmentIdFile: null,
    professionalHeadshotFile: null,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const specializationOptions = [
    "Luxury Travel",
    "Adventure Travel",
    "Honeymoons & Romance",
    "Family Travel",
    "Group Travel",
    "Corporate Travel",
    "Destination Weddings",
    "Cruises",
    "All-Inclusive Resorts",
    "Wellness & Spa",
    "Culinary Travel",
    "Safari & Wildlife",
  ];

  const primaryFocusOptions = [
    "High-Net-Worth Clients ($50k+ trips)",
    "Luxury Leisure Travel",
    "Destination Weddings",
    "Group Bookings",
    "Corporate Incentive Travel",
    "Milestone Celebrations",
  ];

  const handleFileUpload = async (file: File, fieldName: string) => {
    try {
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
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };

  const saveDraftApplication = async () => {
    setIsLoading(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error("Please fill in all required personal information fields");
      }

      if (!formData.agencyName || !formData.businessType || !formData.businessLicenseNumber) {
        throw new Error("Please fill in all required business information fields");
      }

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

      const { data: applicationData, error: applicationError } = await supabase
        .from('agent_applications')
        .insert({
          // Personal & Business Info
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth || null,
          agency_name: formData.agencyName,
          business_type: formData.businessType,
          business_address: formData.businessAddress,
          business_city: formData.businessCity,
          business_state: formData.businessState,
          business_zip: formData.businessZip,
          business_country: formData.businessCountry,
          year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
          website: formData.website || null,
          business_license_number: formData.businessLicenseNumber,
          tax_id_ein: formData.taxIdEIN || null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          specialties: formData.specializations,
          primary_focus: formData.primaryFocus,
          average_trip_value: formData.averageTripValue || null,
          monthly_bookings: formData.monthlyBookings || null,
          preferred_destinations: formData.preferredDestinations || null,
          why_goldsainte: formData.whyGoldsainte || null,

          // Business Compliance
          dba_names: formData.dbaNames || null,
          operating_states: formData.operatingStates || [],
          seller_of_travel_states: formData.sellerOfTravelStates || [],
          florida_registration_number: formData.floridaRegistrationNumber || null,
          california_registration_number: formData.californiaRegistrationNumber || null,
          hawaii_registration_number: formData.hawaiiRegistrationNumber || null,
          washington_registration_number: formData.washingtonRegistrationNumber || null,
          surety_bond_amount: formData.suretyBondAmount ? parseFloat(formData.suretyBondAmount) : null,
          surety_bond_provider: formData.suretyBondProvider || null,
          surety_bond_expiration: formData.suretyBondExpiration || null,
          background_check_consent: formData.backgroundCheckConsent || false,
          criminal_history_disclosure: formData.criminalHistoryDisclosure || null,

          // Professional Credentials
          iata_number: formData.iataNumber || null,
          arc_number: formData.arcNumber || null,
          clia_number: formData.cliaNumber || null,
          iatan_id_number: formData.iatanIdNumber || null,
          asta_verified_travel_advisor: formData.astaVerifiedTravelAdvisor || false,
          asta_membership_number: formData.astaMembershipNumber || null,
          travel_institute_cta: formData.travelInstituteCta || false,
          travel_institute_ctc: formData.travelInstituteCtc || false,
          clia_certification_level: formData.cliaCertificationLevel || null,
          host_agency_name: formData.hostAgencyName || null,
          host_agency_affiliation: formData.hostAgencyAffiliation || null,
          years_with_host_agency: formData.yearsWithHostAgency ? parseInt(formData.yearsWithHostAgency) : null,
          other_certifications: formData.otherCertifications || null,

          // Travel Experience
          countries_visited_count: formData.countriesVisitedCount ? parseInt(formData.countriesVisitedCount) : null,
          fam_trips_taken_last_year: formData.famTripsTakenLastYear ? parseInt(formData.famTripsTakenLastYear) : null,
          continents_visited: formData.continentsVisited || [],
          destination_expert_certifications: formData.destinationExpertCertifications || [],
          cruise_experience_level: formData.cruiseExperienceLevel || null,
          all_inclusive_experience: formData.allInclusiveExperience || null,
          accessibility_travel_experience: formData.accessibilityTravelExperience || false,
          multigenerational_travel_experience: formData.multigenerationalTravelExperience || false,
          solo_travel_booking_experience: formData.soloTravelBookingExperience || false,
          languages_spoken: formData.languagesSpoken || [],

          // Client & Sales
          annual_sales_volume: formData.annualSalesVolume || null,
          number_of_active_clients: formData.numberOfActiveClients ? parseInt(formData.numberOfActiveClients) : null,
          percentage_repeat_clients: formData.percentageRepeatClients ? parseInt(formData.percentageRepeatClients) : null,
          percentage_referral_business: formData.percentageReferralBusiness ? parseInt(formData.percentageReferralBusiness) : null,
          booking_volume_last_12_months: formData.bookingVolumeLast12Months ? parseInt(formData.bookingVolumeLast12Months) : null,
          average_commission_percentage: formData.averageCommissionPercentage ? parseFloat(formData.averageCommissionPercentage) : null,
          client_demographics: formData.clientDemographics || [],
          average_client_age_range: formData.averageClientAgeRange || null,
          gds_access: formData.gdsAccess || [],
          preferred_booking_platforms: formData.preferredBookingPlatforms || [],
          preferred_suppliers: formData.preferredSuppliers || [],
          consortium_memberships: formData.consortiumMemberships || [],

          // Online Presence
          instagram_handle: formData.instagramHandle || null,
          tiktok_handle: formData.tiktokHandle || null,
          facebook_page_url: formData.facebookPageUrl || null,
          linkedin_profile_url: formData.linkedinProfileUrl || null,
          youtube_channel_url: formData.youtubeChannelUrl || null,
          blog_url: formData.blogUrl || null,
          google_business_profile: formData.googleBusinessProfile || null,
          social_media_followers_total: formData.socialMediaFollowersTotal ? parseInt(formData.socialMediaFollowersTotal) : null,
          online_reviews_count: formData.onlineReviewsCount ? parseInt(formData.onlineReviewsCount) : null,
          average_review_rating: formData.averageReviewRating ? parseFloat(formData.averageReviewRating) : null,
          content_creation_experience: formData.contentCreationExperience || false,
          video_content_creation: formData.videoContentCreation || false,
          influencer_partnerships: formData.influencerPartnerships || false,
          email_marketing_platform: formData.emailMarketingPlatform || null,
          email_list_size: formData.emailListSize ? parseInt(formData.emailListSize) : null,

          // Technology
          crm_software: formData.crmSoftware || null,
          booking_platform: formData.bookingPlatform || null,
          accounting_software: formData.accountingSoftware || null,
          website_platform: formData.websitePlatform || null,
          has_own_booking_engine: formData.hasOwnBookingEngine || false,
          comfortable_with_technology: formData.comfortableWithTechnology || null,
          video_conferencing_tools: formData.videoConferencingTools || [],
          ai_tools_experience: formData.aiToolsExperience || [],

          // Emergency & Legal
          support_24_7: formData.support24_7 || false,
          travel_crisis_management_training: formData.travelCrisisManagementTraining || false,
          travel_insurance_licensed: formData.travelInsuranceLicensed || false,
          emergency_contact_phone: formData.emergencyContactPhone || null,
          after_hours_availability: formData.afterHoursAvailability || null,
          crisis_response_examples: formData.crisisResponseExamples || null,
          privacy_policy_url: formData.privacyPolicyUrl || null,
          terms_and_conditions_url: formData.termsAndConditionsUrl || null,
          gdpr_compliant: formData.gdprCompliant || false,
          ccpa_compliant: formData.ccpaCompliant || false,
          client_data_protection_measures: formData.clientDataProtectionMeasures || null,
          contracts_with_clients: formData.contractsWithClients || false,
          legal_counsel_on_retainer: formData.legalCounselOnRetainer || false,
          previous_legal_issues: formData.previousLegalIssues || null,
          regulatory_violations: formData.regulatoryViolations || null,

          // Insurance & Banking
          annual_revenue: formData.annualRevenue || null,
          has_eo_insurance: formData.errorsOmissionsInsurance,
          insurance_provider: formData.insuranceProvider || null,
          insurance_policy_number: formData.insurancePolicyNumber || null,
          insurance_coverage: formData.insuranceCoverage || null,
          bank_name: formData.bankName || null,
          account_holder_name: formData.accountHolderName || null,
          account_type: formData.accountType || null,
          routing_number: formData.routingNumber || null,
          account_number_last4: formData.accountNumber ? formData.accountNumber.slice(-4) : null,

          // References
          reference1_name: formData.reference1Name || null,
          reference1_company: formData.reference1Company || null,
          reference1_email: formData.reference1Email || null,
          reference1_phone: formData.reference1Phone || null,
          reference2_name: formData.reference2Name || null,
          reference2_company: formData.reference2Company || null,
          reference2_email: formData.reference2Email || null,
          reference2_phone: formData.reference2Phone || null,

          // Legacy fields
          seller_of_travel_license: formData.sellerOfTravelLicense || null,
          seller_of_travel_state: formData.sellerOfTravelState || null,

          // Documents
          business_license_document: businessLicensePath,
          insurance_certificate_document: insuranceCertPath,
          government_id_document: govIdPath,
          headshot_photo: headshotPath,

          // Status
          application_status: 'draft',
          submitted_at: new Date().toISOString(),
          stripe_verification_status: 'pending',
        })
        .select()
        .single();

      if (applicationError) {
        console.error('Application error:', applicationError);
        throw new Error(applicationError.message || 'Failed to save application');
      }

      setDraftApplicationId(applicationData.id);
      setApplicationId(applicationData.id);
      
      // Store email in localStorage for verification return flow
      localStorage.setItem('agent_application_email', formData.email);
      localStorage.setItem('agent_application_id', applicationData.id);
      
      // Move to step 11 (Identity Verification)
      setStep(11);
      
      toast({
        title: "Application saved",
        description: "Now complete identity verification to submit your application.",
      });
    } catch (error: any) {
      console.error('Submission error:', error);
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
      toast({
        title: "Error",
        description: "Please complete all previous steps first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-identity-session', {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          applicationType: 'agent',
          applicationId: draftApplicationId,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe Identity
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Stripe verification error:', error);
      toast({
        title: "Verification setup failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Personal Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Business Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="agencyName">Agency Name *</Label>
            <Input
              id="agencyName"
              value={formData.agencyName}
              onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="businessType">Business Type *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value: any) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole_proprietor">Sole Proprietor</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="llc">LLC</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="businessAddress">Business Address</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="businessCity">City</Label>
            <Input
              id="businessCity"
              value={formData.businessCity}
              onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="businessState">State</Label>
            <Input
              id="businessState"
              value={formData.businessState}
              onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="yearEstablished">Year Established</Label>
            <Input
              id="yearEstablished"
              type="number"
              value={formData.yearEstablished}
              onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="businessLicenseNumber">Business License Number *</Label>
            <Input
              id="businessLicenseNumber"
              value={formData.businessLicenseNumber}
              onChange={(e) => setFormData({ ...formData, businessLicenseNumber: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="yearsExperience">Years of Experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setStep(2)}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Professional Credentials</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="iataNumber">IATA Number</Label>
            <Input
              id="iataNumber"
              value={formData.iataNumber}
              onChange={(e) => setFormData({ ...formData, iataNumber: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="arcNumber">ARC Number</Label>
            <Input
              id="arcNumber"
              value={formData.arcNumber}
              onChange={(e) => setFormData({ ...formData, arcNumber: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="cliaNumber">CLIA Number</Label>
            <Input
              id="cliaNumber"
              value={formData.cliaNumber}
              onChange={(e) => setFormData({ ...formData, cliaNumber: e.target.value })}
            />
          </div>
        </div>
        
        <div className="mt-4">
          <Label>Specializations</Label>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
            {specializationOptions.map((spec) => (
              <div key={spec} className="flex items-center space-x-2">
                <Checkbox
                  id={spec}
                  checked={formData.specializations.includes(spec)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ ...formData, specializations: [...formData.specializations, spec] });
                    } else {
                      setFormData({ ...formData, specializations: formData.specializations.filter((s) => s !== spec) });
                    }
                  }}
                />
                <label htmlFor={spec} className="text-sm">{spec}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Goldsainte Focus</h3>
        <div className="space-y-4">
          <div>
            <Label>Primary Focus</Label>
            <div className="mt-2 space-y-2">
              {primaryFocusOptions.map((focus) => (
                <div key={focus} className="flex items-center space-x-2">
                  <Checkbox
                    id={focus}
                    checked={formData.primaryFocus.includes(focus)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({ ...formData, primaryFocus: [...formData.primaryFocus, focus] });
                      } else {
                        setFormData({ ...formData, primaryFocus: formData.primaryFocus.filter((f) => f !== focus) });
                      }
                    }}
                  />
                  <label htmlFor={focus} className="text-sm">{focus}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="whyGoldsainte">Why do you want to join Goldsainte?</Label>
            <Textarea
              id="whyGoldsainte"
              value={formData.whyGoldsainte}
              onChange={(e) => setFormData({ ...formData, whyGoldsainte: e.target.value })}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(8)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={() => setStep(10)}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Document Uploads</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Please upload the required documents. All documents must be clear and legible.
        </p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessLicenseFile">Business License *</Label>
            <Input
              id="businessLicenseFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, businessLicenseFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="insuranceCertificateFile">E&O Insurance Certificate</Label>
            <Input
              id="insuranceCertificateFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, insuranceCertificateFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="governmentIdFile">Government-Issued ID</Label>
            <Input
              id="governmentIdFile"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, governmentIdFile: file });
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="professionalHeadshotFile">Professional Headshot</Label>
            <Input
              id="professionalHeadshotFile"
              type="file"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setFormData({ ...formData, professionalHeadshotFile: file });
                }
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Professional References</h3>
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold">Reference 1</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference1Name">Name</Label>
                <Input
                  id="reference1Name"
                  value={formData.reference1Name}
                  onChange={(e) => setFormData({ ...formData, reference1Name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Company">Company</Label>
                <Input
                  id="reference1Company"
                  value={formData.reference1Company}
                  onChange={(e) => setFormData({ ...formData, reference1Company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Email">Email</Label>
                <Input
                  id="reference1Email"
                  type="email"
                  value={formData.reference1Email}
                  onChange={(e) => setFormData({ ...formData, reference1Email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference1Phone">Phone</Label>
                <Input
                  id="reference1Phone"
                  type="tel"
                  value={formData.reference1Phone}
                  onChange={(e) => setFormData({ ...formData, reference1Phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h4 className="mb-3 text-sm font-semibold">Reference 2</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="reference2Name">Name</Label>
                <Input
                  id="reference2Name"
                  value={formData.reference2Name}
                  onChange={(e) => setFormData({ ...formData, reference2Name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Company">Company</Label>
                <Input
                  id="reference2Company"
                  value={formData.reference2Company}
                  onChange={(e) => setFormData({ ...formData, reference2Company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Email">Email</Label>
                <Input
                  id="reference2Email"
                  type="email"
                  value={formData.reference2Email}
                  onChange={(e) => setFormData({ ...formData, reference2Email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="reference2Phone">Phone</Label>
                <Input
                  id="reference2Phone"
                  type="tel"
                  value={formData.reference2Phone}
                  onChange={(e) => setFormData({ ...formData, reference2Phone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(9)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={saveDraftApplication} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue to Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep11 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Identity Verification Required</h3>
        <p className="text-sm text-muted-foreground mb-6">
          All travel agents must complete identity verification through Stripe Identity.
          This is required under Goldsainte's trust & safety policy and typically takes 2-3 minutes.
        </p>
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="mb-2 text-sm font-semibold">What you'll need:</h4>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Government-issued photo ID (passport, driver's license, or ID card)</li>
          <li>• Device with camera for selfie verification</li>
          <li>• 2-3 minutes to complete the process</li>
        </ul>
      </div>

      <Button
        type="button"
        onClick={startStripeVerification}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up verification...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-4 w-4" />
            Start Identity Verification
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your information is secure and encrypted. Goldsainte uses Stripe Identity
        for verification and does not store your government ID.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-serif text-3xl font-semibold">
            Travel Agent Application
          </h1>
          <p className="text-sm text-muted-foreground">
            Join Goldsainte's exclusive network of luxury travel professionals
          </p>
          <div className="mx-auto mt-4 text-center">
            <p className="text-xs text-muted-foreground">Step {step} of 11</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && (
              <>
                <Step2BusinessCompliance formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(3)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <Step3ProfessionalCredentials formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(4)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <Step4ExperienceExpertise formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(5)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 5 && (
              <>
                <Step5ClientSales formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(6)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 6 && (
              <>
                <Step6OnlinePresence formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(5)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(7)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 7 && (
              <>
                <Step7Technology formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(6)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(8)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 8 && (
              <>
                <Step8EmergencyLegal formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(7)}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(9)}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 9 && renderStep2()}
            {step === 10 && renderStep3()}
            {step === 11 && renderStep11()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
