import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollGatedAgreement, type AgreementEvidence } from '@/components/legal/ScrollGatedAgreement';
import { AgentAgreementBody } from '@/components/legal/AgentAgreementBody';
import { ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, Shield, Building, Eye } from 'lucide-react';

interface AgentTermsAcceptanceModalProps {
  open: boolean;
  agentId: string;
  onAccepted: () => void;
}

export const AgentTermsAcceptanceModal = ({ open, agentId, onAccepted }: AgentTermsAcceptanceModalProps) => {
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  // Shown INSIDE the dialog: the destructive toast rendered underneath the
  // modal overlay, so the applicant saw a red sliver they couldn't read or
  // dismiss (founder report, Jul 26).
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Scroll gate (29 Jul): checkboxes unlock only after the reader has
  // scrolled the full document container; evidence rides along to the server.
  const [readToEnd, setReadToEnd] = useState(false);
  const [evidence, setEvidence] = useState<AgreementEvidence | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [vendorAccepted, setVendorAccepted] = useState(false);
  const [transparencyAccepted, setTransparencyAccepted] = useState(false);

  const allAccepted = termsAccepted && privacyAccepted && vendorAccepted && transparencyAccepted;

  const handleAcceptAll = async () => {
    if (!allAccepted) return;

    setAccepting(true);
    setErrorMessage(null);
    try {
      const { error } = await supabase.functions.invoke('record-terms-acceptance', {
        body: {
          agentId,
          termsVersion: 'v1.0',
          privacyVersion: 'v1.0',
          vendorVersion: 'v1.0',
          transparencyVersion: 'v1.0',
          openedAt: evidence?.openedAt ?? null,
          scrolledToBottomAt: evidence?.scrolledToBottomAt ?? null,
          contentHash: evidence?.contentHash ?? null
        }
      });

      if (error) throw error;

      toast({
        title: "Terms Accepted",
        description: "You can now access all agent features."
      });

      onAccepted();
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      // functions.invoke hides the real reason in error.context — read it.
      let detail = 'Failed to record acceptance. Please try again.';
      try {
        const res = error?.context;
        if (res?.json) {
          const body = await res.clone().json();
          if (body?.error) detail = String(body.error);
        }
      } catch { /* keep generic */ }
      setErrorMessage(detail);
    } finally {
      setAccepting(false);
    }
  };

  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Agent Agreement Required</DialogTitle>
          <DialogDescription>
            Please review and accept all documents to continue using the platform as a travel agent.
          </DialogDescription>
        </DialogHeader>

        <ScrollGatedAgreement
          heightClassName="h-[440px]"
          onCompleted={(ev) => {
            setReadToEnd(true);
            setEvidence(ev);
          }}
        >
          <div className="space-y-8">
            {/* The FULL Agent Partnership Agreement — the same words as
                /legal/agent-agreement (30 Jul: replaced the old bullet
                summaries; agents were accepting text that wasn't the
                agreement, and one summary line about fee deduction
                contradicted it). */}
            <AgentAgreementBody />

            <div className="rounded-xl border border-[#E5DFC6] bg-[#FDF9F0]/60 p-4">
              <p className="mb-2 text-sm font-medium text-[#0a2225]">Also part of your agreement</p>
              <p className="mb-3 text-xs text-[#6B7280]">These platform-wide policies apply to every account and are incorporated by reference. Each opens in a new tab.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0c4d47] underline underline-offset-2">Terms of Service <ExternalLink className="h-3 w-3" /></a>
                <a href="/privacy-cookies" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0c4d47] underline underline-offset-2">Privacy &amp; Cookies <ExternalLink className="h-3 w-3" /></a>
                <a href="/transparency-agreement" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#0c4d47] underline underline-offset-2">Transparency Agreement <ExternalLink className="h-3 w-3" /></a>
              </div>
            </div>

            <div className="flex items-center space-x-2 p-3 bg-secondary rounded-lg">
              <Checkbox
                id="terms"
                disabled={!readToEnd}
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I have read and agree to the Terms of Service
              </label>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-secondary rounded-lg">
              <Checkbox
                id="privacy"
                disabled={!readToEnd}
                checked={privacyAccepted}
                onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              />
              <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                I have read and agree to the Privacy & Cookies Policy
              </label>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-secondary rounded-lg">
              <Checkbox
                id="vendor"
                disabled={!readToEnd}
                checked={vendorAccepted}
                onCheckedChange={(checked) => setVendorAccepted(checked as boolean)}
              />
              <label htmlFor="vendor" className="text-sm font-medium cursor-pointer">
                I have read and agree to the Agent Partnership Agreement above
              </label>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-secondary rounded-lg">
              <Checkbox
                id="transparency"
                disabled={!readToEnd}
                checked={transparencyAccepted}
                onCheckedChange={(checked) => setTransparencyAccepted(checked as boolean)}
              />
              <label htmlFor="transparency" className="text-sm font-medium cursor-pointer">
                I have read and agree to the Transparency Agreement
              </label>
            </div>
          </div>
        </ScrollGatedAgreement>

        <DialogFooter>
          {/* The dialog's built-in X rendered but was wired to a no-op
              (onOpenChange={() => {}}) — a visible control that does nothing.
              It's hidden now; this link is the honest way out. Agreement is
              required for the agent dashboard, not for the rest of the site. */}
          {errorMessage && (
            <div className="mb-3 rounded-xl border border-[#5b2c2c]/30 bg-[#f0d1d1] px-4 py-3 text-sm text-[#5b2c2c]" role="alert">
              {errorMessage}
            </div>
          )}
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
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-3 w-full text-center text-sm text-[#6B7280] underline underline-offset-4 hover:text-[#0a2225]"
          >
            Not now — return to the homepage
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
