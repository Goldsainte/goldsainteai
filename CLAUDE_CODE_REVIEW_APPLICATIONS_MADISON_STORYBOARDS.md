# Code Review Package for Claude
## Agent Application, Brand Application, Madison AI Chat & Storyboard System

---

## File 1: Agent Application Form
**Path:** `src/pages/AgentApplicationForm.tsx`

import { useState } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Step2BusinessCompliance } from "@/components/applications/steps/Step2BusinessCompliance";
import { Step3ProfessionalCredentials } from "@/components/applications/steps/Step3ProfessionalCredentials";
import { Step4ExperienceExpertise } from "@/components/applications/steps/Step4ExperienceExpertise";
import { Step5ClientSales } from "@/components/applications/steps/Step5ClientSales";
import { Step6OnlinePresence } from "@/components/applications/steps/Step6OnlinePresence";
import { Step7Technology } from "@/components/applications/steps/Step7Technology";
import { Step8EmergencyLegal } from "@/components/applications/steps/Step8EmergencyLegal";
import { Step9Financial } from "@/components/applications/steps/Step9Financial";
import { Step10Documents } from "@/components/applications/steps/Step10Documents";

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
  const location = useLocation();
  const prefillData = location.state as {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  } | null;

  const [step, setStep] = useState(1);
  const [stripeVerificationComplete, setStripeVerificationComplete] = useState(false);
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
          // Complete application data - see full file for all fields
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          agency_name: formData.agencyName,
          business_type: formData.businessType,
          business_address: formData.businessAddress,
          business_city: formData.businessCity,
          business_state: formData.businessState,
          business_zip: formData.businessZip,
          business_country: formData.businessCountry,
          year_established: formData.yearEstablished,
          website: formData.website,
          iata_number: formData.iataNumber,
          arc_number: formData.arcNumber,
          clia_number: formData.cliaNumber,
          other_certifications: formData.otherCertifications,
          years_experience: formData.yearsExperience,
          specializations: formData.specializations,
          seller_of_travel_license: formData.sellerOfTravelLicense,
          seller_of_travel_state: formData.sellerOfTravelState,
          business_license_number: formData.businessLicenseNumber,
          tax_id_ein: formData.taxIdEIN,
          annual_revenue: formData.annualRevenue,
          errors_omissions_insurance: formData.errorsOmissionsInsurance,
          insurance_provider: formData.insuranceProvider,
          insurance_policy_number: formData.insurancePolicyNumber,
          insurance_coverage: formData.insuranceCoverage,
          reference1_name: formData.reference1Name,
          reference1_company: formData.reference1Company,
          reference1_email: formData.reference1Email,
          reference1_phone: formData.reference1Phone,
          reference2_name: formData.reference2Name,
          reference2_company: formData.reference2Company,
          reference2_email: formData.reference2Email,
          reference2_phone: formData.reference2Phone,
          primary_focus: formData.primaryFocus,
          average_trip_value: formData.averageTripValue,
          monthly_bookings: formData.monthlyBookings,
          preferred_destinations: formData.preferredDestinations,
          why_goldsainte: formData.whyGoldsainte,
          business_license_file_path: businessLicensePath,
          insurance_certificate_file_path: insuranceCertPath,
          government_id_file_path: govIdPath,
          professional_headshot_file_path: headshotPath,
          // Section 2: Business Compliance
          dba_names: formData.dbaNames,
          operating_states: formData.operatingStates,
          seller_of_travel_states: formData.sellerOfTravelStates,
          florida_registration_number: formData.floridaRegistrationNumber,
          california_registration_number: formData.californiaRegistrationNumber,
          hawaii_registration_number: formData.hawaiiRegistrationNumber,
          washington_registration_number: formData.washingtonRegistrationNumber,
          surety_bond_amount: formData.suretyBondAmount,
          surety_bond_provider: formData.suretyBondProvider,
          surety_bond_expiration: formData.suretyBondExpiration,
          background_check_consent: formData.backgroundCheckConsent,
          criminal_history_disclosure: formData.criminalHistoryDisclosure,
          // Section 3: Professional Credentials
          iatan_id_number: formData.iatanIdNumber,
          asta_verified_travel_advisor: formData.astaVerifiedTravelAdvisor,
          asta_membership_number: formData.astaMembershipNumber,
          travel_institute_cta: formData.travelInstituteCta,
          travel_institute_ctc: formData.travelInstituteCtc,
          clia_certification_level: formData.cliaCertificationLevel,
          host_agency_name: formData.hostAgencyName,
          host_agency_affiliation: formData.hostAgencyAffiliation,
          years_with_host_agency: formData.yearsWithHostAgency,
          // Section 4: Experience & Expertise
          countries_visited_count: formData.countriesVisitedCount,
          fam_trips_taken_last_year: formData.famTripsTakenLastYear,
          continents_visited: formData.continentsVisited,
          destination_expert_certifications: formData.destinationExpertCertifications,
          cruise_experience_level: formData.cruiseExperienceLevel,
          all_inclusive_experience: formData.allInclusiveExperience,
          accessibility_travel_experience: formData.accessibilityTravelExperience,
          multigenerational_travel_experience: formData.multigenerationalTravelExperience,
          solo_travel_booking_experience: formData.soloTravelBookingExperience,
          languages_spoken: formData.languagesSpoken,
          // Section 5: Client Sales
          annual_sales_volume: formData.annualSalesVolume,
          number_of_active_clients: formData.numberOfActiveClients,
          percentage_repeat_clients: formData.percentageRepeatClients,
          percentage_referral_business: formData.percentageReferralBusiness,
          booking_volume_last_12_months: formData.bookingVolumeLast12Months,
          average_commission_percentage: formData.averageCommissionPercentage,
          client_demographics: formData.clientDemographics,
          average_client_age_range: formData.averageClientAgeRange,
          gds_access: formData.gdsAccess,
          preferred_booking_platforms: formData.preferredBookingPlatforms,
          preferred_suppliers: formData.preferredSuppliers,
          consortium_memberships: formData.consortiumMemberships,
          // Section 6: Online Presence
          instagram_handle: formData.instagramHandle,
          tiktok_handle: formData.tiktokHandle,
          facebook_page_url: formData.facebookPageUrl,
          linkedin_profile_url: formData.linkedinProfileUrl,
          youtube_channel_url: formData.youtubeChannelUrl,
          blog_url: formData.blogUrl,
          google_business_profile: formData.googleBusinessProfile,
          social_media_followers_total: formData.socialMediaFollowersTotal,
          online_reviews_count: formData.onlineReviewsCount,
          average_review_rating: formData.averageReviewRating,
          content_creation_experience: formData.contentCreationExperience,
          video_content_creation: formData.videoContentCreation,
          influencer_partnerships: formData.influencerPartnerships,
          email_marketing_platform: formData.emailMarketingPlatform,
          email_list_size: formData.emailListSize,
          // Section 7: Technology
          crm_software: formData.crmSoftware,
          booking_platform: formData.bookingPlatform,
          accounting_software: formData.accountingSoftware,
          website_platform: formData.websitePlatform,
          has_own_booking_engine: formData.hasOwnBookingEngine,
          comfortable_with_technology: formData.comfortableWithTechnology,
          video_conferencing_tools: formData.videoConferencingTools,
          ai_tools_experience: formData.aiToolsExperience,
          // Section 8: Emergency & Legal
          support_24_7: formData.support24_7,
          travel_crisis_management_training: formData.travelCrisisManagementTraining,
          travel_insurance_licensed: formData.travelInsuranceLicensed,
          emergency_contact_phone: formData.emergencyContactPhone,
          after_hours_availability: formData.afterHoursAvailability,
          crisis_response_examples: formData.crisisResponseExamples,
          privacy_policy_url: formData.privacyPolicyUrl,
          terms_and_conditions_url: formData.termsAndConditionsUrl,
          gdpr_compliant: formData.gdprCompliant,
          ccpa_compliant: formData.ccpaCompliant,
          client_data_protection_measures: formData.clientDataProtectionMeasures,
          contracts_with_clients: formData.contractsWithClients,
          legal_counsel_on_retainer: formData.legalCounselOnRetainer,
          previous_legal_issues: formData.previousLegalIssues,
          regulatory_violations: formData.regulatoryViolations,
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

  // Render step 1 through step 11
  // (Full component render logic with 870 total lines)
  // ... rest of component
}

