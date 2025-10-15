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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Upload, Check, AlertCircle, Loader2, X, Plus, MapPin, Percent } from "lucide-react";
import { LoadingAnnouncement, ErrorAnnouncement } from "@/components/LoadingAnnouncement";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import VendorDocumentUpload from "@/components/VendorDocumentUpload";
import VendorPromotionalMediaUpload from "@/components/VendorPromotionalMediaUpload";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const STEPS = [
  "Business Information",
  "Service Areas",
  "Fleet Details",
  "Driver Credentials",
  "Compliance Documents",
  "Pricing Structure",
  "Technology Integration",
  "Promotional Content",
  "Marketing Tier",
  "Terms & Agreement"
];

const PROMOTION_TIERS = [
  {
    id: 'free',
    name: 'Free Listing',
    icon: '📋',
    monthlyPrice: 0,
    commissionRate: 15.0,
    subtitle: 'Basic visibility',
    features: [
      'Standard directory listing',
      'Up to 5 fleet photos',
      'Basic profile',
      'Email support',
      'Standard search placement'
    ],
    popular: false
  },
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    monthlyPrice: 99,
    commissionRate: 15.0,
    subtitle: 'Enhanced presence',
    features: [
      'Everything in Free, PLUS:',
      'Up to 15 fleet photos',
      'Social media links',
      'Priority email support',
      'Basic analytics dashboard'
    ],
    popular: false
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '🥈',
    monthlyPrice: 299,
    commissionRate: 13.5,
    commissionSavings: 1.5,
    subtitle: 'Featured vendor',
    features: [
      'Everything in Bronze, PLUS:',
      'Featured Badge on profile',
      'Top 10 search placement',
      'Unlimited photos + 1 video',
      'Homepage spotlight rotation',
      '10% commission discount',
      '24/7 priority support',
      'Enhanced analytics'
    ],
    popular: true
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '🥇',
    monthlyPrice: 599,
    commissionRate: 12.75,
    commissionSavings: 2.25,
    subtitle: 'Premium promoted',
    features: [
      'Everything in Silver, PLUS:',
      '"Sponsored" label at top of search',
      'Featured in Journey feed',
      'Unlimited photos + 3 videos',
      'Push notifications to customers',
      'Custom branded landing page',
      'Retargeting campaigns',
      'Advanced ROI analytics',
      '15% commission discount',
      'Dedicated account manager'
    ],
    popular: false
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: '💎',
    monthlyPrice: 1499,
    commissionRate: 12.0,
    commissionSavings: 3.0,
    subtitle: 'White label partner',
    features: [
      'Everything in Gold, PLUS:',
      'Co-branded app experience',
      'API integration',
      'Custom domain option',
      'Unlimited promotional content',
      'Featured in email marketing',
      'Social media takeovers',
      'White-glove onboarding',
      '20% commission discount',
      'Performance-based pricing option'
    ],
    popular: false
  }
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
    
    // Social Media
    instagramHandle: "",
    tiktokHandle: "",
    twitterHandle: "",
    facebookPage: "",
    linkedinPage: "",
    
    // Service Areas
    serviceAreas: [] as string[],
    serviceAreaInput: "",
    
    // Fleet
    vehicles: [] as any[],
    currentVehicle: {
      vehicleType: "",
      make: "",
      model: "",
      year: "",
      licensePlate: "",
      passengerCapacity: "",
      features: ""
    },
    
    // Drivers
    totalDrivers: "",
    driverVettingProcess: "",
    backgroundCheckPolicy: "",
    averageDriverExperience: "",
    driverTrainingProgram: "",
    cdlCompliance: false,
    
    // Compliance & Documents
    insurancePolicyNumber: "",
    insuranceExpiryDate: "",
    insuranceCoverageAmount: "",
    commercialLicenseNumber: "",
    commercialLicenseExpiry: "",
    dotNumber: "",
    insuranceDocuments: [] as { id: string; fileName: string; fileUrl: string }[],
    driverLicenseDocuments: [] as { id: string; fileName: string; fileUrl: string }[],
    
    // Pricing
    pricingModel: "",
    baseHourlyRate: "",
    minimumBookingHours: "2",
    cancellationPolicy: "",
    
    // Technology
    hasGpsTracking: false,
    hasBookingApi: false,
    apiEndpoint: "",
    hasRealTimeTracking: false,
    hasMobileApp: false,
    hasAutomatedDispatch: false,
    
    // Promotion - Enhanced
    interestedInPromotion: false,
    promotionBudget: "",
    targetCustomerSegments: [] as string[],
    marketingDescription: "",
    specialOffers: "",
    promotionPricingModel: "",
    promotionTargetImpressions: "",
    promotionTargetClicks: "",
    promotionGeographicTargets: [] as string[],
    targetCityInput: "",
    promotionDiscountOffered: "",
    promotionSpecialPackages: [] as Array<{
      name: string;
      description: string;
      price: string;
      promoPrice: string;
      photos: string[];
    }>,
    currentSpecialPackage: { name: "", description: "", price: "", promoPrice: "" },
    currentPackagePhotos: [] as string[],
    selectedPromotionTier: 'free' as string,
    promotionalMedia: [] as Array<{
      id: string;
      type: 'photo' | 'video';
      url: string;
      caption: string;
      isCover: boolean;
      displayOrder: number;
    }>,
    
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

  const addVehicle = () => {
    const vehicle = formData.currentVehicle;
    if (vehicle.vehicleType && vehicle.make && vehicle.model) {
      updateFormData("vehicles", [...formData.vehicles, { ...vehicle }]);
      updateFormData("currentVehicle", {
        vehicleType: "",
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        passengerCapacity: "",
        features: ""
      });
    }
  };

  const removeVehicle = (index: number) => {
    updateFormData("vehicles", formData.vehicles.filter((_, i) => i !== index));
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
    
    if (currentStep === 4) {
      if (formData.insuranceDocuments.length === 0) {
        errors.insuranceDocuments = "At least one insurance document is required";
      }
      if (formData.driverLicenseDocuments.length === 0) {
        errors.driverLicenseDocuments = "At least one driver license is required";
      }
    }
    
    if (currentStep === 9) {
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
          driverVettingProcess: formData.driverVettingProcess,
          backgroundCheckPolicy: formData.backgroundCheckPolicy,
          averageDriverExperience: parseFloat(formData.averageDriverExperience) || 0,
          driverTrainingProgram: formData.driverTrainingProgram,
          cdlCompliance: formData.cdlCompliance,
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
          hasRealTimeTracking: formData.hasRealTimeTracking,
          hasMobileApp: formData.hasMobileApp,
          hasAutomatedDispatch: formData.hasAutomatedDispatch,
          hasBookingApi: formData.hasBookingApi,
          apiEndpoint: formData.apiEndpoint,
          interestedInPromotion: formData.interestedInPromotion,
          promotionBudget: parseFloat(formData.promotionBudget) || 0,
          marketingDescription: formData.marketingDescription,
          specialOffers: formData.specialOffers,
          insuranceDocuments: formData.insuranceDocuments,
          driverLicenseDocuments: formData.driverLicenseDocuments,
          instagramHandle: formData.instagramHandle,
          tiktokHandle: formData.tiktokHandle,
          twitterHandle: formData.twitterHandle,
          facebookPage: formData.facebookPage,
          linkedinPage: formData.linkedinPage,
          promotionPricingModel: formData.promotionPricingModel,
          promotionTargetImpressions: parseInt(formData.promotionTargetImpressions) || 0,
          promotionTargetClicks: parseInt(formData.promotionTargetClicks) || 0,
          promotionGeographicTargets: formData.promotionGeographicTargets,
          promotionDiscountOffered: parseFloat(formData.promotionDiscountOffered) || 0,
          promotionSpecialPackages: formData.promotionSpecialPackages,
          selectedPromotionTier: formData.selectedPromotionTier,
          promotionalMedia: formData.promotionalMedia
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
      case 4:
        return formData.insuranceDocuments.length > 0 && formData.driverLicenseDocuments.length > 0;
      case 9:
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
            
            <div className="space-y-4 mt-6 pt-6 border-t">
              <h3 className="font-semibold text-lg">Social Media (Optional)</h3>
              <p className="text-sm text-muted-foreground">
                Link your social media accounts to help customers learn more about your business
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instagramHandle">Instagram Handle</Label>
                  <Input
                    id="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={(e) => updateFormData("instagramHandle", e.target.value)}
                    placeholder="@yourcompany"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tiktokHandle">TikTok Handle</Label>
                  <Input
                    id="tiktokHandle"
                    value={formData.tiktokHandle}
                    onChange={(e) => updateFormData("tiktokHandle", e.target.value)}
                    placeholder="@yourcompany"
                  />
                </div>
                
                <div>
                  <Label htmlFor="twitterHandle">Twitter/X Handle</Label>
                  <Input
                    id="twitterHandle"
                    value={formData.twitterHandle}
                    onChange={(e) => updateFormData("twitterHandle", e.target.value)}
                    placeholder="@yourcompany"
                  />
                </div>
                
                <div>
                  <Label htmlFor="facebookPage">Facebook Page URL</Label>
                  <Input
                    id="facebookPage"
                    type="url"
                    value={formData.facebookPage}
                    onChange={(e) => updateFormData("facebookPage", e.target.value)}
                    placeholder="https://facebook.com/yourcompany"
                  />
                </div>
                
                <div>
                  <Label htmlFor="linkedinPage">LinkedIn Page URL</Label>
                  <Input
                    id="linkedinPage"
                    type="url"
                    value={formData.linkedinPage}
                    onChange={(e) => updateFormData("linkedinPage", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label>Service Areas *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <CityAutocomplete
                    value={formData.serviceAreaInput}
                    onChange={(value) => updateFormData("serviceAreaInput", value)}
                    placeholder="Enter city or region (e.g., Los Angeles, CA)"
                  />
                </div>
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

      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type *</Label>
                <Select 
                  value={formData.currentVehicle.vehicleType} 
                  onValueChange={(v) => updateFormData("currentVehicle", { ...formData.currentVehicle, vehicleType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.currentVehicle.make}
                  onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, make: e.target.value })}
                  placeholder="e.g., Mercedes-Benz"
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.currentVehicle.model}
                  onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, model: e.target.value })}
                  placeholder="e.g., S-Class"
                />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  value={formData.currentVehicle.year}
                  onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, year: e.target.value })}
                  placeholder="2024"
                />
              </div>
              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={formData.currentVehicle.licensePlate}
                  onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, licensePlate: e.target.value })}
                  placeholder="ABC-1234"
                />
              </div>
              <div>
                <Label htmlFor="passengerCapacity">Passenger Capacity</Label>
                <Input
                  id="passengerCapacity"
                  type="number"
                  value={formData.currentVehicle.passengerCapacity}
                  onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, passengerCapacity: e.target.value })}
                  placeholder="4"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="features">Features</Label>
              <Input
                id="features"
                value={formData.currentVehicle.features}
                onChange={(e) => updateFormData("currentVehicle", { ...formData.currentVehicle, features: e.target.value })}
                placeholder="e.g., WiFi, leather seats, entertainment system"
              />
            </div>
            <Button type="button" onClick={addVehicle}>
              Add Vehicle to Fleet
            </Button>
            
            {formData.vehicles.length > 0 && (
              <div className="space-y-2">
                <Label>Fleet ({formData.vehicles.length} vehicles):</Label>
                <div className="space-y-2">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.vehicleType.replace(/_/g, ' ')} • {vehicle.passengerCapacity} passengers
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVehicle(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalDrivers">Total Number of Drivers</Label>
              <Input
                id="totalDrivers"
                type="number"
                value={formData.totalDrivers}
                onChange={(e) => updateFormData("totalDrivers", e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="driverVettingProcess">Driver Vetting Process</Label>
              <Textarea
                id="driverVettingProcess"
                value={formData.driverVettingProcess}
                onChange={(e) => updateFormData("driverVettingProcess", e.target.value)}
                placeholder="Describe how you vet and screen your drivers..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="backgroundCheckPolicy">Background Check Policy</Label>
              <Textarea
                id="backgroundCheckPolicy"
                value={formData.backgroundCheckPolicy}
                onChange={(e) => updateFormData("backgroundCheckPolicy", e.target.value)}
                placeholder="Describe your background check requirements..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="averageDriverExperience">Average Driver Experience (years)</Label>
              <Input
                id="averageDriverExperience"
                type="number"
                value={formData.averageDriverExperience}
                onChange={(e) => updateFormData("averageDriverExperience", e.target.value)}
                placeholder="5"
              />
            </div>
            <div>
              <Label htmlFor="driverTrainingProgram">Driver Training Program</Label>
              <Textarea
                id="driverTrainingProgram"
                value={formData.driverTrainingProgram}
                onChange={(e) => updateFormData("driverTrainingProgram", e.target.value)}
                placeholder="Describe your driver training and certification program..."
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cdlCompliance"
                checked={formData.cdlCompliance}
                onCheckedChange={(checked) => updateFormData("cdlCompliance", checked)}
              />
              <Label htmlFor="cdlCompliance">
                All drivers have valid Commercial Driver's Licenses (CDL) where required
              </Label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <VendorDocumentUpload
              documentType="insurance"
              documents={formData.insuranceDocuments}
              onDocumentsChange={(docs) => updateFormData("insuranceDocuments", docs)}
              label="Insurance Documents"
              required
            />
            
            <VendorDocumentUpload
              documentType="driver_license"
              documents={formData.driverLicenseDocuments}
              onDocumentsChange={(docs) => updateFormData("driverLicenseDocuments", docs)}
              label="Driver Licenses"
              required
            />
            
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-4">Additional Compliance Information</h3>
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

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasGpsTracking"
                checked={formData.hasGpsTracking}
                onCheckedChange={(checked) => updateFormData("hasGpsTracking", checked)}
              />
              <Label htmlFor="hasGpsTracking">GPS Tracking Capability</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasRealTimeTracking"
                checked={formData.hasRealTimeTracking}
                onCheckedChange={(checked) => updateFormData("hasRealTimeTracking", checked)}
              />
              <Label htmlFor="hasRealTimeTracking">Real-Time Tracking for Customers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasMobileApp"
                checked={formData.hasMobileApp}
                onCheckedChange={(checked) => updateFormData("hasMobileApp", checked)}
              />
              <Label htmlFor="hasMobileApp">Mobile App for Drivers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAutomatedDispatch"
                checked={formData.hasAutomatedDispatch}
                onCheckedChange={(checked) => updateFormData("hasAutomatedDispatch", checked)}
              />
              <Label htmlFor="hasAutomatedDispatch">Automated Dispatch System</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasBookingApi"
                checked={formData.hasBookingApi}
                onCheckedChange={(checked) => updateFormData("hasBookingApi", checked)}
              />
              <Label htmlFor="hasBookingApi">Booking API Integration</Label>
            </div>
            {formData.hasBookingApi && (
              <div>
                <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
                <Input
                  id="apiEndpoint"
                  type="url"
                  value={formData.apiEndpoint}
                  onChange={(e) => updateFormData("apiEndpoint", e.target.value)}
                  placeholder="https://api.yourtransportservice.com/bookings"
                />
              </div>
            )}
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Showcase Your Fleet</h2>
              <p className="text-muted-foreground">
                Upload photos and videos of your vehicles to attract more customers
              </p>
            </div>
            
            <VendorPromotionalMediaUpload
              media={formData.promotionalMedia}
              onMediaChange={(newMedia) => updateFormData("promotionalMedia", newMedia)}
            />
          </div>
        );

      case 8:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-3">Choose Your Marketing Level</h2>
              <p className="text-muted-foreground text-lg">
                Increase your bookings with targeted promotions. Higher tiers unlock better placement, 
                more visibility, and lower commission rates.
              </p>
            </div>
            
            {/* Tier Comparison Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {PROMOTION_TIERS.map((tier) => (
                <Card 
                  key={tier.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-xl hover:scale-105 relative",
                    formData.selectedPromotionTier === tier.id && "ring-4 ring-primary shadow-2xl"
                  )}
                  onClick={() => updateFormData("selectedPromotionTier", tier.id)}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground shadow-lg">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="text-4xl mb-2">{tier.icon}</div>
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <div className="text-3xl font-bold mt-3">
                      {tier.monthlyPrice === 0 ? (
                        <span>Free</span>
                      ) : (
                        <>
                          ${tier.monthlyPrice}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{tier.subtitle}</p>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-2.5">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className={feature.startsWith('Everything') ? 'font-semibold' : ''}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {tier.id !== 'free' && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-xs font-semibold text-center">Commission Rate</p>
                        <p className="text-2xl font-bold text-primary text-center">
                          {tier.commissionRate}%
                        </p>
                        {tier.commissionSavings && (
                          <p className="text-xs text-center text-muted-foreground mt-1">
                            Save {tier.commissionSavings}% per booking
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Enhanced Options for Gold/Platinum Tiers */}
            {(formData.selectedPromotionTier === 'gold' || formData.selectedPromotionTier === 'platinum') && (
              <div className="space-y-6 mt-8 pt-8 border-t">
                <h3 className="text-2xl font-semibold">Configure Your Promotion Campaign</h3>
                
                {/* Pricing Model Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Model</CardTitle>
                    <CardDescription>Choose how you want to pay for promotions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select 
                      value={formData.promotionPricingModel} 
                      onValueChange={(v) => updateFormData("promotionPricingModel", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pricing model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat_monthly">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Flat Monthly Rate</span>
                            <span className="text-xs text-muted-foreground">Fixed cost per month (recommended)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cpc">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Cost Per Click (CPC)</span>
                            <span className="text-xs text-muted-foreground">Pay when customers click</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cpm">
                          <div className="flex flex-col items-start">
                            <span className="font-semibold">Cost Per 1000 Impressions (CPM)</span>
                            <span className="text-xs text-muted-foreground">Pay per 1000 views</span>
                          </div>
                        </SelectItem>
                        {formData.selectedPromotionTier === 'platinum' && (
                          <SelectItem value="performance_based">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold">Performance-Based</span>
                              <span className="text-xs text-muted-foreground">Pay based on bookings (Platinum only)</span>
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <div>
                      <Label htmlFor="promotionBudget">Monthly Marketing Budget ($)</Label>
                      <Input
                        id="promotionBudget"
                        type="number"
                        value={formData.promotionBudget}
                        onChange={(e) => updateFormData("promotionBudget", e.target.value)}
                        placeholder="1000"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        💡 Recommended: $500-$2000/month for optimal results
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Target Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Marketing Goals & Metrics</CardTitle>
                    <CardDescription>Set your monthly performance targets</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="promotionTargetImpressions">Target Monthly Impressions</Label>
                      <Input
                        id="promotionTargetImpressions"
                        type="number"
                        value={formData.promotionTargetImpressions}
                        onChange={(e) => updateFormData("promotionTargetImpressions", e.target.value)}
                        placeholder="10000"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Number of times your listing will be seen</p>
                    </div>
                    
                    <div>
                      <Label htmlFor="promotionTargetClicks">Target Monthly Clicks</Label>
                      <Input
                        id="promotionTargetClicks"
                        type="number"
                        value={formData.promotionTargetClicks}
                        onChange={(e) => updateFormData("promotionTargetClicks", e.target.value)}
                        placeholder="500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Expected customer engagement</p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Geographic Targeting */}
                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Targeting</CardTitle>
                    <CardDescription>Focus your marketing budget on specific locations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CityAutocomplete
                          value={formData.targetCityInput || ""}
                          onChange={(value) => updateFormData("targetCityInput", value)}
                          placeholder="Add target city or region"
                        />
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => {
                          const trimmed = (formData.targetCityInput || "").trim();
                          if (trimmed && !formData.promotionGeographicTargets.includes(trimmed)) {
                            updateFormData("promotionGeographicTargets", [...formData.promotionGeographicTargets, trimmed]);
                            updateFormData("targetCityInput", "");
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {formData.promotionGeographicTargets.length > 0 && (
                      <div>
                        <Label className="mb-2 block">Targeted Locations ({formData.promotionGeographicTargets.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {formData.promotionGeographicTargets.map((target, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1.5 px-3">
                              <MapPin className="h-3 w-3" />
                              {target}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                                onClick={() => updateFormData("promotionGeographicTargets", 
                                  formData.promotionGeographicTargets.filter((_, i) => i !== index)
                                )}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Special Promotional Packages Builder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Create Special Promotional Packages</CardTitle>
                    <CardDescription>
                      Build exclusive deals for customers who find you through promotions - increase conversion rates!
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Promotional Discount */}
                    <div>
                      <Label htmlFor="promotionDiscountOffered" className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Promotional Discount (%)
                      </Label>
                      <Input
                        id="promotionDiscountOffered"
                        type="number"
                        value={formData.promotionDiscountOffered}
                        onChange={(e) => updateFormData("promotionDiscountOffered", e.target.value)}
                        placeholder="10"
                        min="0"
                        max="50"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        💡 Offer a discount to customers who find you through promotions
                      </p>
                    </div>
                    
                    <Separator />
                    
                    {/* Package Builder */}
                    <div className="space-y-4 border rounded-lg p-4 bg-secondary/20">
                      <h4 className="font-semibold text-lg">Build a Package</h4>
                      
                      <div>
                        <Label>Package Photos (up to 10)</Label>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []).slice(0, 10);
                            const urls = files.map(f => URL.createObjectURL(f));
                            updateFormData("currentPackagePhotos", urls);
                          }}
                        />
                        {formData.currentPackagePhotos && formData.currentPackagePhotos.length > 0 && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {formData.currentPackagePhotos.map((url: string, idx: number) => (
                              <div key={idx} className="relative">
                                <img src={url} className="w-20 h-20 object-cover rounded-lg" alt="Package" />
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                  onClick={() => {
                                    updateFormData("currentPackagePhotos", 
                                      formData.currentPackagePhotos.filter((_: string, i: number) => i !== idx)
                                    );
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="packageName">Package Name</Label>
                        <Input
                          id="packageName"
                          value={formData.currentSpecialPackage.name}
                          onChange={(e) => updateFormData("currentSpecialPackage", {
                            ...formData.currentSpecialPackage,
                            name: e.target.value
                          })}
                          placeholder="e.g., VIP Airport Transfer Package"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="packageDescription">Package Description</Label>
                        <Textarea
                          id="packageDescription"
                          value={formData.currentSpecialPackage.description}
                          onChange={(e) => updateFormData("currentSpecialPackage", {
                            ...formData.currentSpecialPackage,
                            description: e.target.value
                          })}
                          placeholder="Describe what's included in this package..."
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="packageRegularPrice">Regular Price ($)</Label>
                          <Input
                            id="packageRegularPrice"
                            type="number"
                            value={formData.currentSpecialPackage.price}
                            onChange={(e) => updateFormData("currentSpecialPackage", {
                              ...formData.currentSpecialPackage,
                              price: e.target.value
                            })}
                            placeholder="150"
                          />
                        </div>
                        <div>
                          <Label htmlFor="packagePromoPrice">Promotional Price ($)</Label>
                          <Input
                            id="packagePromoPrice"
                            type="number"
                            value={formData.currentSpecialPackage.promoPrice}
                            onChange={(e) => updateFormData("currentSpecialPackage", {
                              ...formData.currentSpecialPackage,
                              promoPrice: e.target.value
                            })}
                            placeholder="120"
                          />
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          const pkg = formData.currentSpecialPackage;
                          if (pkg.name && pkg.description && pkg.price && pkg.promoPrice) {
                            updateFormData("promotionSpecialPackages", [
                              ...formData.promotionSpecialPackages,
                              { ...pkg, photos: formData.currentPackagePhotos || [] }
                            ]);
                            updateFormData("currentSpecialPackage", { name: "", description: "", price: "", promoPrice: "" });
                            updateFormData("currentPackagePhotos", []);
                            toast({
                              title: "Package added!",
                              description: "Your promotional package has been created"
                            });
                          } else {
                            toast({
                              title: "Missing fields",
                              description: "Please fill in all package fields",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Package
                      </Button>
                    </div>
                    
                    {/* Display Created Packages */}
                    {formData.promotionSpecialPackages.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-lg">Your Promotional Packages ({formData.promotionSpecialPackages.length})</Label>
                        {formData.promotionSpecialPackages.map((pkg: any, index: number) => {
                          const discount = pkg.price && pkg.promoPrice 
                            ? Math.round(((parseFloat(pkg.price) - parseFloat(pkg.promoPrice)) / parseFloat(pkg.price)) * 100)
                            : 0;
                          
                          return (
                            <Card key={index} className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex gap-4">
                                  {pkg.photos && pkg.photos[0] && (
                                    <img 
                                      src={pkg.photos[0]} 
                                      className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                                      alt={pkg.name}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-lg">{pkg.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>
                                    <div className="flex items-center gap-4 mt-3">
                                      <span className="line-through text-muted-foreground text-sm">
                                        ${pkg.price}
                                      </span>
                                      <span className="text-2xl font-bold text-primary">
                                        ${pkg.promoPrice}
                                      </span>
                                      <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                                        {discount}% OFF
                                      </Badge>
                                    </div>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => updateFormData("promotionSpecialPackages",
                                      formData.promotionSpecialPackages.filter((_: any, i: number) => i !== index)
                                    )}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Marketing Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>Marketing Copy</CardTitle>
                    <CardDescription>Write compelling copy for your promoted listings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.marketingDescription}
                      onChange={(e) => updateFormData("marketingDescription", e.target.value)}
                      placeholder="Describe your unique selling points, fleet quality, service excellence, and what makes you the best choice for luxury transportation..."
                      rows={6}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.marketingDescription?.length || 0} / 500 characters
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Summary Box */}
            {formData.selectedPromotionTier && (
              <Card className="bg-primary/5 border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Plan</p>
                      <p className="text-2xl font-bold">
                        {PROMOTION_TIERS.find(t => t.id === formData.selectedPromotionTier)?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Monthly Cost</p>
                      <p className="text-3xl font-bold">
                        {PROMOTION_TIERS.find(t => t.id === formData.selectedPromotionTier)?.monthlyPrice === 0
                          ? 'Free'
                          : `$${PROMOTION_TIERS.find(t => t.id === formData.selectedPromotionTier)?.monthlyPrice}`
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 9:
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
