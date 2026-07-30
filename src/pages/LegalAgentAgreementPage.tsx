import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/ui/BackButton';
import { AgentAgreementBody } from '@/components/legal/AgentAgreementBody';
import { Handshake, ArrowUp } from 'lucide-react';


export default function LegalAgentAgreementPage() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet><title>Agent Partnership Agreement · Goldsainte</title></Helmet>

      <BackButton className="mb-6" />

      <header className="mb-10">
        <p className="text-[12.5px] uppercase tracking-[0.2em] text-[#7A7151] mb-2">Legal</p>
        <h1 className="font-secondary text-4xl text-[#0a2225] mb-3">Agent Partnership Agreement</h1>
        <p className="text-sm text-[#4a4a4a]">Last updated: May 19, 2026</p>
      </header>

      <Alert className="mb-8">
        <Handshake className="h-4 w-4" />
        <AlertDescription className="text-sm">
          This Agent Partnership Agreement governs the relationship between you and Goldsainte AI, Inc.
          when you operate as a Travel Agent on the Goldsainte marketplace — bidding on trip requests,
          delivering bookings, and serving travelers. By creating an Agent account, you accept these terms.
        </AlertDescription>
      </Alert>

      <AgentAgreementBody />

      <div className="mt-10 flex justify-center">
        <Button onClick={scrollToTop} className="bg-[#0c4d47] hover:bg-[#0c4d47]/90 text-white gap-2">
          <ArrowUp className="h-4 w-4" /> Back to top
        </Button>
      </div>
    </div>
  );
}
