import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GoogleCityAutocomplete } from '@/components/GoogleCityAutocomplete';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Upload, FileText, X, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface BrandFormData {
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  brandName: string;
  brandType: string;
  bio: string;
  website: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  taxId: string;
  regions: string[];
  cities: string[];
  styleTags: string[];
  priceRange: string;
  logoUrl: string;
  coverImageUrl: string;
  galleryUrls: string[];
  instagramHandle: string;
  tiktokHandle: string;
  facebookUrl: string;
  linkedinUrl: string;
  amenities: string[];
  sustainabilityCertifications: string[];
  qualityCertifications: string[];
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedVendor: boolean;
}

interface UploadedDocument {
  type: string;
  url: string;
  uploadedAt: string;
  fileName: string;
  fileSize: number;
}

const BRAND_TYPES = [
  { value: 'Tour Operator', label: 'Tour Operator' },
  { value: 'Experience Brand', label: 'Experience Brand' },
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Resort', label: 'Resort' },
  { value: 'Villa / Home', label: 'Villa / Vacation Home' },
  { value: 'Boutique Stay', label: 'Boutique Stay' },
  { value: 'Restaurant / Bar', label: 'Restaurant / Bar' },
  { value: 'Retail / Design Brand', label: 'Retail / Design Brand' },
  { value: 'Transportation', label: 'Transportation Service' },
  { value: 'Other', label: 'Other' }
];

const PRICE_RANGES = [
  { value: 'budget', label: 'Budget ($-$$)' },
  { value: 'mid-range', label: 'Mid-Range ($$$)' },
  { value: 'luxury', label: 'Luxury ($$$$)' },
  { value: 'ultra-luxury', label: 'Ultra-Luxury ($$$$$)' }
];

const REGIONS = [
  'North America', 'Caribbean', 'Central America', 'South America',
  'Western Europe', 'Eastern Europe', 'Middle East', 'North Africa',
  'Sub-Saharan Africa', 'East Asia', 'Southeast Asia', 'South Asia',
  'Australia & New Zealand', 'Pacific Islands'
];

const STYLE_TAGS = [
  'Modern', 'Contemporary', 'Traditional', 'Rustic', 'Minimalist',
  'Bohemian', 'Coastal', 'Mountain', 'Urban', 'Rural',
  'Eco-Friendly', 'Sustainable', 'Wellness', 'Adventure', 'Romantic',
  'Family-Friendly', 'Adults-Only', 'Pet-Friendly', 'LGBTQ+ Friendly',
  'Accessible', 'Historic', 'Boutique', 'Design-Forward', 'Cultural'
];

const AMENITIES = [
  'Wi-Fi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar',
  'Room Service', 'Concierge', 'Valet Parking', 'Airport Transfer',
  'Business Center', 'Conference Rooms', 'Beach Access', 'Private Beach',
  'Water Sports', 'Golf Course', 'Tennis Courts', 'Kids Club',
  'Babysitting', 'Pet Services', 'Laundry', 'Dry Cleaning',
  'EV Charging', 'Wheelchair Accessible', 'Bicycle Rental'
];

const SUSTAINABILITY_CERTS = [
  'LEED Certified', 'Green Key', 'EarthCheck', 'Green Globe',
  'Travelife', 'B Corp Certified', 'Fair Trade Certified',
  'Rainforest Alliance', 'Carbon Neutral', 'Zero Waste'
];

const QUALITY_CERTS = [
  'Forbes Travel Guide', 'AAA Five Diamond', 'Michelin Stars',
  "World's 50 Best", 'Relais & Châteaux', 'Leading Hotels of the World',
  'Preferred Hotels & Resorts', 'Small Luxury Hotels', 'Design Hotels'
];

const luxuryInputClasses = "min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 focus:ring-offset-0 rounded-lg placeholder:text-sm";
const luxurySelectTriggerClasses = "min-h-[48px] border-[#E5DFC6] bg-white focus:border-[#C7A962] focus:ring-2 focus:ring-[#C7A962]/20 rounded-lg";

