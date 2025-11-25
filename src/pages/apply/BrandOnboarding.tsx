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
  // Contact Information
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  primaryContactTitle: string;
  
  // Brand Information
  brandName: string;
  brandType: string;
  brandCategory: string;
  tagline: string;
  bio: string;
  brandStory: string;
  
  // Business Details
  businessRegistrationNumber: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  
  // Brand Identity
  website: string;
  
  // Geographic & Style
  regions: string[];
  cities: string[];
  styleTags: string[];
  
  // Pricing & Capacity
  priceRange: string;
  capacityMin: string;
  capacityMax: string;
  
  // Social Media
  instagramHandle: string;
  tiktokHandle: string;
  facebookUrl: string;
  linkedinUrl: string;
  
  // Media Assets (URLs after upload)
  logoUrl: string;
  coverImageUrl: string;
  galleryUrls: string[];
  videoUrls: string[];
  
  // Amenities (for accommodations)
  amenities: string[];
  
  // Certifications
  sustainabilityCertifications: string[];
  qualityCertifications: string[];
  
  // Financial
  taxId: string;
  vatNumber: string;
  
  // Legal
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
  { value: 'Hotel', label: 'Hotel' },
  { value: 'Resort', label: 'Resort' },
  { value: 'Villa / Home', label: 'Villa / Vacation Home' },
  { value: 'Boutique Stay', label: 'Boutique Stay' },
  { value: 'Restaurant / Bar', label: 'Restaurant / Bar' },
  { value: 'Experience Brand', label: 'Experience Brand' },
  { value: 'Retail / Design Brand', label: 'Retail / Design Brand' },
  { value: 'Tour Operator', label: 'Tour Operator' },
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
  'LEED Certified',
  'Green Key',
  'EarthCheck',
  'Green Globe',
  'Travelife',
  'B Corp Certified',
  'Fair Trade Certified',
  'Rainforest Alliance',
  'Carbon Neutral',
  'Zero Waste'
];

