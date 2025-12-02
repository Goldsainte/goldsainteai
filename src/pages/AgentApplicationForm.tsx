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
    console.log('=== 🚀 Starting saveDraftApplication ===');
    
    // Initial diagnostics
    console.log('🔧 Supabase client check:', {
      clientExists: !!supabase,
      hasFrom: typeof supabase?.from === 'function',
      hasStorage: typeof supabase?.storage === 'object',
    });
    
    setIsLoading(true);

    try {
      // STEP 0: Pre-flight storage check
      console.log('Step 0: 🏥 Testing storage connectivity...');
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.error('❌ Storage bucket list error:', bucketError);
          throw new Error(`Storage not accessible: ${bucketError.message}`);
        }
        console.log('Step 0: ✅ Storage accessible, buckets:', buckets?.map(b => b.name));
      } catch (storageCheckError: any) {
        console.error('Step 0: ❌ STORAGE CONNECTIVITY FAILED:', storageCheckError);
        throw new Error(`Cannot connect to storage: ${storageCheckError.message}`);
      }

      // STEP 1: Validation
      console.log('Step 1: 🔍 Validating required fields...');
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        throw new Error("Please fill in all required personal information fields");
      }

      if (!formData.agencyName || !formData.businessType || !formData.businessLicenseNumber) {
        throw new Error("Please fill in all required business information fields");
      }
      console.log('Step 1: ✅ Validation passed');

      // STEP 2: File uploads (with individual try-catch for isolation)
      console.log('Step 2: 📤 Starting file uploads...');
      let businessLicensePath = null;
      let insuranceCertPath = null;
      let govIdPath = null;
      let headshotPath = null;

      // OPTIONAL: Set to true to skip file uploads as test
      const SKIP_FILE_UPLOADS = false;

      if (!SKIP_FILE_UPLOADS) {
        // Upload business license
        if (formData.businessLicenseFile) {
          try {
            console.log('  📄 Uploading business license...');
            businessLicensePath = await handleFileUpload(formData.businessLicenseFile, 'business_license');
            console.log('  ✅ Business license uploaded:', businessLicensePath);
          } catch (fileError: any) {
            console.error('  ❌ Business license upload FAILED:', fileError);
            throw new Error(`Business license upload failed: ${fileError.message}`);
          }
        }
        
        // Upload insurance certificate
        if (formData.insuranceCertificateFile) {
          try {
            console.log('  📄 Uploading insurance certificate...');
            insuranceCertPath = await handleFileUpload(formData.insuranceCertificateFile, 'insurance_certificate');
            console.log('  ✅ Insurance cert uploaded:', insuranceCertPath);
          } catch (fileError: any) {
            console.error('  ❌ Insurance cert upload FAILED:', fileError);
            throw new Error(`Insurance certificate upload failed: ${fileError.message}`);
          }
        }
        
        // Upload government ID
        if (formData.governmentIdFile) {
          try {
            console.log('  📄 Uploading government ID...');
            govIdPath = await handleFileUpload(formData.governmentIdFile, 'government_id');
            console.log('  ✅ Government ID uploaded:', govIdPath);
          } catch (fileError: any) {
            console.error('  ❌ Government ID upload FAILED:', fileError);
            throw new Error(`Government ID upload failed: ${fileError.message}`);
          }
        }
        
        // Upload headshot
        if (formData.professionalHeadshotFile) {
          try {
            console.log('  📄 Uploading headshot...');
            headshotPath = await handleFileUpload(formData.professionalHeadshotFile, 'headshot');
            console.log('  ✅ Headshot uploaded:', headshotPath);
          } catch (fileError: any) {
            console.error('  ❌ Headshot upload FAILED:', fileError);
            throw new Error(`Headshot upload failed: ${fileError.message}`);
          }
        }
        console.log('Step 2: ✅ All files uploaded successfully');
      } else {
        console.log('Step 2: ⏭️ SKIPPING file uploads (testing mode)');
      }

      // STEP 3: Build extended_data object
      console.log('Step 3: 🔨 Building extended_data object...');
      const extendedData = {
        // Business Compliance extras
        dbaNames: formData.dbaNames,
        operatingStates: formData.operatingStates,
        sellerOfTravelStates: formData.sellerOfTravelStates,
        floridaRegistrationNumber: formData.floridaRegistrationNumber,
        californiaRegistrationNumber: formData.californiaRegistrationNumber,
        hawaiiRegistrationNumber: formData.hawaiiRegistrationNumber,
        washingtonRegistrationNumber: formData.washingtonRegistrationNumber,
        suretyBondAmount: formData.suretyBondAmount,
        suretyBondProvider: formData.suretyBondProvider,
        suretyBondExpiration: formData.suretyBondExpiration,
        backgroundCheckConsent: formData.backgroundCheckConsent,
        criminalHistoryDisclosure: formData.criminalHistoryDisclosure,
        
        // Professional Credentials
        iatanIdNumber: formData.iatanIdNumber,
        astaVerifiedTravelAdvisor: formData.astaVerifiedTravelAdvisor,
        astaMembershipNumber: formData.astaMembershipNumber,
        travelInstituteCta: formData.travelInstituteCta,
        travelInstituteCtc: formData.travelInstituteCtc,
        cliaCertificationLevel: formData.cliaCertificationLevel,
        hostAgencyAffiliation: formData.hostAgencyAffiliation,
        yearsWithHostAgency: formData.yearsWithHostAgency,
        
        // Travel Experience
        countriesVisitedCount: formData.countriesVisitedCount,
        famTripsTakenLastYear: formData.famTripsTakenLastYear,
        continentsVisited: formData.continentsVisited,
        destinationExpertCertifications: formData.destinationExpertCertifications,
        cruiseExperienceLevel: formData.cruiseExperienceLevel,
        allInclusiveExperience: formData.allInclusiveExperience,
        accessibilityTravelExperience: formData.accessibilityTravelExperience,
        multigenerationalTravelExperience: formData.multigenerationalTravelExperience,
        soloTravelBookingExperience: formData.soloTravelBookingExperience,
        languagesSpoken: formData.languagesSpoken,
        
        // Client & Sales metrics
        numberOfActiveClients: formData.numberOfActiveClients,
        percentageReferralBusiness: formData.percentageReferralBusiness,
        bookingVolumeLast12Months: formData.bookingVolumeLast12Months,
        averageCommissionPercentage: formData.averageCommissionPercentage,
        clientDemographics: formData.clientDemographics,
        averageClientAgeRange: formData.averageClientAgeRange,
        gdsAccess: formData.gdsAccess,
        preferredBookingPlatforms: formData.preferredBookingPlatforms,
        preferredSuppliers: formData.preferredSuppliers,
        consortiumMemberships: formData.consortiumMemberships,
        
        // Online Presence
        instagramHandle: formData.instagramHandle,
        tiktokHandle: formData.tiktokHandle,
        facebookPageUrl: formData.facebookPageUrl,
        linkedinProfileUrl: formData.linkedinProfileUrl,
        youtubeChannelUrl: formData.youtubeChannelUrl,
        blogUrl: formData.blogUrl,
        googleBusinessProfile: formData.googleBusinessProfile,
        onlineReviewsCount: formData.onlineReviewsCount,
        averageReviewRating: formData.averageReviewRating,
        influencerPartnerships: formData.influencerPartnerships,
        emailMarketingPlatform: formData.emailMarketingPlatform,
        emailListSize: formData.emailListSize,
        
        // Technology
        crmSoftware: formData.crmSoftware,
        bookingPlatform: formData.bookingPlatform,
        accountingSoftware: formData.accountingSoftware,
        websitePlatform: formData.websitePlatform,
        hasOwnBookingEngine: formData.hasOwnBookingEngine,
        comfortableWithTechnology: formData.comfortableWithTechnology,
        videoConferencingTools: formData.videoConferencingTools,
        aiToolsExperience: formData.aiToolsExperience,
        
        // Emergency & Legal
        support24_7: formData.support24_7,
        travelCrisisManagementTraining: formData.travelCrisisManagementTraining,
        travelInsuranceLicensed: formData.travelInsuranceLicensed,
        emergencyContactPhone: formData.emergencyContactPhone,
        afterHoursAvailability: formData.afterHoursAvailability,
        crisisResponseExamples: formData.crisisResponseExamples,
        privacyPolicyUrl: formData.privacyPolicyUrl,
        termsAndConditionsUrl: formData.termsAndConditionsUrl,
        gdprCompliant: formData.gdprCompliant,
        ccpaCompliant: formData.ccpaCompliant,
        clientDataProtectionMeasures: formData.clientDataProtectionMeasures,
        contractsWithClients: formData.contractsWithClients,
        legalCounselOnRetainer: formData.legalCounselOnRetainer,
        previousLegalIssues: formData.previousLegalIssues,
        regulatoryViolations: formData.regulatoryViolations,
        
        // Professional References
        reference1Name: formData.reference1Name,
        reference1Company: formData.reference1Company,
        reference1Email: formData.reference1Email,
        reference1Phone: formData.reference1Phone,
        reference2Name: formData.reference2Name,
        reference2Company: formData.reference2Company,
        reference2Email: formData.reference2Email,
        reference2Phone: formData.reference2Phone,
      };
      console.log('Step 3: ✅ Extended data built successfully');

      // STEP 4: Database insert (with try-catch for isolation)
      console.log('Step 4: 💾 Inserting application into database...');
      console.log('  📊 Insert payload summary:', {
        email: formData.email,
        agency_name: formData.agencyName,
        business_type: formData.businessType,
        hasBusinessLicense: !!businessLicensePath,
        hasInsuranceCert: !!insuranceCertPath,
        hasGovId: !!govIdPath,
        hasHeadshot: !!headshotPath,
        extendedDataKeys: Object.keys(extendedData).length,
      });
      
      let applicationData;
      try {
        const { data, error: applicationError } = await supabase
        .from('agent_applications')
        .insert({
          // Core fields - mapped to dedicated columns
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
          business_postal_code: formData.businessZip,
          business_country: formData.businessCountry,
          year_established: formData.yearEstablished ? parseInt(formData.yearEstablished) : null,
          website: formData.website || null,
          business_registration_number: formData.businessLicenseNumber,
          tax_id: formData.taxIdEIN || null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          specialties: formData.specializations,
          primary_focus: formData.primaryFocus,
          average_trip_value: formData.averageTripValue || null,
          monthly_bookings: formData.monthlyBookings || null,
          destinations: formData.preferredDestinations ? [formData.preferredDestinations] : [],
          why_goldsainte: formData.whyGoldsainte || null,
          
          // Professional credentials
          license_number: formData.iataNumber || null,
          
          // Sales metrics - mapped to new dedicated columns
          annual_sales_volume: formData.annualSalesVolume || null,
          active_clients_count: formData.numberOfActiveClients ? parseInt(formData.numberOfActiveClients) : null,
          repeat_clients_percentage: formData.percentageRepeatClients ? parseInt(formData.percentageRepeatClients) : null,
          
          // Host agency - mapped to new dedicated column
          host_agency_name: formData.hostAgencyName || null,
          
          // Content creation - mapped to new dedicated columns
          content_creation_experience: formData.contentCreationExperience || false,
          video_content_creation: formData.videoContentCreation || false,
          social_media_followers_total: formData.socialMediaFollowersTotal ? parseInt(formData.socialMediaFollowersTotal) : null,
          
          // Languages (existing column)
          languages: formData.languagesSpoken || [],
          
          // Insurance (existing columns)
          insurance_provider: formData.insuranceProvider || null,
          insurance_policy_number: formData.insurancePolicyNumber || null,
          insurance_coverage_amount: formData.insuranceCoverage ? parseFloat(formData.insuranceCoverage) : null,
          
          // Documents - mapped to new dedicated columns
          document_business_license: businessLicensePath,
          document_insurance_cert: insuranceCertPath,
          document_government_id: govIdPath,
          document_headshot: headshotPath,
          
          // All other fields stored in extended_data JSONB
          extended_data: extendedData,
          
          // Status fields
          status: 'pending_verification',
        })
        .select()
        .single();

        if (applicationError) {
          console.error('Step 4: ❌ Database insert failed:', {
            message: applicationError.message,
            code: applicationError.code,
            details: applicationError.details,
            hint: applicationError.hint,
          });
          throw new Error(applicationError.message || 'Failed to save application');
        }

        applicationData = data;
        console.log('Step 4: ✅ Application inserted successfully:', {
          id: applicationData.id,
          email: applicationData.email,
          status: applicationData.status,
        });
      } catch (dbError: any) {
        console.error('Step 4: ❌ DATABASE INSERT OPERATION FAILED:', dbError);
        throw new Error(`Database operation failed: ${dbError.message}`);
      }

      setDraftApplicationId(applicationData.id);
      setApplicationId(applicationData.id);
      
      // Store email in localStorage for verification return flow
      console.log('Step 5: 💾 Storing application data in localStorage...');
      localStorage.setItem('agent_application_email', formData.email);
      localStorage.setItem('agent_application_id', applicationData.id);
      console.log('Step 5: ✅ LocalStorage updated');
      
      // Move to step 11 (Identity Verification)
      console.log('Step 6: 🎯 Moving to step 11 (Identity Verification)');
      setStep(11);
      
      console.log('=== ✅ saveDraftApplication completed successfully ===');
      
      toast({
        title: "Application saved",
        description: "Now complete identity verification to submit your application.",
      });
    } catch (error: any) {
      console.error('=== ❌ ERROR in saveDraftApplication ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      // Detailed error information
      const errorDetails = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: error.status,
        stack: error.stack,
      };
      console.error('Full error details:', errorDetails);
      
      // Check if it's a network error
      if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        console.error('🚨 NETWORK ERROR DETECTED - this is likely a connectivity issue');
        console.error('Possible causes:');
        console.error('  1. Supabase client not initialized');
        console.error('  2. Network connection lost');
        console.error('  3. Supabase project URL incorrect');
        console.error('  4. CORS issue (check Network tab)');
      }
      
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
      const { data, error } = await supabase.functions.invoke('create-identity-verification', {
        body: {
          email: formData.email,
          applicationType: 'agent',
          metadata: {
            applicationId: draftApplicationId,
            firstName: formData.firstName,
            lastName: formData.lastName,
          },
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
    <div className="space-y-8">
      {/* Personal Information Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Personal Information</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-[#0a2225]">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-[#0a2225]">Last Name *</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#0a2225]">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-medium text-[#0a2225]">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="dateOfBirth" className="text-sm font-medium text-[#0a2225]">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Business Information Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-1 bg-[#C7A962] rounded-full" />
          <h3 className="font-secondary text-xl md:text-2xl text-[#0a2225]">Business Information</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="agencyName" className="text-sm font-medium text-[#0a2225]">Agency Name *</Label>
            <Input
              id="agencyName"
              value={formData.agencyName}
              onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="businessType" className="text-sm font-medium text-[#0a2225]">Business Type *</Label>
            <Select
              value={formData.businessType}
              onValueChange={(value: any) => setFormData({ ...formData, businessType: value })}
            >
              <SelectTrigger className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg">
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
            <Label htmlFor="businessAddress" className="text-sm font-medium text-[#0a2225]">Business Address</Label>
            <Input
              id="businessAddress"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="businessCity" className="text-sm font-medium text-[#0a2225]">City</Label>
            <Input
              id="businessCity"
              value={formData.businessCity}
              onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="businessState" className="text-sm font-medium text-[#0a2225]">State</Label>
            <Input
              id="businessState"
              value={formData.businessState}
              onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="yearEstablished" className="text-sm font-medium text-[#0a2225]">Year Established</Label>
            <Input
              id="yearEstablished"
              type="number"
              value={formData.yearEstablished}
              onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="website" className="text-sm font-medium text-[#0a2225]">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="businessLicenseNumber" className="text-sm font-medium text-[#0a2225]">Business License Number *</Label>
            <Input
              id="businessLicenseNumber"
              value={formData.businessLicenseNumber}
              onChange={(e) => setFormData({ ...formData, businessLicenseNumber: e.target.value })}
              required
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
          <div>
            <Label htmlFor="yearsExperience" className="text-sm font-medium text-[#0a2225]">Years of Experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              value={formData.yearsExperience}
              onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
              className="mt-1.5 min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={() => setStep(2)}
          className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8"
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderStep11 = () => (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF9F0] border border-[#C7A962]/30">
          <Shield className="h-10 w-10 text-[#C7A962]" />
        </div>
        <h3 className="mb-3 font-secondary text-2xl text-[#0a2225]">Identity Verification Required</h3>
        <p className="text-base text-[#6B7280] max-w-md mx-auto">
          All travel agents must complete identity verification through Stripe Identity.
          This is required under <em className="font-secondary">Goldsainte's</em> trust & safety policy and typically takes 2-3 minutes.
        </p>
      </div>

      <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0]/50 p-6">
        <h4 className="mb-3 text-sm font-semibold text-[#0a2225]">What you'll need:</h4>
        <ul className="space-y-2 text-sm text-[#6B7280]">
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />
            Government-issued photo ID (passport, driver's license, or ID card)
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />
            Device with camera for selfie verification
          </li>
          <li className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#C7A962]" />
            2-3 minutes to complete the process
          </li>
        </ul>
      </div>

      <Button
        type="button"
        onClick={startStripeVerification}
        disabled={isLoading}
        className="w-full bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full min-h-[52px] text-base"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Setting up verification...
          </>
        ) : (
          <>
            <Shield className="mr-2 h-5 w-5" />
            Start Identity Verification
          </>
        )}
      </Button>

      <p className="text-center text-xs text-[#9A9079]">
        Your information is secure and encrypted. <em className="font-secondary">Goldsainte</em> uses Stripe Identity
        for verification and does not store your government ID.
      </p>
    </div>
  );

  // Luxury input styling
  const luxuryInputClasses = "min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Luxury Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-secondary text-3xl md:text-4xl text-[#0a2225]">
            Travel Agent Application
          </h1>
          <p className="text-base text-[#6B7280]">
            Join <em className="font-secondary">Goldsainte's</em> exclusive network of luxury travel professionals
          </p>
          
          {/* Gold Progress Bar */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex gap-1.5">
              {[...Array(11)].map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-[#C7A962]' : 'bg-[#E5DFC6]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[#6B7280] ml-3">Step {step} of 11</span>
          </div>
        </div>

        {/* Luxury Card Container */}
        <Card className="bg-white border border-[#E5DFC6] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6 md:p-10">
            {step === 1 && renderStep1()}
            {step === 2 && (
              <>
                <Step2BusinessCompliance formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(1)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(3)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <Step3ProfessionalCredentials formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(2)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(4)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <Step4ExperienceExpertise formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(3)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(5)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 5 && (
              <>
                <Step5ClientSales formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(4)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(6)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 6 && (
              <>
                <Step6OnlinePresence formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(5)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(7)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 7 && (
              <>
                <Step7Technology formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(6)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(8)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 8 && (
              <>
                <Step8EmergencyLegal formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(7)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(9)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 9 && (
              <>
                <Step9Financial formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(8)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={() => setStep(10)} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
                </div>
              </>
            )}
            {step === 10 && (
              <>
                <Step10Documents formData={formData} setFormData={setFormData} />
                <div className="flex justify-between mt-8 pt-4 border-t border-[#E5DFC6]">
                  <Button variant="outline" onClick={() => setStep(9)} className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                  <Button onClick={saveDraftApplication} disabled={isLoading} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">
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
              </>
            )}
            {step === 11 && renderStep11()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