export default function BrandOnboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.includes("tour-operator")) {
      setFormData((prev) => (prev.brandType ? prev : { ...prev, brandType: "Tour Operator" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  const [formData, setFormData] = useState<BrandFormData>({
    primaryContactName: '',
    primaryContactEmail: '',
    primaryContactPhone: '',
    brandName: '',
    brandType: '',  // preselected to 'Tour Operator' via effect when arriving at /apply/tour-operator
    bio: '',
    website: '',
    businessAddress: '',
    businessCity: '',
    businessState: '',
    businessCountry: '',
    businessPostalCode: '',
    taxId: '',
    regions: [],
    capacityMin: '',
    capacityMax: '',
    cities: [],
    styleTags: [],
    priceRange: '',
    logoUrl: '',
    coverImageUrl: '',
    galleryUrls: [],
    instagramHandle: '',
    tiktokHandle: '',
    facebookUrl: '',
    linkedinUrl: '',
    amenities: [],
    sustainabilityCertifications: [],
    qualityCertifications: [],
    acceptedTerms: false,
    acceptedPrivacy: false,
    acceptedVendor: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cityInput, setCityInput] = useState('');

  const totalSteps = 5;
  const stepLabels = ['Your Brand', 'Details & Location', 'Media & Features', 'Documents & Legal', 'Verification'];

  const validateEmail = (email: string) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  const validatePhone = (phone: string) => /^\+?[1-9]\d{1,14}$/.test(phone);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 1:
        if (!formData.primaryContactName.trim()) newErrors.primaryContactName = 'Contact name is required';
        if (!formData.primaryContactEmail.trim()) newErrors.primaryContactEmail = 'Email is required';
        else if (!validateEmail(formData.primaryContactEmail)) newErrors.primaryContactEmail = 'Invalid email format';
        if (!formData.primaryContactPhone.trim()) newErrors.primaryContactPhone = 'Phone is required';
        else if (!validatePhone(formData.primaryContactPhone)) newErrors.primaryContactPhone = 'Use international format (+1234567890)';
        if (!formData.brandName.trim()) newErrors.brandName = 'Brand name is required';
        if (!formData.brandType) newErrors.brandType = 'Brand type is required';
        if (!formData.bio.trim()) newErrors.bio = 'Brand bio is required';
        else if (formData.bio.length < 100) newErrors.bio = 'Bio must be at least 100 characters';
        break;
      case 2:
        if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Address is required';
        if (!formData.businessCountry.trim()) newErrors.businessCountry = 'Country is required';
        if (formData.regions.length === 0) newErrors.regions = 'Select at least one region';
        if (formData.styleTags.length === 0) newErrors.styleTags = 'Select at least one style tag';
        if (!formData.priceRange) newErrors.priceRange = 'Select a price range';
        break;
      case 3:
        // Media is encouraged but not strictly required for streamlined flow
        break;
      case 4:
        if (!formData.acceptedTerms) newErrors.acceptedTerms = 'Required';
        if (!formData.acceptedPrivacy) newErrors.acceptedPrivacy = 'Required';
        if (!formData.acceptedVendor) newErrors.acceptedVendor = 'Required';
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'cover' | 'gallery') => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be < 5MB'); return; }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { toast.error('Image must be JPEG, PNG, or WebP'); return; }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brand-media/${imageType}/${fileName}`;
      const { error } = await supabase.storage.from('brand-collections').upload(filePath, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('brand-collections').getPublicUrl(filePath);
      if (imageType === 'logo') setFormData(prev => ({ ...prev, logoUrl: urlData.publicUrl }));
      else if (imageType === 'cover') setFormData(prev => ({ ...prev, coverImageUrl: urlData.publicUrl }));
      else setFormData(prev => ({ ...prev, galleryUrls: [...prev.galleryUrls, urlData.publicUrl] }));
      toast.success(`${imageType} uploaded`);
    } catch (error) { console.error(error); toast.error('Upload failed'); }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error('File must be < 50MB'); return; }
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brand-documents/${fileName}`;
      const { error } = await supabase.storage.from('application-documents').upload(filePath, file);
      if (error) throw error;
      // Bucket is private — store a long-lived signed URL (1 year)
      const { data: urlData, error: signError } = await supabase.storage
        .from('application-documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signError || !urlData) throw signError ?? new Error('Failed to sign URL');
      setUploadedDocuments(prev => [...prev, { type: documentType, url: urlData.signedUrl, uploadedAt: new Date().toISOString(), fileName: file.name, fileSize: file.size }]);
      toast.success(`${documentType} uploaded`);
    } catch (error) { console.error(error); toast.error('Upload failed'); }
  };

  const formatCityLabel = (value: string) =>
    value
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');

  const addCity = () => {
    const formattedCity = formatCityLabel(cityInput);

    if (
      formattedCity &&
      !formData.cities.some((city) => city.toLowerCase() === formattedCity.toLowerCase())
    ) {
      setFormData(prev => ({ ...prev, cities: [...prev.cities, formattedCity] }));
      setCityInput('');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    setIsSubmitting(true);
    try {
      // Create Stripe Identity session
      const { data: sessionData, error: sessionError } = await supabase.functions.invoke('create-identity-verification', {
        body: {
          email: formData.primaryContactEmail,
          firstName: formData.primaryContactName.split(' ')[0],
          lastName: formData.primaryContactName.split(' ').slice(1).join(' ') || formData.primaryContactName,
          applicationType: 'brand',
          returnUrl: `${window.location.origin}/application/verification-complete?type=brand`
        }
      });
      if (sessionError) throw sessionError;
      const { sessionId, url } = sessionData;

      const appId = crypto.randomUUID();
      const applicationData = {
        id: appId,
        status: 'pending_verification',
        primary_contact_name: formData.primaryContactName,
        primary_contact_email: formData.primaryContactEmail,
        primary_contact_phone: formData.primaryContactPhone,
        brand_name: formData.brandName,
        brand_type: formData.brandType,
        bio: formData.bio,
        website: formData.website,
        business_address: formData.businessAddress,
        business_city: formData.businessCity,
        business_state: formData.businessState,
        business_country: formData.businessCountry,
        business_postal_code: formData.businessPostalCode,
        tax_id: formData.taxId,
        regions: formData.regions,
        capacity_min: formData.capacityMin ? parseInt(formData.capacityMin) : null,
        capacity_max: formData.capacityMax ? parseInt(formData.capacityMax) : null,
        cities: formData.cities,
        style_tags: formData.styleTags,
        price_range: formData.priceRange,
        logo_url: formData.logoUrl,
        cover_image_url: formData.coverImageUrl,
        gallery_urls: formData.galleryUrls,
        instagram_handle: formData.instagramHandle,
        tiktok_handle: formData.tiktokHandle,
        facebook_url: formData.facebookUrl,
        linkedin_url: formData.linkedinUrl,
        amenities: formData.amenities,
        sustainability_certifications: formData.sustainabilityCertifications,
        quality_certifications: formData.qualityCertifications,
        documents: uploadedDocuments,
        stripe_verification_session_id: sessionId,
        stripe_verification_status: 'pending',
        submitted_at: new Date().toISOString()
      };

      const { error: dbError } = await supabase.from('brand_applications').insert(applicationData as any);
      if (dbError) throw dbError;

      setApplicationId(appId);
      localStorage.setItem('brand_application_id', appId);
      localStorage.setItem('brand_application_email', formData.primaryContactEmail);

      // Send confirmation email via the unified transactional email system so
      // brand applicants receive the same acknowledgement agents do.
      supabase.functions
        .invoke('send-transactional-email', {
          body: {
            templateName: 'application-received-professional',
            recipientEmail: formData.primaryContactEmail,
            idempotencyKey: `brand-application-received-${appId}`,
            templateData: { agentName: formData.primaryContactName },
          },
        })
        .catch((e) => console.error('application email failed:', e));

      setVerificationStatus('success');
      toast.success('Application submitted! Redirecting to verification...');
      setTimeout(() => { window.location.href = url; }, 2000);
    } catch (error: any) {
      console.error('Submission error:', error);
      setVerificationStatus('failed');
      toast.error(error.message || 'Failed to submit application');
      setIsSubmitting(false);
    }
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-1 h-6 bg-[#C7A962] rounded-full" />
      <h3 className="font-secondary text-xl text-[#0a2225]">{title}</h3>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: // Your Brand (Contact + Brand Info merged)
        return (
          <div className="space-y-6">
            <SectionHeader title="Your Brand" />
            <Alert className="bg-[#F5EFE1] border-[#E5DFC6]">
              <AlertDescription className="text-[#0a2225]">
                Tell us about yourself and your brand.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="font-medium text-[#0a2225]">Full Name *</Label>
                <Input value={formData.primaryContactName} onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })} className={`${luxuryInputClasses} ${errors.primaryContactName ? 'border-red-500' : ''}`} placeholder="John Smith" />
                {errors.primaryContactName && <p className="text-sm text-red-500 mt-1">{errors.primaryContactName}</p>}
              </div>
              <div>
                <Label className="font-medium text-[#0a2225]">Email *</Label>
                <Input type="email" value={formData.primaryContactEmail} onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })} className={`${luxuryInputClasses} ${errors.primaryContactEmail ? 'border-red-500' : ''}`} placeholder="john@brand.com" />
                {errors.primaryContactEmail && <p className="text-sm text-red-500 mt-1">{errors.primaryContactEmail}</p>}
              </div>
              <div>
                <Label className="font-medium text-[#0a2225]">Phone *</Label>
                <Input type="tel" value={formData.primaryContactPhone} onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })} className={`${luxuryInputClasses} ${errors.primaryContactPhone ? 'border-red-500' : ''}`} placeholder="+1234567890" />
                {errors.primaryContactPhone && <p className="text-sm text-red-500 mt-1">{errors.primaryContactPhone}</p>}
              </div>
              <div>
                <Label className="font-medium text-[#0a2225]">Website</Label>
                <Input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className={luxuryInputClasses} placeholder="https://www.yourbrand.com" />
              </div>
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Brand Name *</Label>
              <Input value={formData.brandName} onChange={(e) => setFormData({ ...formData, brandName: e.target.value })} className={`${luxuryInputClasses} ${errors.brandName ? 'border-red-500' : ''}`} placeholder="Your Brand Name" />
              {errors.brandName && <p className="text-sm text-red-500 mt-1">{errors.brandName}</p>}
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Brand Type *</Label>
              <Select value={formData.brandType} onValueChange={(value) => setFormData({ ...formData, brandType: value })}>
                <SelectTrigger className={`${luxurySelectTriggerClasses} ${errors.brandType ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select brand type" />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandType && <p className="text-sm text-red-500 mt-1">{errors.brandType}</p>}
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Brand Bio * (Min 100 characters)</Label>
              <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className={`${luxuryInputClasses} min-h-[120px] ${errors.bio ? 'border-red-500' : ''}`} rows={4} placeholder="Describe your brand, what makes it unique..." />
              <p className="text-sm text-[#6B7280] mt-1">{formData.bio.length} characters</p>
              {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio}</p>}
            </div>
          </div>
        );

      case 2: // Details & Location (Business Details + Geographic/Style merged)
        return (
          <div className="space-y-6">
            <SectionHeader title="Details & Location" />

            <div>
              <Label className="font-medium text-[#0a2225]">Business Address *</Label>
              <Input value={formData.businessAddress} onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })} className={`${luxuryInputClasses} ${errors.businessAddress ? 'border-red-500' : ''}`} placeholder="123 Main Street" />
              {errors.businessAddress && <p className="text-sm text-red-500 mt-1">{errors.businessAddress}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="font-medium text-[#0a2225]">City</Label>
                <Input value={formData.businessCity} onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="font-medium text-[#0a2225]">State/Province</Label>
                <Input value={formData.businessState} onChange={(e) => setFormData({ ...formData, businessState: e.target.value })} className={luxuryInputClasses} />
              </div>
              <div>
                <Label className="font-medium text-[#0a2225]">Country *</Label>
                <Input value={formData.businessCountry} onChange={(e) => setFormData({ ...formData, businessCountry: e.target.value })} className={`${luxuryInputClasses} ${errors.businessCountry ? 'border-red-500' : ''}`} placeholder="United States" />
                {errors.businessCountry && <p className="text-sm text-red-500 mt-1">{errors.businessCountry}</p>}
              </div>
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Tax ID / EIN</Label>
              <Input value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className={luxuryInputClasses} placeholder="XX-XXXXXXX" />
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Regions * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {REGIONS.map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={formData.regions.includes(region)}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        regions: checked ? [...prev.regions, region] : prev.regions.filter(r => r !== region)
                      }))}
                      className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                    />
                    <label htmlFor={`region-${region}`} className="text-sm cursor-pointer text-[#0a2225]">{region}</label>
                  </div>
                ))}
              </div>
              {errors.regions && <p className="text-sm text-red-500 mt-1">{errors.regions}</p>}
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Cities/Locations</Label>
              <div className="mt-2 space-y-2">
                <div className="flex flex-col gap-2 md:flex-row">
                  <div
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCity();
                      }
                    }}
                  >
                    <GoogleCityAutocomplete
                      value={cityInput}
                      onChange={setCityInput}
                      placeholder="Add one city or location"
                      inputClassName={luxuryInputClasses}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addCity}
                    variant="outline"
                    className="min-w-[120px] border-[#E5DFC6] px-5 text-[#0a2225] hover:bg-[#E5DFC6]/20"
                  >
                    Add city
                  </Button>
                </div>
                <p id="brand-city-help" className="text-sm text-[#7A7151]">
                  Press Enter after each city or click Add city.
                </p>
              </div>
              {formData.cities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.cities.map((city) => (
                    <div
                      key={city}
                      className="inline-flex items-center gap-2 rounded-md border border-[#E5DFC6] bg-[#F8F4EA] px-3.5 py-2 text-sm text-[#0a2225]"
                    >
                      <span className="font-medium leading-none">{city}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, cities: prev.cities.filter(c => c !== city) }))}
                        className="text-[#7A7151] transition-colors hover:text-[#0a2225]"
                        aria-label={`Remove ${city}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Style Tags * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {STYLE_TAGS.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${tag}`}
                      checked={formData.styleTags.includes(tag)}
                      onCheckedChange={(checked) => setFormData(prev => ({
                        ...prev,
                        styleTags: checked ? [...prev.styleTags, tag] : prev.styleTags.filter(t => t !== tag)
                      }))}
                      className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                    />
                    <label htmlFor={`style-${tag}`} className="text-sm cursor-pointer text-[#0a2225]">{tag}</label>
                  </div>
                ))}
              </div>
              {errors.styleTags && <p className="text-sm text-red-500 mt-1">{errors.styleTags}</p>}
            </div>

            <div>
              <Label className="font-medium text-[#0a2225]">Price Range *</Label>
              <Select value={formData.priceRange} onValueChange={(value) => setFormData({ ...formData, priceRange: value })}>
                <SelectTrigger className={`${luxurySelectTriggerClasses} ${errors.priceRange ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priceRange && <p className="text-sm text-red-500 mt-1">{errors.priceRange}</p>}
            </div>
          </div>
        );

      case 3: // Media & Features (Media + Amenities + Certifications + Social merged)
        return (
          <div className="space-y-6">
            <SectionHeader title="Media & Features" />

            {/* Logo */}
            <div>
              <Label className="font-medium text-[#0a2225]">Brand Logo (Square format)</Label>
              <div className="mt-2">
                {formData.logoUrl ? (
                  <div className="relative w-32 h-32 border border-[#E5DFC6] rounded-xl overflow-hidden">
                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" loading="lazy"/>
                    <button type="button" onClick={() => setFormData({ ...formData, logoUrl: '' })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-[#E5DFC6] rounded-xl cursor-pointer hover:bg-[#F5EFE1]/50 transition-colors">
                    <div className="text-center"><Upload className="mx-auto h-8 w-8 text-[#C7A962]" /><p className="mt-1 text-sm text-[#6B7280]">Upload logo</p></div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={(e) => handleImageUpload(e, 'logo')} />
                  </label>
                )}
              </div>
            </div>

            {/* Cover */}
            <div>
              <Label className="font-medium text-[#0a2225]">Cover Image (16:9)</Label>
              <div className="mt-2">
                {formData.coverImageUrl ? (
                  <div className="relative w-full h-48 border border-[#E5DFC6] rounded-xl overflow-hidden">
                    <img src={formData.coverImageUrl} alt="Cover" className="w-full h-full object-cover" loading="lazy"/>
                    <button type="button" onClick={() => setFormData({ ...formData, coverImageUrl: '' })} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-[#E5DFC6] rounded-xl cursor-pointer hover:bg-[#F5EFE1]/50 transition-colors">
                    <div className="text-center"><Upload className="mx-auto h-8 w-8 text-[#C7A962]" /><p className="mt-1 text-sm text-[#6B7280]">Upload cover image</p></div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={(e) => handleImageUpload(e, 'cover')} />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery */}
            <div>
              <Label className="font-medium text-[#0a2225]">Gallery Images (Up to 12)</Label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                {formData.galleryUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border border-[#E5DFC6] rounded-xl overflow-hidden">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" loading="lazy"/>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, galleryUrls: prev.galleryUrls.filter((_, i) => i !== index) }))} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {formData.galleryUrls.length < 12 && (
                  <label className="flex items-center justify-center aspect-square border-2 border-dashed border-[#E5DFC6] rounded-xl cursor-pointer hover:bg-[#F5EFE1]/50 transition-colors">
                    <div className="text-center"><Upload className="mx-auto h-6 w-6 text-[#C7A962]" /><p className="mt-1 text-xs text-[#6B7280]">Add</p></div>
                    <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg,image/webp" onChange={(e) => handleImageUpload(e, 'gallery')} />
                  </label>
                )}
              </div>
              <p className="text-sm text-[#6B7280] mt-2">{formData.galleryUrls.length}/12 images</p>
            </div>

            {/* Social Media */}
            <div>
              <Label className="font-medium text-[#0a2225]">Social Media</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-sm text-[#6B7280]">Instagram</Label>
                  <Input value={formData.instagramHandle} onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })} className={luxuryInputClasses} placeholder="@yourbrand" />
                </div>
                <div>
                  <Label className="text-sm text-[#6B7280]">TikTok</Label>
                  <Input value={formData.tiktokHandle} onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })} className={luxuryInputClasses} placeholder="@yourbrand" />
                </div>
                <div>
                  <Label className="text-sm text-[#6B7280]">Facebook</Label>
                  <Input value={formData.facebookUrl} onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })} className={luxuryInputClasses} placeholder="https://facebook.com/yourbrand" />
                </div>
                <div>
                  <Label className="text-sm text-[#6B7280]">LinkedIn</Label>
                  <Input value={formData.linkedinUrl} onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })} className={luxuryInputClasses} placeholder="https://linkedin.com/company/yourbrand" />
                </div>
              </div>
            </div>

            {/* Tour operations (conditional for tour operators) */}
            {formData.brandType === 'Tour Operator' && (
              <div className="border-t border-[#E5DFC6] pt-6">
                <Label className="font-medium text-[#0a2225]">Tour operations</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="capacityMin" className="text-sm text-[#4a4a4a]">Typical group size — minimum</Label>
                    <Input
                      id="capacityMin"
                      type="number"
                      min={1}
                      value={formData.capacityMin}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacityMin: e.target.value }))}
                      placeholder="e.g. 2"
                      className="mt-1 border-[#E5DFC6]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacityMax" className="text-sm text-[#4a4a4a]">Typical group size — maximum</Label>
                    <Input
                      id="capacityMax"
                      type="number"
                      min={1}
                      value={formData.capacityMax}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacityMax: e.target.value }))}
                      placeholder="e.g. 12"
                      className="mt-1 border-[#E5DFC6]"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-[#9CA3AF]">
                  Licenses and insurance documents can be attached in the documents step — approved
                  operators can publish bookable tours directly to the marketplace.
                </p>
              </div>
            )}

            {/* Amenities (conditional for accommodations) */}
            {['Hotel', 'Resort', 'Villa / Home', 'Boutique Stay'].includes(formData.brandType) && (
              <div className="border-t border-[#E5DFC6] pt-6">
                <Label className="font-medium text-[#0a2225]">Amenities</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {AMENITIES.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter(a => a !== amenity)
                        }))}
                        className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer text-[#0a2225]">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            <div className="border-t border-[#E5DFC6] pt-6">
              <h4 className="font-secondary text-lg text-[#0a2225] mb-4">Certifications</h4>
              <div>
                <Label className="font-medium text-[#0a2225]">Sustainability</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {SUSTAINABILITY_CERTS.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sustain-${cert}`}
                        checked={formData.sustainabilityCertifications.includes(cert)}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          sustainabilityCertifications: checked ? [...prev.sustainabilityCertifications, cert] : prev.sustainabilityCertifications.filter(c => c !== cert)
                        }))}
                        className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                      />
                      <label htmlFor={`sustain-${cert}`} className="text-sm cursor-pointer text-[#0a2225]">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <Label className="font-medium text-[#0a2225]">Quality & Memberships</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {QUALITY_CERTS.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`quality-${cert}`}
                        checked={formData.qualityCertifications.includes(cert)}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          qualityCertifications: checked ? [...prev.qualityCertifications, cert] : prev.qualityCertifications.filter(c => c !== cert)
                        }))}
                        className="data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47]"
                      />
                      <label htmlFor={`quality-${cert}`} className="text-sm cursor-pointer text-[#0a2225]">{cert}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Documents & Legal
        return (
          <div className="space-y-6">
            <SectionHeader title="Documents & Legal" />

            {/* Document Uploads */}
            <div className="space-y-4">
              {[
                { type: 'Business License', label: 'Business License / Registration' },
                { type: 'Tax Documents', label: 'Tax Documents (Optional)' },
                { type: 'Certifications', label: 'Certifications (Optional)' },
              ].map(({ type, label }) => (
                <div key={type}>
                  <Label className="font-medium text-[#0a2225]">{label}</Label>
                  <label className="mt-2 flex items-center justify-center w-full px-4 py-5 border-2 border-dashed border-[#E5DFC6] rounded-xl cursor-pointer hover:bg-[#F5EFE1]/50 transition-colors">
                    <div className="text-center"><Upload className="mx-auto h-8 w-8 text-[#C7A962]" /><p className="mt-1 text-sm text-[#6B7280]">Click to upload</p></div>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleDocumentUpload(e, type)} />
                  </label>
                </div>
              ))}
            </div>

            {uploadedDocuments.length > 0 && (
              <div className="border border-[#E5DFC6] rounded-xl p-4">
                <h4 className="font-secondary text-lg text-[#0a2225] mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F5EFE1] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-[#C7A962]" />
                        <div>
                          <p className="text-sm font-medium text-[#0a2225]">{doc.type}</p>
                          <p className="text-xs text-[#6B7280]">{doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setUploadedDocuments(prev => prev.filter((_, i) => i !== index))} className="text-[#0a2225] hover:bg-[#E5DFC6]/50">Remove</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Legal */}
            <div className="border-t border-[#E5DFC6] pt-6 space-y-4">
              <h4 className="font-medium text-[#0a2225]">Legal Agreements</h4>
              {[
                { key: 'acceptedTerms' as const, label: 'Terms of Service', link: '/terms' },
                { key: 'acceptedPrivacy' as const, label: 'Privacy Policy', link: '/privacy' },
                { key: 'acceptedVendor' as const, label: 'Brand Partnership Agreement', link: '/vendor-agreement' },
              ].map(({ key, label, link }) => (
                <div key={key} className="flex items-start space-x-3">
                  <Checkbox
                    checked={formData[key]}
                    onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked as boolean })}
                    className={`data-[state=checked]:bg-[#0c4d47] data-[state=checked]:border-[#0c4d47] mt-0.5 ${errors[key] ? 'border-red-500' : ''}`}
                  />
                  <label className="text-sm text-[#0a2225]">
                    I accept the <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(link, '_blank', 'noopener,noreferrer');
                      }}
                      className="text-[#C7A962] hover:underline"
                    >{label}</a> *
                  </label>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-[#F5EFE1] border border-[#E5DFC6] rounded-xl p-4 space-y-2 text-sm">
              <h4 className="font-secondary text-lg text-[#0a2225] mb-2">Summary</h4>
              <div className="flex justify-between"><span className="text-[#6B7280]">Brand:</span><span className="font-medium text-[#0a2225]">{formData.brandName}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Type:</span><span className="font-medium text-[#0a2225]">{formData.brandType}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Email:</span><span className="font-medium text-[#0a2225]">{formData.primaryContactEmail}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Regions:</span><span className="font-medium text-[#0a2225]">{formData.regions.length}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Documents:</span><span className="font-medium text-[#0a2225]">{uploadedDocuments.length}</span></div>
            </div>
          </div>
        );

      case 5: // Identity Verification
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDF9F0] border border-[#C7A962]/30">
                <Shield className="h-10 w-10 text-[#C7A962]" />
              </div>
              <h3 className="mb-3 font-secondary text-2xl text-[#0a2225]">Identity Verification</h3>
              <p className="text-base text-[#6B7280] max-w-md mx-auto">
                Complete identity verification to submit your brand application. This typically takes 2-3 minutes.
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

            <Alert className="bg-[#F5EFE1] border-[#E5DFC6]">
              <AlertDescription className="text-[#0a2225]">
                After verification, our team will review your application within 2-3 business days.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF9F0] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="mb-4 font-secondary text-[26px] md:text-[31px] lg:text-[36px] text-[#0a2225]">
            Become a <em>Goldsainte</em> Tour Operator
          </h1>
          <p className="text-base text-[#6B7280] max-w-2xl mx-auto leading-relaxed">
            List your tours in the Goldsainte marketplace and reach travelers worldwide.
            Hotels, experience brands, and other partners are welcome to apply here too.
          </p>

          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex gap-1.5">
              {[...Array(totalSteps)].map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i + 1 <= currentStep ? 'bg-[#C7A962]' : 'bg-[#E5DFC6]'}`} />
              ))}
            </div>
            <span className="text-xs text-[#6B7280] ml-3">Step {currentStep} of {totalSteps}</span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {stepLabels.map((label, index) => (
              <div
                key={label}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  index + 1 < currentStep ? 'bg-[#0c4d47] text-[#E5DFC6]'
                    : index + 1 === currentStep ? 'bg-[#C7A962] text-white'
                    : 'bg-[#E5DFC6] text-[#6B7280]'
                }`}
              >
                {index + 1 < currentStep && <CheckCircle className="h-3 w-3 inline mr-1" />}
                {label}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-white border border-[#E5DFC6] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <CardContent className="p-6 md:p-8">
            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t border-[#E5DFC6]">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
                className="border-[#E5DFC6] text-[#0a2225] hover:bg-[#E5DFC6]/20 rounded-full px-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {currentStep < 4 ? (
                <Button onClick={handleNext} disabled={isSubmitting} className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : currentStep === 4 ? (
                <Button
                  onClick={() => { if (validateStep(4)) setCurrentStep(5); }}
                  disabled={isSubmitting || !formData.acceptedTerms || !formData.acceptedPrivacy || !formData.acceptedVendor}
                  className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8"
                >
                  Continue to Verification <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || verificationStatus === 'success'}
                  className="bg-[#0c4d47] hover:bg-[#073331] text-[#E5DFC6] rounded-full px-8 min-w-[150px]"
                >
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                    : verificationStatus === 'success' ? <><CheckCircle className="mr-2 h-4 w-4" />Redirecting...</>
                    : <><Shield className="mr-2 h-4 w-4" />Submit & Verify Identity</>}
                </Button>
              )}
            </div>

            {verificationStatus === 'failed' && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>Failed to submit. Please try again or contact support.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