const QUALITY_CERTS = [
  'Forbes Travel Guide',
  'AAA Five Diamond',
  'Michelin Stars',
  "World's 50 Best",
  'Relais & Châteaux',
  'Leading Hotels of the World',
  'Preferred Hotels & Resorts',
  'Small Luxury Hotels',
  'Design Hotels'
];

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
    acceptedVendor: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation Functions
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Contact Information
        if (!formData.primaryContactName.trim()) {
          newErrors.primaryContactName = 'Contact name is required';
        }
        if (!formData.primaryContactEmail.trim()) {
          newErrors.primaryContactEmail = 'Contact email is required';
        } else if (!validateEmail(formData.primaryContactEmail)) {
          newErrors.primaryContactEmail = 'Invalid email format';
        }
        if (!formData.primaryContactPhone.trim()) {
          newErrors.primaryContactPhone = 'Contact phone is required';
        } else if (!validatePhone(formData.primaryContactPhone)) {
          newErrors.primaryContactPhone = 'Invalid phone format (use international format: +1234567890)';
        }
        break;

      case 2: // Brand Information
        if (!formData.brandName.trim()) {
          newErrors.brandName = 'Brand name is required';
        }
        if (!formData.brandType) {
          newErrors.brandType = 'Brand type is required';
        }
        if (!formData.bio.trim()) {
          newErrors.bio = 'Brand bio is required';
        } else if (formData.bio.length < 100) {
          newErrors.bio = 'Bio must be at least 100 characters';
        }
        if (formData.website && !validateUrl(formData.website)) {
          newErrors.website = 'Website must start with http:// or https://';
        }
        break;

      case 3: // Business Details
        if (!formData.businessAddress.trim()) {
          newErrors.businessAddress = 'Business address is required';
        }
        if (!formData.businessCountry.trim()) {
          newErrors.businessCountry = 'Country is required';
        }
        break;

      case 4: // Geographic & Style
        if (formData.regions.length === 0) {
          newErrors.regions = 'Select at least one region';
        }
        if (formData.cities.length === 0) {
          newErrors.cities = 'Enter at least one city';
        }
        if (formData.styleTags.length === 0) {
          newErrors.styleTags = 'Select at least one style tag';
        }
        if (!formData.priceRange) {
          newErrors.priceRange = 'Select a price range';
        }
        break;

      case 5: // Media Assets
        if (!formData.logoUrl) {
          newErrors.logoUrl = 'Brand logo is required';
        }
        if (!formData.coverImageUrl) {
          newErrors.coverImageUrl = 'Cover image is required';
        }
        if (formData.galleryUrls.length < 3) {
          newErrors.galleryUrls = 'Upload at least 3 gallery images';
        }
        break;

      case 6: // Amenities (for accommodations only)
        if (['Hotel', 'Resort', 'Villa / Home', 'Boutique Stay'].includes(formData.brandType)) {
          if (formData.amenities.length === 0) {
            newErrors.amenities = 'Select at least one amenity';
          }
        }
        break;

      case 7: // Documents
        if (uploadedDocuments.length === 0) {
          newErrors.documents = 'Upload at least one document (business registration or license)';
        }
        break;

      case 8: // Legal Terms
        if (!formData.acceptedTerms) {
          newErrors.acceptedTerms = 'You must accept the Terms of Service';
        }
        if (!formData.acceptedPrivacy) {
          newErrors.acceptedPrivacy = 'You must accept the Privacy Policy';
        }
        if (!formData.acceptedVendor) {
          newErrors.acceptedVendor = 'You must accept the Vendor Agreement';
        }
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

  // Image Upload Handler
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: 'logo' | 'cover' | 'gallery'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB for images)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate file type
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

      if (imageType === 'logo') {
        setFormData({ ...formData, logoUrl: urlData.publicUrl });
      } else if (imageType === 'cover') {
        setFormData({ ...formData, coverImageUrl: urlData.publicUrl });
      } else if (imageType === 'gallery') {
        setFormData({
          ...formData,
          galleryUrls: [...formData.galleryUrls, urlData.publicUrl]
        });
      }

      toast.success(`${imageType} image uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      galleryUrls: formData.galleryUrls.filter((_, i) => i !== index)
    });
  };

  // Document Upload Handler
  const handleDocumentUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    documentType: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be PDF, JPEG, or PNG');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `brand-documents/${fileName}`;

      const { data, error } = await supabase.storage
        .from('applications')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('applications')
        .getPublicUrl(filePath);

      const newDocument: UploadedDocument = {
        type: documentType,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size
      };

      setUploadedDocuments(prev => [...prev, newDocument]);
      toast.success(`${documentType} uploaded successfully`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    toast.success('Document removed');
  };

  // Add city to list
  const [cityInput, setCityInput] = useState('');
  const addCity = () => {
    if (cityInput.trim() && !formData.cities.includes(cityInput.trim())) {
      setFormData({
        ...formData,
        cities: [...formData.cities, cityInput.trim()]
      });
      setCityInput('');
    }
  };

  const removeCity = (city: string) => {
    setFormData({
      ...formData,
      cities: formData.cities.filter(c => c !== city)
    });
  };

  // Submit Application
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
        capacity_min: parseInt(formData.capacityMin) || null,
        capacity_max: parseInt(formData.capacityMax) || null,
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

  // Render form steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Tell us about the primary contact person for your brand on Goldsainte.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="primaryContactName">Full Name *</Label>
              <Input
                id="primaryContactName"
                value={formData.primaryContactName}
                onChange={(e) => setFormData({ ...formData, primaryContactName: e.target.value })}
                className={errors.primaryContactName ? 'border-red-500' : ''}
                placeholder="John Smith"
              />
              {errors.primaryContactName && (
                <p className="text-sm text-red-500 mt-1">{errors.primaryContactName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="primaryContactEmail">Email Address *</Label>
              <Input
                id="primaryContactEmail"
                type="email"
                value={formData.primaryContactEmail}
                onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                className={errors.primaryContactEmail ? 'border-red-500' : ''}
                placeholder="john@yourbrand.com"
              />
              {errors.primaryContactEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.primaryContactEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="primaryContactPhone">Phone Number *</Label>
              <Input
                id="primaryContactPhone"
                type="tel"
                value={formData.primaryContactPhone}
                onChange={(e) => setFormData({ ...formData, primaryContactPhone: e.target.value })}
                className={errors.primaryContactPhone ? 'border-red-500' : ''}
                placeholder="+1234567890"
              />
              <p className="text-sm text-gray-500 mt-1">Use international format (e.g., +1234567890)</p>
              {errors.primaryContactPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.primaryContactPhone}</p>
              )}
            </div>

            <div>
              <Label htmlFor="primaryContactTitle">Title / Position</Label>
              <Input
                id="primaryContactTitle"
                value={formData.primaryContactTitle}
                onChange={(e) => setFormData({ ...formData, primaryContactTitle: e.target.value })}
                placeholder="General Manager, Marketing Director, etc."
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input
                id="brandName"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className={errors.brandName ? 'border-red-500' : ''}
                placeholder="Your Brand Name"
              />
              {errors.brandName && <p className="text-sm text-red-500 mt-1">{errors.brandName}</p>}
            </div>

            <div>
              <Label htmlFor="brandType">Brand Type *</Label>
              <Select
                value={formData.brandType}
                onValueChange={(value) => setFormData({ ...formData, brandType: value })}
              >
                <SelectTrigger className={errors.brandType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select brand type" />
                </SelectTrigger>
                <SelectContent>
                  {BRAND_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brandType && <p className="text-sm text-red-500 mt-1">{errors.brandType}</p>}
            </div>

            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="A short, memorable phrase describing your brand"
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">{formData.tagline.length}/100 characters</p>
            </div>

            <div>
              <Label htmlFor="bio">Brand Bio * (Minimum 100 characters)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className={errors.bio ? 'border-red-500' : ''}
                rows={4}
                placeholder="Describe your brand, what makes it unique, and what guests can expect..."
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length} characters</p>
              {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio}</p>}
            </div>

            <div>
              <Label htmlFor="brandStory">Brand Story (Optional)</Label>
              <Textarea
                id="brandStory"
                value={formData.brandStory}
                onChange={(e) => setFormData({ ...formData, brandStory: e.target.value })}
                rows={6}
                placeholder="Tell the story behind your brand - your inspiration, journey, and vision..."
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className={errors.website ? 'border-red-500' : ''}
                placeholder="https://www.yourbrand.com"
              />
              {errors.website && <p className="text-sm text-red-500 mt-1">{errors.website}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="businessRegistrationNumber">Business Registration Number</Label>
              <Input
                id="businessRegistrationNumber"
                value={formData.businessRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, businessRegistrationNumber: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                className={errors.businessAddress ? 'border-red-500' : ''}
                placeholder="123 Main Street"
              />
              {errors.businessAddress && (
                <p className="text-sm text-red-500 mt-1">{errors.businessAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="businessCity">City</Label>
                <Input
                  id="businessCity"
                  value={formData.businessCity}
                  onChange={(e) => setFormData({ ...formData, businessCity: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="businessState">State/Province</Label>
                <Input
                  id="businessState"
                  value={formData.businessState}
                  onChange={(e) => setFormData({ ...formData, businessState: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="businessPostalCode">Postal Code</Label>
                <Input
                  id="businessPostalCode"
                  value={formData.businessPostalCode}
                  onChange={(e) => setFormData({ ...formData, businessPostalCode: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessCountry">Country *</Label>
              <Input
                id="businessCountry"
                value={formData.businessCountry}
                onChange={(e) => setFormData({ ...formData, businessCountry: e.target.value })}
                className={errors.businessCountry ? 'border-red-500' : ''}
                placeholder="United States"
              />
              {errors.businessCountry && (
                <p className="text-sm text-red-500 mt-1">{errors.businessCountry}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                <Input
                  id="taxId"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="vatNumber">VAT Registration Number (EU)</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label>Regions * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {REGIONS.map((region) => (
                  <div key={region} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region}`}
                      checked={formData.regions.includes(region)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, regions: [...formData.regions, region] });
                        } else {
                          setFormData({
                            ...formData,
                            regions: formData.regions.filter(r => r !== region)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`region-${region}`} className="text-sm cursor-pointer">
                      {region}
                    </label>
                  </div>
                ))}
              </div>
              {errors.regions && <p className="text-sm text-red-500 mt-1">{errors.regions}</p>}
            </div>

            <div>
              <Label>Cities/Locations * (Where your brand operates)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCity())}
                  placeholder="Enter a city and press Enter"
                />
                <Button type="button" onClick={addCity} variant="outline">
                  Add
                </Button>
              </div>
              
              {formData.cities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.cities.map((city) => (
                    <div
                      key={city}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {city}
                      <button
                        type="button"
                        onClick={() => removeCity(city)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.cities && <p className="text-sm text-red-500 mt-1">{errors.cities}</p>}
            </div>

            <div>
              <Label>Style Tags * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {STYLE_TAGS.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`style-${tag}`}
                      checked={formData.styleTags.includes(tag)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, styleTags: [...formData.styleTags, tag] });
                        } else {
                          setFormData({
                            ...formData,
                            styleTags: formData.styleTags.filter(t => t !== tag)
                          });
                        }
                      }}
                    />
                    <label htmlFor={`style-${tag}`} className="text-sm cursor-pointer">
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
              {errors.styleTags && <p className="text-sm text-red-500 mt-1">{errors.styleTags}</p>}
            </div>

            <div>
              <Label htmlFor="priceRange">Price Range *</Label>
              <Select
                value={formData.priceRange}
                onValueChange={(value) => setFormData({ ...formData, priceRange: value })}
              >
                <SelectTrigger className={errors.priceRange ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priceRange && <p className="text-sm text-red-500 mt-1">{errors.priceRange}</p>}
            </div>

            {['Hotel', 'Resort', 'Villa / Home', 'Boutique Stay'].includes(formData.brandType) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacityMin">Minimum Capacity (guests)</Label>
                  <Input
                    id="capacityMin"
                    type="number"
                    min="1"
                    value={formData.capacityMin}
                    onChange={(e) => setFormData({ ...formData, capacityMin: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="capacityMax">Maximum Capacity (guests)</Label>
                  <Input
                    id="capacityMax"
                    type="number"
                    min="1"
                    value={formData.capacityMax}
                    onChange={(e) => setFormData({ ...formData, capacityMax: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                High-quality images are essential. Upload your logo, a cover image, and at least 3 gallery images showcasing your brand.
              </AlertDescription>
            </Alert>

            <div>
              <Label>Brand Logo * (Square format recommended)</Label>
              <div className="mt-2">
                {formData.logoUrl ? (
                  <div className="relative w-48 h-48 border rounded-lg overflow-hidden">
                    <img
                      src={formData.logoUrl}
                      alt="Brand Logo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload logo</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                    />
                  </label>
                )}
              </div>
              {errors.logoUrl && <p className="text-sm text-red-500 mt-1">{errors.logoUrl}</p>}
            </div>

            <div>
              <Label>Cover Image * (Wide format recommended, 16:9)</Label>
              <div className="mt-2">
                {formData.coverImageUrl ? (
                  <div className="relative w-full h-64 border rounded-lg overflow-hidden">
                    <img
                      src={formData.coverImageUrl}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImageUrl: '' })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center w-full px-4 py-12 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload cover image</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={(e) => handleImageUpload(e, 'cover')}
                    />
                  </label>
                )}
              </div>
              {errors.coverImageUrl && <p className="text-sm text-red-500 mt-1">{errors.coverImageUrl}</p>}
            </div>

            <div>
              <Label>Gallery Images * (At least 3, maximum 12)</Label>
              <div className="mt-2 grid grid-cols-3 gap-4">
                {formData.galleryUrls.map((url, index) => (
                  <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {formData.galleryUrls.length < 12 && (
                  <label className="flex items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-1 text-xs text-gray-600">Add Image</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/webp"
                      onChange={(e) => handleImageUpload(e, 'gallery')}
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.galleryUrls.length}/12 images uploaded
              </p>
              {errors.galleryUrls && <p className="text-sm text-red-500 mt-1">{errors.galleryUrls}</p>}
            </div>

            <div>
              <Label>Social Media</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="instagramHandle" className="text-sm">Instagram</Label>
                  <Input
                    id="instagramHandle"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    placeholder="@yourbrand"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktokHandle" className="text-sm">TikTok</Label>
                  <Input
                    id="tiktokHandle"
                    value={formData.tiktokHandle}
                    onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
                    placeholder="@yourbrand"
                  />
                </div>

                <div>
                  <Label htmlFor="facebookUrl" className="text-sm">Facebook</Label>
                  <Input
                    id="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/yourbrand"
                  />
                </div>

                <div>
                  <Label htmlFor="linkedinUrl" className="text-sm">LinkedIn</Label>
                  <Input
                    id="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/company/yourbrand"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            {['Hotel', 'Resort', 'Villa / Home', 'Boutique Stay'].includes(formData.brandType) ? (
              <>
                <Alert>
                  <AlertDescription>
                    Select amenities and features that your property offers.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label>Amenities * (Select all that apply)</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {AMENITIES.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={`amenity-${amenity}`}
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
                            } else {
                              setFormData({
                                ...formData,
                                amenities: formData.amenities.filter(a => a !== amenity)
                              });
                            }
                          }}
                        />
                        <label htmlFor={`amenity-${amenity}`} className="text-sm cursor-pointer">
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                  {errors.amenities && <p className="text-sm text-red-500 mt-1">{errors.amenities}</p>}
                </div>
              </>
            ) : (
              <Alert>
                <AlertDescription>
                  Amenity selection is primarily for accommodations. Skip this step or select certifications below.
                </AlertDescription>
              </Alert>
            )}

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Certifications & Awards</h3>
              
              <div>
                <Label>Sustainability Certifications</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {SUSTAINABILITY_CERTS.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`sustain-${cert}`}
                        checked={formData.sustainabilityCertifications.includes(cert)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              sustainabilityCertifications: [...formData.sustainabilityCertifications, cert]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              sustainabilityCertifications: formData.sustainabilityCertifications.filter(c => c !== cert)
                            });
                          }
                        }}
                      />
                      <label htmlFor={`sustain-${cert}`} className="text-sm cursor-pointer">
                        {cert}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <Label>Quality Certifications & Memberships</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {QUALITY_CERTS.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Checkbox
                        id={`quality-${cert}`}
                        checked={formData.qualityCertifications.includes(cert)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              qualityCertifications: [...formData.qualityCertifications, cert]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              qualityCertifications: formData.qualityCertifications.filter(c => c !== cert)
                            });
                          }
                        }}
                      />
                      <label htmlFor={`quality-${cert}`} className="text-sm cursor-pointer">
                        {cert}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Upload required documents: Business License/Registration, Tax Documents, or any certifications mentioned.
                Accepted formats: PDF, JPEG, PNG. Max size: 10MB per file.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label>Business License / Registration *</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload business documents</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload(e, 'Business License')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label>Tax Documents (Optional)</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload tax documents</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload(e, 'Tax Documents')}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label>Certifications (Optional)</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-600">Click to upload certifications</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload(e, 'Certifications')}
                    />
                  </label>
                </div>
              </div>
            </div>

            {uploadedDocuments.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                <div className="space-y-2">
                  {uploadedDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.type}</p>
                          <p className="text-xs text-gray-500">
                            {doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.documents && <p className="text-sm text-red-500">{errors.documents}</p>}
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Please review and accept our terms to complete your application.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptedTerms: checked as boolean })}
                  className={errors.acceptedTerms ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <label htmlFor="acceptedTerms" className="text-sm font-medium cursor-pointer">
                    I accept the <a href="/terms" target="_blank" className="text-blue-600 hover:underline">Terms of Service</a> *
                  </label>
                  {errors.acceptedTerms && <p className="text-sm text-red-500 mt-1">{errors.acceptedTerms}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptedPrivacy"
                  checked={formData.acceptedPrivacy}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptedPrivacy: checked as boolean })}
                  className={errors.acceptedPrivacy ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <label htmlFor="acceptedPrivacy" className="text-sm font-medium cursor-pointer">
                    I accept the <a href="/privacy" target="_blank" className="text-blue-600 hover:underline">Privacy Policy</a> *
                  </label>
                  {errors.acceptedPrivacy && <p className="text-sm text-red-500 mt-1">{errors.acceptedPrivacy}</p>}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptedVendor"
                  checked={formData.acceptedVendor}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptedVendor: checked as boolean })}
                  className={errors.acceptedVendor ? 'border-red-500' : ''}
                />
                <div className="flex-1">
                  <label htmlFor="acceptedVendor" className="text-sm font-medium cursor-pointer">
                    I accept the <a href="/vendor-agreement" target="_blank" className="text-blue-600 hover:underline">Brand Partnership Agreement</a> *
                  </label>
                  {errors.acceptedVendor && <p className="text-sm text-red-500 mt-1">{errors.acceptedVendor}</p>}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Application Summary</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand Name:</span>
                  <span className="font-medium">{formData.brandName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Brand Type:</span>
                  <span className="font-medium">{formData.brandType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contact Email:</span>
                  <span className="font-medium">{formData.primaryContactEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Regions:</span>
                  <span className="font-medium">{formData.regions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Documents Uploaded:</span>
                  <span className="font-medium">{uploadedDocuments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Gallery Images:</span>
                  <span className="font-medium">{formData.galleryUrls.length}</span>
                </div>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                After submitting, you'll be redirected to verify your identity via Stripe Identity. This is a quick 2-3 minute process. Once verified, our team will review your application within 2-3 business days.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const totalSteps = 8;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Brand Partnership Application</CardTitle>
            <CardDescription>
              Join Goldsainte's curated collection of exceptional travel brands
            </CardDescription>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Step Labels */}
            <div className="mt-4 grid grid-cols-4 md:grid-cols-8 gap-2 text-xs text-center">
              {[
                'Contact',
                'Brand',
                'Business',
                'Location',
                'Media',
                'Amenities',
                'Documents',
                'Terms'
              ].map((label, index) => (
                <div
                  key={label}
                  className={`p-2 rounded ${
                    index + 1 < currentStep
                      ? 'bg-green-100 text-green-700'
                      : index + 1 === currentStep
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1 < currentStep && <CheckCircle className="h-4 w-4 mx-auto mb-1" />}
                  {label}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {renderStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
              >
                Back
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || verificationStatus === 'success'}
                  className="min-w-[150px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : verificationStatus === 'success' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Redirecting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              )}
            </div>

            {/* Status Messages */}
            {verificationStatus === 'failed' && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to submit application. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
