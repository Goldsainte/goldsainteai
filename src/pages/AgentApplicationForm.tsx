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

type AgentApplicationData = {
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
};

export default function AgentApplicationForm() {
  const [step, setStep] = useState(1);
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

  const handleSubmit = async () => {
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
          iata_number: formData.iataNumber || null,
          arc_number: formData.arcNumber || null,
          clia_number: formData.cliaNumber || null,
          other_certifications: formData.otherCertifications || null,
          years_experience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
          specialties: formData.specializations,
          seller_of_travel_license: formData.sellerOfTravelLicense || null,
          seller_of_travel_state: formData.sellerOfTravelState || null,
          business_license_number: formData.businessLicenseNumber,
          tax_id_ein: formData.taxIdEIN || null,
          annual_revenue: formData.annualRevenue || null,
          has_eo_insurance: formData.errorsOmissionsInsurance,
          insurance_provider: formData.insuranceProvider || null,
          insurance_policy_number: formData.insurancePolicyNumber || null,
          insurance_coverage: formData.insuranceCoverage || null,
          reference1_name: formData.reference1Name || null,
          reference1_company: formData.reference1Company || null,
          reference1_email: formData.reference1Email || null,
          reference1_phone: formData.reference1Phone || null,
          reference2_name: formData.reference2Name || null,
          reference2_company: formData.reference2Company || null,
          reference2_email: formData.reference2Email || null,
          reference2_phone: formData.reference2Phone || null,
          bank_name: formData.bankName || null,
          account_holder_name: formData.accountHolderName || null,
          account_type: formData.accountType || null,
          routing_number: formData.routingNumber || null,
          account_number_last4: formData.accountNumber ? formData.accountNumber.slice(-4) : null,
          primary_focus: formData.primaryFocus,
          average_trip_value: formData.averageTripValue || null,
          monthly_bookings: formData.monthlyBookings || null,
          preferred_destinations: formData.preferredDestinations || null,
          why_goldsainte: formData.whyGoldsainte || null,
          business_license_document: businessLicensePath,
          insurance_certificate_document: insuranceCertPath,
          government_id_document: govIdPath,
          headshot_photo: headshotPath,
          application_status: 'pending_review',
          submitted_at: new Date().toISOString(),
          stripe_verification_status: 'pending',
        })
        .select()
        .single();

      if (applicationError) {
        console.error('Application error:', applicationError);
        throw new Error(applicationError.message || 'Failed to submit application');
      }

      setApplicationId(applicationData.id);

      try {
        await supabase.functions.invoke('notify-admin-new-application', {
          body: {
            applicationType: 'agent',
            applicationId: applicationData.id,
            applicantName: `${formData.firstName} ${formData.lastName}`,
            applicantEmail: formData.email,
          },
        });
      } catch (notifyErr) {
        console.error('Could not send admin notification:', notifyErr);
      }

      setSubmitted(true);
      
      toast({
        title: "Application submitted successfully!",
        description: "We'll review your application and contact you within 3-5 business days.",
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
    if (!applicationId) {
      toast({
        title: "Error",
        description: "Please submit your application first",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-identity-session', {
        body: {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          applicationType: 'agent',
          applicationId: applicationId,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Stripe verification error:', error);
      toast({
        title: "Verification setup failed",
        description: "You can complete identity verification later.",
        variant: "destructive",
      });
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-2xl">
          <Card className="border-2">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              
              <h1 className="mb-2 font-serif text-2xl font-semibold">
                Application Submitted Successfully!
              </h1>
              
              <p className="mb-6 text-sm text-muted-foreground">
                Thank you for applying to become a Goldsainte travel agent.
              </p>
              
              <div className="mb-6 rounded-lg bg-muted p-4 text-left">
                <p className="mb-2 text-xs font-semibold">What happens next:</p>
                <ol className="space-y-2 text-xs text-muted-foreground">
                  <li>1. Our team will review your application (3-5 business days)</li>
                  <li>2. We may contact your professional references</li>
                  <li>3. You'll receive an email with our decision</li>
                  <li>4. If approved, you'll get login credentials to access your dashboard</li>
                </ol>
              </div>

              {applicationId && (
                <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="mb-2 text-xs font-semibold">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Optional: Complete Identity Verification Now
                  </p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Speed up your approval by verifying your identity with Stripe. This takes 2-3 minutes.
                  </p>
                  <Button
                    onClick={startStripeVerification}
                    variant="outline"
                    className="w-full"
                  >
                    Verify Identity Now (Optional)
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={() => navigate("/")}
                  className="w-full"
                >
                  Return to Home
                </Button>
                
                <Button
                  onClick={() => navigate("/application/status")}
                  variant="outline"
                  className="w-full"
                >
                  Check Application Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
        <Button variant="outline" onClick={() => setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>
      </div>
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
          <div className="mx-auto mt-4 flex max-w-xs justify-between">
            <div className={`text-xs ${step >= 1 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Step 1: Personal & Business
            </div>
            <div className={`text-xs ${step >= 2 ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
              Step 2: Credentials
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
