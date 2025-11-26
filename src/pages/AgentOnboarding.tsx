import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Briefcase, Upload, ArrowLeft } from "lucide-react";
import { TermsDialog, PrivacyDialog, VendorDialog, InsuranceDialog } from "@/components/AgentLegalDocuments";

export default function AgentOnboarding() {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  // Agent applications are ANONYMOUS - no auth required
  // Form will save to agent_applications table without user_id
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedVendor, setAcceptedVendor] = useState(false);
  const [acceptedGDPR, setAcceptedGDPR] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [whatsappNotifications, setWhatsappNotifications] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Anonymous submission - no auth required

    if (!acceptedTerms || !acceptedPrivacy || !acceptedVendor || !acceptedGDPR) {
      toast.error("Please accept all legal agreements to continue");
      return;
    }

    const formData = new FormData(e.currentTarget);
    setLoading(true);

    try {
      const specializations = (formData.get('specializations') as string).split(',').map(s => s.trim());
      const languages = (formData.get('languages') as string).split(',').map(l => l.trim());
      const serviceTypes = (formData.get('service_types') as string).split(',').map(s => s.trim());
      const destinations = (formData.get('destinations') as string).split(',').map(d => d.trim());

      // ONLY save to agent_applications (NO travel_agents record yet)
      const { data: application, error: appError } = await supabase
        .from('agent_applications')
        .insert({
          first_name: formData.get('primary_contact_name')?.toString().split(' ')[0] || '',
          last_name: formData.get('primary_contact_name')?.toString().split(' ').slice(1).join(' ') || '',
          email: formData.get('email') as string,
          phone: formData.get('phone') as string,
          agency_name: formData.get('agency_name') as string,
          business_type: formData.get('business_type') as string,
          license_number: formData.get('license_number') as string || null,
          years_experience: parseInt(formData.get('experience_years') as string),
          specialties: specializations,
          languages,
          website: formData.get('website') as string || null,
          status: 'pending_verification',
          // Additional fields
          business_registration_number: formData.get('business_registration_number') as string || null,
          business_address: formData.get('business_address') as string,
          accreditations: formData.get('accreditations') as string || null,
          service_types: serviceTypes,
          destinations,
          preferred_currency: formData.get('preferred_currency') as string || 'USD',
          payment_processor: formData.get('payment_processor') as string || null,
          tax_id: formData.get('tax_id') as string || null,
          // Legal compliance
          accepted_terms: acceptedTerms,
          accepted_privacy: acceptedPrivacy,
          accepted_vendor: acceptedVendor,
          accepted_gdpr: acceptedGDPR,
          // Communication preferences
          email_notifications_enabled: emailNotifications,
          sms_notifications_enabled: smsNotifications,
          whatsapp_notifications_enabled: whatsappNotifications,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (appError) throw appError;

      // Initiate Stripe Identity verification (anonymous)
      const { data: verificationData, error: verificationError } = 
        await supabase.functions.invoke('create-identity-verification', {
          body: {
            email: formData.get('email') as string,
            firstName: formData.get('primary_contact_name')?.toString().split(' ')[0] || '',
            lastName: formData.get('primary_contact_name')?.toString().split(' ').slice(1).join(' ') || 'Agent',
            applicationType: 'agent',
            applicationId: application.id,
          },
        });

      if (verificationError) throw verificationError;

      toast.success('Application submitted! Redirecting to identity verification...');
      
      // Redirect to Stripe Identity
      window.location.href = verificationData.url;
    } catch (error: any) {
      console.error('Error creating agent application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen !bg-white !text-black flex flex-col">
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 md:py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 md:mb-6 min-h-[44px]"
          size="default"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Card className="border !border-gray-300 !bg-white rounded-[32px] shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
              <Briefcase className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
              <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-semibold font-secondary leading-tight">Travel Agent Application</CardTitle>
            </div>
            <CardDescription className="mt-1 text-sm md:text-base text-muted-foreground">
              Complete this comprehensive application to join our marketplace
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {/* Section 1: Business & Contact Information */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  1. Business & Contact Information
                </h3>
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="agency_name" className="text-sm">Agency Name *</Label>
                    <Input id="agency_name" name="agency_name" required placeholder="Your Travel Agency" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="business_registration_number" className="text-sm">Business Registration Number</Label>
                    <Input id="business_registration_number" name="business_registration_number" placeholder="Optional" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="business_type" className="text-sm">Business Type *</Label>
                    <select id="business_type" name="business_type" required className="w-full min-h-[44px] px-3 rounded-md border border-input bg-background text-sm">
                      <option value="">Select type</option>
                      <option value="independent">Independent Agent</option>
                      <option value="agency">Travel Agency</option>
                      <option value="tour_operator">Tour Operator</option>
                      <option value="dmc">Destination Management Company</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="primary_contact_name" className="text-sm">Primary Contact Name *</Label>
                    <Input id="primary_contact_name" name="primary_contact_name" required placeholder="John Doe" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="primary_contact_title" className="text-sm">Contact Title *</Label>
                    <Input id="primary_contact_title" name="primary_contact_title" required placeholder="Managing Director" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-sm">Business Email *</Label>
                    <Input id="email" name="email" type="email" required placeholder="contact@agency.com" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required placeholder="+1 (555) 123-4567" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="whatsapp_number" className="text-sm">WhatsApp Number *</Label>
                    <Input id="whatsapp_number" name="whatsapp_number" type="tel" required placeholder="+1 (555) 123-4567" className="min-h-[44px]" />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <Label htmlFor="business_address" className="text-sm">Business Address *</Label>
                    <Input id="business_address" name="business_address" required placeholder="Street, City, Country" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="website" className="text-sm">Website</Label>
                    <Input id="website" name="website" type="url" placeholder="https://yourwebsite.com" className="min-h-[44px]" />
                  </div>
                  
                  <div>
                    <Label htmlFor="social_media" className="text-sm">Social Media Profiles</Label>
                    <Input id="social_media" name="social_media" placeholder="Instagram, LinkedIn, etc." className="min-h-[44px]" />
                  </div>
                </div>
              </div>

              {/* Section 2: Licensing & Certifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">2. Licensing & Certifications</h3>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="license_number">Travel Agency License Number</Label>
                    <Input id="license_number" name="license_number" placeholder="If required in your region" />
                  </div>
                  
                  <div>
                    <Label htmlFor="accreditations">Industry Accreditations</Label>
                    <Input id="accreditations" name="accreditations" placeholder="IATA, ARC, CLIA, etc." />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="certification_docs">Certification Documents Upload</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Upload certification PDFs or images</p>
                      <Input id="certification_docs" name="certification_docs" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="mt-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial & Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">3. Financial & Payment Details</h3>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferred_currency">Preferred Currency *</Label>
                    <select id="preferred_currency" name="preferred_currency" required className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_processor">Payment Processor *</Label>
                    <select id="payment_processor" name="payment_processor" required className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="">Select processor</option>
                      <option value="stripe">Stripe</option>
                      <option value="paypal">PayPal</option>
                      <option value="payoneer">Payoneer</option>
                      <option value="bank_transfer">Direct Bank Transfer</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tax_id">Tax ID / VAT Number *</Label>
                    <Input id="tax_id" name="tax_id" required placeholder="Tax identification number" />
                  </div>
                  
                  <div>
                    <Label htmlFor="beneficiary_name">Beneficiary Name *</Label>
                    <Input id="beneficiary_name" name="beneficiary_name" required placeholder="Name for payments" />
                  </div>
                </div>
              </div>

              {/* Section 4: Product & Service Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">4. Product & Service Details</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="service_types">Type of Travel Services Offered *</Label>
                    <Input 
                      id="service_types" 
                      name="service_types" 
                      required 
                      placeholder="Flights, Hotels, Tours, Packages, Insurance (comma-separated)" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="destinations">Regions/Destinations Specialization *</Label>
                    <Input 
                      id="destinations" 
                      name="destinations" 
                      required 
                      placeholder="Europe, Asia, Caribbean, etc. (comma-separated)" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="specializations">Travel Specializations *</Label>
                    <Input 
                      id="specializations" 
                      name="specializations" 
                      required 
                      placeholder="Luxury, Adventure, Family, Business (comma-separated)" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="inventory_management">Inventory Management *</Label>
                      <select id="inventory_management" name="inventory_management" required className="w-full h-10 px-3 rounded-md border border-input bg-background">
                        <option value="manual">Manual Listing</option>
                        <option value="api">API Integration</option>
                        <option value="bulk">Bulk Upload (CSV/XML)</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="commission_rate">Commission Rate (%) *</Label>
                      <Input id="commission_rate" name="commission_rate" type="number" step="0.01" required defaultValue="10.00" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="cancellation_policy">Cancellation/Refund Policy *</Label>
                    <Textarea 
                      id="cancellation_policy" 
                      name="cancellation_policy" 
                      required 
                      placeholder="Describe your cancellation and refund terms..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">Agency Description/Introduction *</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      required 
                      placeholder="Tell us about your agency and expertise..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Platform Usage & Access */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">5. Platform Usage & Access</h3>
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="languages">Languages Spoken *</Label>
                    <Input 
                      id="languages" 
                      name="languages" 
                      required 
                      placeholder="English, Spanish, French (comma-separated)" 
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="time_zone">Time Zone *</Label>
                    <select id="time_zone" name="time_zone" required className="w-full h-10 px-3 rounded-md border border-input bg-background">
                      <option value="America/New_York">EST - Eastern Time</option>
                      <option value="America/Chicago">CST - Central Time</option>
                      <option value="America/Denver">MST - Mountain Time</option>
                      <option value="America/Los_Angeles">PST - Pacific Time</option>
                      <option value="Europe/London">GMT - London</option>
                      <option value="Europe/Paris">CET - Central Europe</option>
                      <option value="Asia/Dubai">GST - Dubai</option>
                      <option value="Asia/Singapore">SGT - Singapore</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="experience_years">Years of Experience *</Label>
                    <Input id="experience_years" name="experience_years" type="number" required min="0" />
                  </div>
                </div>
              </div>

              {/* Section 6: Communication Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">6. Communication Preferences</h3>
                <Separator />
                
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to receive notifications about new job opportunities
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="email_notifications" 
                      checked={emailNotifications} 
                      onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
                    />
                    <label htmlFor="email_notifications" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I consent to receive job notifications via email
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="sms_notifications" 
                      checked={smsNotifications} 
                      onCheckedChange={(checked) => setSmsNotifications(checked as boolean)}
                    />
                    <label htmlFor="sms_notifications" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I consent to receive job notifications via SMS text messages
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="whatsapp_notifications" 
                      checked={whatsappNotifications} 
                      onCheckedChange={(checked) => setWhatsappNotifications(checked as boolean)}
                    />
                    <label htmlFor="whatsapp_notifications" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I consent to receive job notifications via WhatsApp
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 7: Legal Agreements & Compliance */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">7. Legal Agreements & Compliance</h3>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="terms" 
                      checked={acceptedTerms} 
                      onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    />
                    <label htmlFor="terms" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the{" "}
                      <TermsDialog>
                        <span className="font-semibold text-primary cursor-pointer underline hover:text-primary/80">
                          Goldsainte Terms & Conditions
                        </span>
                      </TermsDialog>{" "}
                      *
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="privacy" 
                      checked={acceptedPrivacy} 
                      onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                    />
                    <label htmlFor="privacy" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the{" "}
                      <PrivacyDialog>
                        <span className="font-semibold text-primary cursor-pointer underline hover:text-primary/80">
                          Goldsainte Privacy Policy
                        </span>
                      </PrivacyDialog>{" "}
                      *
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="vendor" 
                      checked={acceptedVendor} 
                      onCheckedChange={(checked) => setAcceptedVendor(checked as boolean)}
                    />
                    <label htmlFor="vendor" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the{" "}
                      <VendorDialog>
                        <span className="font-semibold text-primary cursor-pointer underline hover:text-primary/80">
                          Goldsainte Vendor Agreement
                        </span>
                      </VendorDialog>{" "}
                      *
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="gdpr" 
                      checked={acceptedGDPR} 
                      onCheckedChange={(checked) => setAcceptedGDPR(checked as boolean)}
                    />
                    <label htmlFor="gdpr" className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I confirm GDPR/Data compliance and understand{" "}
                      <InsuranceDialog>
                        <span className="font-semibold text-primary cursor-pointer underline hover:text-primary/80">
                          Goldsainte Travel Insurance & Liability Requirements
                        </span>
                      </InsuranceDialog>{" "}
                      *
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 8: Verification Documents */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">8. Verification Documents</h3>
                <Separator />
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-4">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-center text-muted-foreground mb-2">Upload Required Documents</p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                      <li>• Business registration certificate</li>
                      <li>• Photo ID of primary contact</li>
                      <li>• Agency license or accreditation docs</li>
                      <li>• Proof of address (utility bill, etc.)</li>
                    </ul>
                    <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="mt-2" />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px] text-base" 
                size="lg"
                disabled={loading || !acceptedTerms || !acceptedPrivacy || !acceptedVendor || !acceptedGDPR}
              >
                {loading ? 'Submitting Application...' : 'Submit Application'}
              </Button>
              
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
                * Required fields. Your application will be reviewed within 2-3 business days.
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