---

## File 2: Brand Application Form
**Path:** `src/pages/apply/BrandOnboarding.tsx`

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Upload, FileText, X } from 'lucide-react';
import { toast } from 'sonner';

interface BrandFormData {
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactTitle: string;
  brandName: string;
  brandType: string;
  brandCategory: string;
  tagline: string;
  bio: string;
  brandStory: string;
  businessRegistrationNumber: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  website: string;
  regions: string[];
  cities: string[];
  styleTags: string[];
  priceRange: string;
  capacityMin: string;
  capacityMax: string;
  instagramHandle: string;
  tiktokHandle: string;
  facebookUrl: string;
  linkedinUrl: string;
  logoUrl: string;
  coverImageUrl: string;
  galleryUrls: string[];
  videoUrls: string[];
  amenities: string[];
  sustainabilityCertifications: string[];
  qualityCertifications: string[];
  taxId: string;
  vatNumber: string;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedVendor: boolean;
}

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  
  const [formData, setFormData] = useState<BrandFormData>({
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    primaryContactTitle: '',
    brandName: '',
    brandType: '',
    brandCategory: '',
    tagline: '',
    bio: '',
    brandStory: '',
    businessRegistrationNumber: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessCountry: '',
    businessPostalCode: '',
    website: '',
    regions: [],
    cities: [],
    styleTags: [],
    priceRange: '',
    capacityMin: '',
    capacityMax: '',
    instagramHandle: '',
    tiktokHandle: '',
    facebookUrl: '',
    linkedinUrl: '',
    logoUrl: '',
    coverImageUrl: '',
    galleryUrls: [],
    videoUrls: [],
    amenities: [],
    sustainabilityCertifications: [],
    qualityCertifications: [],
    taxId: '',
    vatNumber: '',
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedVendor: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  const validateUrl = (url: string): boolean => {
    return url.match(/^https?:\/\//) !== null;
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'cover' | 'gallery'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Image must be JPEG, PNG, or WebP');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brand-media/${imageType}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('brands')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('brands')
        .getPublicUrl(filePath);

      // Update formData based on imageType
      if (imageType === 'logo') {
        setFormData(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
      } else if (imageType === 'cover') {
        setFormData(prev => ({ ...prev, coverImageUrl: urlData.publicUrl }));
      } else if (imageType === 'gallery') {
        setFormData(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, urlData.publicUrl] }));
      }
      toast.success(`${imageType} image uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(8)) return;

    setIsSubmitting(true);
    setVerificationStatus('pending');

    try {
      // Step 1: Create Stripe Identity Verification Session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
        'create-stripe-identity-session',
        {
          body: {
            email: formData.primaryContactEmail,
            firstName: formData.primaryContactName.split(' ')[0],
            lastName: formData.primaryContactName.split(' ').slice(1).join(' ') || formData.primaryContactName,
            applicationType: 'brand'
          }
        }
      );

      if (sessionError) throw sessionError;

      const { sessionId, url } = sessionData;

      // Step 2: Save application to database (WITHOUT user_id)
      const applicationData = {
        status: 'pending_verification',
        primary_contact_name: formData.primaryContactName,
        primary_contact_email: formData.primaryContactEmail,
        primary_contact_phone: formData.primaryContactPhone,
        primary_contact_title: formData.primaryContactTitle,
        brand_name: formData.brandName,
        brand_type: formData.brandType,
        brand_category: formData.brandCategory,
        tagline: formData.tagline,
        bio: formData.bio,
        brand_story: formData.brandStory,
        business_registration_number: formData.businessRegistrationNumber,
        business_address: formData.businessAddress,
        business_city: formData.businessCity,
        business_state: formData.businessState,
        business_country: formData.businessCountry,
        business_postal_code: formData.businessPostalCode,
        website: formData.website,
        regions: formData.regions,
        cities: formData.cities,
        style_tags: formData.styleTags,
        price_range: formData.priceRange,
        capacity_min: formData.capacityMin,
        capacity_max: formData.capacityMax,
        instagram_handle: formData.instagramHandle,
        tiktok_handle: formData.tiktokHandle,
        facebook_url: formData.facebookUrl,
        linkedin_url: formData.linkedinUrl,
        logo_url: formData.logoUrl,
        cover_image_url: formData.coverImageUrl,
        gallery_urls: formData.galleryUrls,
        video_urls: formData.videoUrls,
        amenities: formData.amenities,
        sustainability_certifications: formData.sustainabilityCertifications,
        quality_certifications: formData.qualityCertifications,
        tax_id: formData.taxId,
        vat_number: formData.vatNumber,
        accepted_terms: formData.acceptedTerms,
        accepted_privacy: formData.acceptedPrivacy,
        accepted_vendor: formData.acceptedVendor,
        documents: uploadedDocuments,
        stripe_session_id: sessionId,
        stripe_verification_status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const { data: applicationRecord, error: dbError } = await supabase
        .from('brand_applications')
        .insert(applicationData as any)
        .select()
        .single();

      if (dbError) throw dbError;

      // Step 3: Log audit event
      await supabase.from('application_audit_log').insert({
        application_id: applicationRecord.id,
        application_type: 'brand',
        action: 'submitted',
        actor_type: 'applicant',
        details: {
          email: formData.primaryContactEmail,
          brand_name: formData.brandName,
          brand_type: formData.brandType
        }
      });

      // Step 4: Redirect to Stripe Identity Verification
      setVerificationStatus('success');
      toast.success('Application submitted! Redirecting to identity verification...');

      setTimeout(() => {
        window.location.href = url;
      }, 2000);

    } catch (error: any) {
      console.error('Submission error:', error);
      setVerificationStatus('failed');
      toast.error(error.message || 'Failed to submit application');
      setIsSubmitting(false);
    }
  };

  // 8-step form with validation
  // (Full component at 1561 total lines)
  // ... rest of component
}

---

## File 3: Madison Chat Component
**Path:** `src/components/MadisonChat.tsx`

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMadisonConversation } from "@/hooks/useMadisonConversation";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function MadisonChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { conversationId, setConversationId } = useMadisonConversation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    const now = new Date();

    // Immediate local echo
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage, timestamp: now },
    ]);

    setIsLoading(true);

    try {
    const { data, error } = await supabase.functions.invoke("madison", {
      body: {
        message: userMessage,
        userId: user?.id || null,
        inputType: "text",
        conversationId,
      },
    });

      if (error) throw error;

      const response: any = data;

      if (response?.conversationId && response.conversationId !== conversationId) {
        setConversationId(response.conversationId);
      }

      // Build message content with storyboard link if available
      let messageContent = response?.message ?? "I'm having trouble responding right now. Can you try again?";
      
      if (response?.action === "trip_created" && response.storyboard?.id && response.trip?.id) {
        const storyboardUrl = `/trip/${response.trip.id}/storyboard?from=madison`;
        messageContent += `\n\n[View your storyboard →](${storyboardUrl})`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: messageContent,
          timestamp: new Date(),
        },
      ]);

      if (response?.action === "auth_required") {
        toast({
          title: "Sign up to continue",
          description: "Create an account to save trips and storyboards.",
        });
        return;
      }

      if (response?.action === "trip_created" && response.trip) {
        const destination =
          response.trip.destination || "your new destination";

        toast({
          title: "Trip created ✨",
          description: `Planning your ${destination} adventure.`,
        });

        const tripId = response.trip.id;
        // If storyboard exists, send straight to storyboard editor
        if (response.storyboard?.id) {
          navigate(`/trip/${tripId}/storyboard?from=madison`);
        } else {
          navigate(`/trip/${tripId}`);
        }
      }
    } catch (err) {
      console.error("[MadisonChat] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble right now. Can you try again?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-base font-semibold text-foreground">Madison</h2>
        <p className="text-xs text-muted-foreground">
          Your AI travel concierge (text & voice)
        </p>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div ref={scrollRef} className="space-y-4">
          {messages.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2 text-sm">👋 Hi, I'm Madison.</p>
              <p className="text-xs">
                Try: "I want to go to Morocco in May for 7 days."
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-xs ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">
                  {msg.content.split(/(\[.*?\]\(.*?\))/).map((part, i) => {
                    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (linkMatch) {
                      return (
                        <a
                          key={i}
                          href={linkMatch[2]}
                          className="underline font-semibold hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(linkMatch[2]);
                          }}
                        >
                          {linkMatch[1]}
                        </a>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </p>
                <p className="mt-1 text-[10px] opacity-70">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <Input
            placeholder='Type a message... (e.g., "I want to go to Morocco")'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="bg-background"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

---

## File 4: Madison Conversation Hook
**Path:** `src/hooks/useMadisonConversation.ts`

import { useState } from "react";

const CONVERSATION_KEY = "madison_conversation_id";

/**
 * Shared conversation ID hook for Madison text & voice chat.
 * Ensures both modalities use the same conversation thread.
 */
export function useMadisonConversation() {
  const [conversationId, setConversationIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;

    const existing = window.localStorage.getItem(CONVERSATION_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(CONVERSATION_KEY, id);
    return id;
  });

  const setConversationId = (id: string | null) => {
    if (typeof window === "undefined" || !id) return;
    window.localStorage.setItem(CONVERSATION_KEY, id);
    setConversationIdState(id);
  };

  const resetConversation = () => {
    if (typeof window === "undefined") return;
    const id = crypto.randomUUID();
    window.localStorage.setItem(CONVERSATION_KEY, id);
    setConversationIdState(id);
  };

  return { conversationId, setConversationId, resetConversation };
}

---

## File 5: AI Booking Concierge (Madison Voice + Text Widget)
**Path:** `src/components/AIBookingConcierge.tsx`

**Line Count:** 1913 lines (Very large component)

**Key sections:**
1. **Voice Mode Integration** (lines 621-1130): OpenAI Realtime API with wake word detection
2. **Text Message Handling** (lines 459-543): Madison edge function calls
3. **Trip Intent Detection** (lines 132-189): Madison-chat function for trip creation
4. **Amadeus Tool Calls** (lines 702-836): Flight/hotel search via voice commands
5. **Background Music Control** (lines 334-382): Audio playback management
6. **Wake Word Detection** (lines 1132-1197): Speech recognition for "Hey Goldsainte"

**Critical code sections:**

// Madison edge function call (text mode)
const { data, error } = await supabase.functions.invoke("madison", {
  body: {
    message: userMessage,
    userId: user?.id || null, // Allows unauthenticated users
    inputType: 'text',
    conversationId: conversationId
  }
});

// Voice mode initialization
voiceChatRef.current = new RealtimeVoiceChat(
  async (message) => {
    // Handle function calls from OpenAI Realtime
    if (message.type === 'response.function_call_arguments.done') {
      const toolName = message.name;
      const callId = message.call_id;
      
      // Call amadeus-proxy with auth
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/amadeus-proxy`;
      const proxyResp = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ type: proxyType, ...args })
      });
      
      // Send results back to OpenAI via data channel
      voiceChatRef.current.dc.send(JSON.stringify(toolResult));
    }
  },
  (status) => setVoiceStatus(status)
);

