import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { CreatorAgreementBody } from '@/components/legal/CreatorAgreementBody';
import { Handshake, ArrowUp } from 'lucide-react';

export default function LegalCreatorAgreementPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet><title>Creator Partnership Agreement · Goldsainte</title></Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[12.5px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">Creator Partnership Agreement</h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: May 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <Handshake className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This Creator Partnership Agreement governs the relationship between you and Goldsainte AI, Inc.
          when you publish content, itinerary guides, or custom services on the Goldsainte
          marketplace. By creating a Creator account, you accept these terms.
        </AlertDescription>
      </Alert>

      <CreatorAgreementBody />

      <div className="mt-12 flex justify-end">
        <Button onClick={scrollToTop} className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white gap-2" size="sm">
          <ArrowUp className="h-4 w-4" />
          Back to top
        </Button>
      </div>
    </div>
  );
}
