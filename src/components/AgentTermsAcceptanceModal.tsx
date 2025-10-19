import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Shield, Building } from 'lucide-react';

interface AgentTermsAcceptanceModalProps {
  open: boolean;
  agentId: string;
  onAccepted: () => void;
}

export const AgentTermsAcceptanceModal = ({ open, agentId, onAccepted }: AgentTermsAcceptanceModalProps) => {
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [vendorAccepted, setVendorAccepted] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && vendorAccepted;

  const handleAcceptAll = async () => {
    if (!allAccepted) return;

    setAccepting(true);
    try {
      const { error } = await supabase.functions.invoke('record-terms-acceptance', {
        body: {
          agentId,
          termsVersion: 'v1.0',
          privacyVersion: 'v1.0',
          vendorVersion: 'v1.0'
        }
      });

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "You can now access all agent features."
      });

      onAccepted();
    } catch (error) {
      console.error('Error accepting terms:', error);
      toast({
        title: "Error",
        description: "Failed to record acceptance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Agent Agreement Required</DialogTitle>
          <DialogDescription>
            Please review and accept all documents to continue using the platform as a travel agent.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          <div className="space-y-8">
            {/* Terms of Service */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Terms of Service</h3>
              </div>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">1. Platform Usage</p>
                <p>As a registered travel agent, you agree to use this platform professionally and ethically...</p>
                
                <p className="font-medium mt-4">2. Service Standards</p>
                <p>You commit to providing high-quality service, responding promptly to inquiries, and maintaining professionalism...</p>
                
                <p className="font-medium mt-4">3. Commission Structure</p>
                <p>Commission rates are set per package. Platform fees are automatically deducted from earnings...</p>
                
                <p className="font-medium mt-4">4. Liability & Insurance</p>
                <p>You maintain appropriate insurance and accept responsibility for services you provide...</p>
              </div>
              <div className="flex items-center space-x-2 mt-4 p-3 bg-secondary rounded-lg">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                  I have read and agree to the Terms of Service
                </label>
              </div>
            </div>

            <Separator />

            {/* Privacy Policy */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Privacy Policy</h3>
              </div>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">1. Data Collection</p>
                <p>We collect agent profile information, booking data, and communication records...</p>
                
                <p className="font-medium mt-4">2. Data Usage</p>
                <p>Your data is used to facilitate bookings, process payments, and improve platform services...</p>
                
                <p className="font-medium mt-4">3. Data Sharing</p>
                <p>Information is shared with customers for booking purposes. We never sell personal data...</p>
                
                <p className="font-medium mt-4">4. Data Security</p>
                <p>We employ industry-standard security measures to protect your information...</p>
              </div>
              <div className="flex items-center space-x-2 mt-4 p-3 bg-secondary rounded-lg">
                <Checkbox 
                  id="privacy" 
                  checked={privacyAccepted}
                  onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                />
                <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                  I have read and agree to the Privacy Policy
                </label>
              </div>
            </div>

            <Separator />

            {/* Vendor Agreement */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Vendor Agreement</h3>
              </div>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">1. Independent Contractor Status</p>
                <p>You operate as an independent contractor, not an employee of the platform...</p>
                
                <p className="font-medium mt-4">2. Package Creation & Pricing</p>
                <p>You have full control over your packages, pricing, and terms within platform guidelines...</p>
                
                <p className="font-medium mt-4">3. Payment Terms</p>
                <p>Payments are processed within 5 business days after trip completion. Platform fees apply...</p>
                
                <p className="font-medium mt-4">4. Cancellation & Refunds</p>
                <p>You must honor your stated cancellation policies. Dispute resolution follows platform procedures...</p>
              </div>
              <div className="flex items-center space-x-2 mt-4 p-3 bg-secondary rounded-lg">
                <Checkbox 
                  id="vendor" 
                  checked={vendorAccepted}
                  onCheckedChange={(checked) => setVendorAccepted(checked as boolean)}
                />
                <label htmlFor="vendor" className="text-sm font-medium cursor-pointer">
                  I have read and agree to the Vendor Agreement
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            onClick={handleAcceptAll}
            disabled={!allAccepted || accepting}
            size="lg"
            className="w-full"
          >
            {accepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept All & Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
