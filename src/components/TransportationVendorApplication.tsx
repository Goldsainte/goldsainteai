import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, ArrowRight, Upload, Check, AlertCircle, Loader2 } from "lucide-react";
import { LoadingAnnouncement, ErrorAnnouncement } from "@/components/LoadingAnnouncement";

const STEPS = [
  "Business Information",
  "Service Areas",
  "Fleet Details",
  "Driver Credentials",
  "Compliance Documents",
  "Pricing Structure",
  "Technology Integration",
  "Promotion Preferences",
  "Terms & Agreement"
];

const VEHICLE_TYPES = [
  "sedan", "black_car", "suv", "luxury_suv", "van", "minibus",
  "coach_bus", "limousine", "exotic_car", "vintage_car", "eco_vehicle"
];

const PRICING_MODELS = [
  { value: "hourly", label: "Hourly Rate" },
  { value: "flat_rate", label: "Flat Rate" },
  { value: "zone_based", label: "Zone-Based Pricing" },
  { value: "custom", label: "Custom Pricing" }
];

export default function TransportationVendorApplication() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Business Info
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    yearsInBusiness: "",
    businessDescription: "",
    
    // Service Areas
    serviceAreas: [] as string[],
    serviceAreaInput: "",
    
    // Fleet
    vehicles: [] as any[],
    
    // Drivers
    totalDrivers: "",
    
    // Compliance
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    insuranceCoverageAmount: "",
    commercialLicenseNumber: "",
    commercialLicenseExpiry: "",
    dotNumber: "",
    
    // Pricing
    pricingModel: "",
    baseHourlyRate: "",
    minimumBookingHours: "2",
    cancellationPolicy: "",
    
    // Technology
    hasGpsTracking: false,
    hasBookingApi: false,
    apiEndpoint: "",
    
    // Promotion
    interestedInPromotion: false,
    
    // Agreement
    agreedToTerms: false,
    eSignature: ""
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addServiceArea = () => {
    if (formData.serviceAreaInput.trim()) {
      updateFormData("serviceAreas", [...formData.serviceAreas, formData.serviceAreaInput.trim()]);
      updateFormData("serviceAreaInput", "");
    }
  };

  const removeServiceArea = (index: number) => {
    updateFormData("serviceAreas", formData.serviceAreas.filter((_, i) => i !== index));
  };

  const validateCurrentStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (currentStep === 0) {
      if (!formData.businessName.trim()) errors.businessName = "Business name is required";
      if (!formData.contactEmail.trim()) errors.contactEmail = "Contact email is required";
      if (!formData.contactPhone.trim()) errors.contactPhone = "Contact phone is required";
    }
    
    if (currentStep === 1 && formData.serviceAreas.length === 0) {
      errors.serviceAreas = "At least one service area is required";
    }
    
    if (currentStep === 8) {
      if (!formData.agreedToTerms) errors.agreedToTerms = "You must agree to the terms";
      if (!formData.eSignature.trim()) errors.eSignature = "Electronic signature is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to submit an application");
      }

      const { data, error } = await supabase.functions.invoke("submit-transportation-vendor-application", {
        body: {
          businessName: formData.businessName,
          contactEmail: formData.contactEmail,
          contactPhone: formData.contactPhone,
          businessAddress: formData.businessAddress,
          yearsInBusiness: parseInt(formData.yearsInBusiness) || 0,
          businessDescription: formData.businessDescription,
          serviceAreas: formData.serviceAreas,
          vehicles: formData.vehicles,
          totalDrivers: parseInt(formData.totalDrivers) || 0,
          insurancePolicyNumber: formData.insurancePolicyNumber,
          insuranceExpiryDate: formData.insuranceExpiryDate,
          insuranceCoverageAmount: parseFloat(formData.insuranceCoverageAmount) || 0,
          commercialLicenseNumber: formData.commercialLicenseNumber,
          commercialLicenseExpiry: formData.commercialLicenseExpiry,
          dotNumber: formData.dotNumber,
          pricingModel: formData.pricingModel,
          baseHourlyRate: parseFloat(formData.baseHourlyRate) || 0,
          minimumBookingHours: parseInt(formData.minimumBookingHours) || 2,
          cancellationPolicy: formData.cancellationPolicy,
          hasGpsTracking: formData.hasGpsTracking,
          hasBookingApi: formData.hasBookingApi,
          apiEndpoint: formData.apiEndpoint,
          interestedInPromotion: formData.interestedInPromotion
        }
      });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 3-5 business days."
      });

      navigate("/supplier-management");
    } catch (error: any) {
      const errorMessage = error.message || "Failed to submit application. Please try again.";
      setSubmitError(errorMessage);
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.businessName && formData.contactEmail && formData.contactPhone;
      case 1:
        return formData.serviceAreas.length > 0;
      case 8:
        return formData.agreedToTerms && formData.eSignature;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => updateFormData("businessName", e.target.value)}
                placeholder="Luxury Transport Services LLC"
              />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormData("contactEmail", e.target.value)}
                placeholder="contact@luxurytransport.com"
              />
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => updateFormData("contactPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="businessAddress">Business Address</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => updateFormData("businessAddress", e.target.value)}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
            <div>
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                type="number"
                value={formData.yearsInBusiness}
                onChange={(e) => updateFormData("yearsInBusiness", e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="businessDescription">Business Description</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => updateFormData("businessDescription", e.target.value)}
                placeholder="Tell us about your transportation business..."
                rows={4}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Service Areas *</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.serviceAreaInput}
                  onChange={(e) => updateFormData("serviceAreaInput", e.target.value)}
                  placeholder="e.g., Los Angeles, CA"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addServiceArea())}
                />
                <Button type="button" onClick={addServiceArea}>Add</Button>
              </div>
            </div>
            {formData.serviceAreas.length > 0 && (
              <div className="space-y-2">
                <Label>Added Service Areas:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.serviceAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full">
                      <span className="text-sm">{area}</span>
                      <button
                        onClick={() => removeServiceArea(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="insurancePolicyNumber">Insurance Policy Number</Label>
              <Input
                id="insurancePolicyNumber"
                value={formData.insurancePolicyNumber}
                onChange={(e) => updateFormData("insurancePolicyNumber", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="insuranceExpiryDate">Insurance Expiry Date</Label>
              <Input
                id="insuranceExpiryDate"
                type="date"
                value={formData.insuranceExpiryDate}
                onChange={(e) => updateFormData("insuranceExpiryDate", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="insuranceCoverageAmount">Coverage Amount ($)</Label>
              <Input
                id="insuranceCoverageAmount"
                type="number"
                value={formData.insuranceCoverageAmount}
                onChange={(e) => updateFormData("insuranceCoverageAmount", e.target.value)}
                placeholder="1000000"
              />
            </div>
            <div>
              <Label htmlFor="commercialLicenseNumber">Commercial License Number</Label>
              <Input
                id="commercialLicenseNumber"
                value={formData.commercialLicenseNumber}
                onChange={(e) => updateFormData("commercialLicenseNumber", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dotNumber">DOT Number (if applicable)</Label>
              <Input
                id="dotNumber"
                value={formData.dotNumber}
                onChange={(e) => updateFormData("dotNumber", e.target.value)}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="pricingModel">Pricing Model</Label>
              <Select value={formData.pricingModel} onValueChange={(v) => updateFormData("pricingModel", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pricing model" />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_MODELS.map(model => (
                    <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="baseHourlyRate">Base Hourly Rate ($)</Label>
              <Input
                id="baseHourlyRate"
                type="number"
                value={formData.baseHourlyRate}
                onChange={(e) => updateFormData("baseHourlyRate", e.target.value)}
                placeholder="75"
              />
            </div>
            <div>
              <Label htmlFor="minimumBookingHours">Minimum Booking Hours</Label>
              <Input
                id="minimumBookingHours"
                type="number"
                value={formData.minimumBookingHours}
                onChange={(e) => updateFormData("minimumBookingHours", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancellationPolicy"
                value={formData.cancellationPolicy}
                onChange={(e) => updateFormData("cancellationPolicy", e.target.value)}
                placeholder="Describe your cancellation policy..."
                rows={4}
              />
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreedToTerms}
                onCheckedChange={(checked) => updateFormData("agreedToTerms", checked)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the Goldsainte Transportation Vendor Terms & Conditions, including compliance
                with all local, state, and federal regulations, maintaining proper insurance coverage,
                and providing safe, reliable transportation services.
              </Label>
            </div>
            <div>
              <Label htmlFor="eSignature">Electronic Signature *</Label>
              <Input
                id="eSignature"
                value={formData.eSignature}
                onChange={(e) => updateFormData("eSignature", e.target.value)}
                placeholder="Type your full name to sign"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            This section is under construction. Please continue to the next step.
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      {isSubmitting && <LoadingAnnouncement message="Submitting your vendor application" />}
      {submitError && <ErrorAnnouncement message={submitError} />}
      
      <Card>
        <CardHeader>
          <CardTitle>Transportation Vendor Application</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
          </CardDescription>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {submitError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
          
          {Object.keys(fieldErrors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please correct the errors below before continuing.
              </AlertDescription>
            </Alert>
          )}
          
          {renderStep()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={() => {
                  if (validateCurrentStep()) {
                    setCurrentStep(prev => prev + 1);
                  }
                }}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