**Key Issues to Review:**
1. **Security:** Anonymous users can call madison function (userId can be null)
2. **Authorization:** Amadeus-proxy called with PUBLISHABLE_KEY (is this sufficient?)
3. **Conversation Persistence:** localStorage used for 24-hour conversation restoration
4. **Error Handling:** Comprehensive try/catch but errors might not surface to user properly
5. **Voice Pipeline:** Complex microphone permission flow with multiple audio contexts
6. **Tool Calling:** Direct proxy calls from frontend vs backend-only pattern

---

## File 6: Storyboard Detail Page
**Path:** `src/pages/storyboards/StoryboardDetailPage.tsx`

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, Plus, Trash2, Globe, Lock, Edit2, 
  Copy, Check 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  getStoryboardById,
  addStoryboardItem,
  removeStoryboardItem,
  updateStoryboard,
  convertStoryboardToTripRequest,
  type Storyboard,
} from "@/services/storyboardsService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { toast } from "sonner";

export default function StoryboardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadStoryboard();
  }, [id]);

  useEffect(() => {
    if (!id || !user || !storyboard) return;
    handleUrlParams();
  }, [id, user, storyboard]);

  const loadStoryboard = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      if (userError || !authUser) {
        navigate("/auth?returnTo=/storyboards", { replace: true });
        return;
      }
      setUser(authUser);
      
      const data = await getStoryboardById(id);
      if (!data) {
        toast.error("Storyboard not found");
        navigate("/storyboards");
        return;
      }
      setStoryboard(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setIsPublic(data.is_public);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load storyboard");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlParams = async () => {
    const fromCreatorId = searchParams.get("addCreatorId");
    const fromAgentId = searchParams.get("addAgentId");
    const fromLabImage = searchParams.get("addLabImage");

    if (!fromCreatorId && !fromAgentId && !fromLabImage) return;

    try {
      let added = false;

      if (fromCreatorId) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "creator",
          title: searchParams.get("creatorName") || "Creator",
          imageUrl: searchParams.get("creatorImage") || undefined,
          sourceType: "creator_profile",
          sourceId: fromCreatorId,
        });
        added = true;
      } else if (fromAgentId) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "agent",
          title: searchParams.get("agentName") || "Agent",
          imageUrl: searchParams.get("agentImage") || undefined,
          sourceType: "agent_profile",
          sourceId: fromAgentId,
        });
        added = true;
      } else if (fromLabImage) {
        await addStoryboardItem({
          storyboardId: id!,
          itemType: "image",
          title: searchParams.get("imageTitle") || "Creator Lab Image",
          imageUrl: fromLabImage,
          sourceType: "creator_lab",
          sourceId: "lab",
        });
        added = true;
      }

      if (added) {
        toast.success("Added to storyboard!");
        setSearchParams({});
        await loadStoryboard();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add item");
    }
  };

  const handleSaveChanges = async () => {
    if (!id || !title.trim()) return;
    
    try {
      await updateStoryboard(id, {
        title: title.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      });
      
      setStoryboard(prev => prev ? {
        ...prev,
        title: title.trim(),
        description: description.trim() || null,
        is_public: isPublic,
      } : prev);
      
      setEditing(false);
      toast.success("Storyboard updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update storyboard");
    }
  };

  const handleConvertToTrip = async () => {
    if (!id || !user) return;
    setConverting(true);
    try {
      const { tripRequestId } = await convertStoryboardToTripRequest({
        storyboardId: id,
        userId: user.id,
      });
      toast.success("Storyboard converted to Trip Request!");
      navigate(`/post-trip?fromStoryboard=${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert storyboard");
    } finally {
      setConverting(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm("Remove this item from your storyboard?")) return;
    try {
      await removeStoryboardItem(itemId);
      setStoryboard(prev =>
        prev
          ? {
              ...prev,
              items: (prev.items || []).filter((item) => item.id !== itemId),
            }
          : prev
      );
      toast.success("Item removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  // Full component render with inline editing, item grid, etc.
  // ... (441 total lines)
}

---

## Overall Security Concerns to Investigate

### 1. Anonymous Application Submissions
Both agent and brand applications allow **completely anonymous** submissions with `user_id=NULL`. Need to verify:
- RLS policies allow `anon` role INSERT on `agent_applications` and `brand_applications`
- Storage buckets allow anonymous file uploads to specific paths
- No sensitive data exposure during anonymous flow

### 2. Madison Edge Function Authorization
Madison edge function accepts `userId: null` for anonymous users. Verify:
- Does this create security risks?
- Can unauthenticated users abuse AI functionality?
- Are there rate limits on anonymous requests?

### 3. Amadeus Proxy Authorization
The Amadeus proxy is called directly from frontend with only `VITE_SUPABASE_PUBLISHABLE_KEY`. Verify:
- Is this sufficient auth? Should it require user JWT?
- Can anonymous users abuse flight/hotel search?
- Are there rate limits in place?

### 4. Storyboard RLS Policies
Storyboards use complex visibility rules (public/private). Verify:
- Do RLS policies properly enforce owner-only editing?
- Can users view other users' private storyboards?
- Is the "convert to trip request" function properly auth-gated?

### 5. File Upload Security
Both applications upload files to Supabase storage. Verify:
- Are storage bucket policies configured correctly for anon uploads?
- Are file type validations sufficient?
- Are file sizes enforced server-side (not just client-side)?
- Can users overwrite other users' files?

### 6. Profiles Table RLS
The recent fix allows `service_role` to insert profiles. Verify:
- Does this create any privilege escalation risks?
- Are there any other INSERT operations that could bypass RLS?
- Should we add additional constraints?

---

## Recommended Review Questions for Claude

1. **Agent/Brand Applications:** Are there any race conditions or security gaps in the anonymous application → Stripe verification → admin approval → account creation flow?

2. **Madison AI Chat:** Should anonymous users have unlimited access to Madison, or should there be rate limits/quotas?

3. **Amadeus Integration:** Is calling amadeus-proxy directly from frontend secure, or should all search requests go through a dedicated edge function?

4. **Storyboard System:** Are there any data exposure risks with public storyboards? Can users inject malicious content?

5. **RLS Policies:** Are there any scenarios where the current RLS policies could be bypassed?

6. **Authentication Flow:** The handle_new_user trigger creates profiles - are there any edge cases where this could fail or create inconsistent state?

---

## Notes

- Total lines reviewed: ~3,000+ lines
- Key integrations: Supabase Auth, Stripe Identity, OpenAI Realtime API, Amadeus API
- Authentication model: Mixed (anonymous applications, authenticated users, admin roles)
- Critical user flows: Application submission → Identity verification → Admin approval → Account creation
