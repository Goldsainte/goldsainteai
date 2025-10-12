import { useNavigate } from 'react-router-dom';
import { VoiceCallInterface } from '@/components/VoiceCallInterface';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function VoiceCall() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Voice Call with AI</h1>
            <p className="text-muted-foreground">
              Have a natural conversation with our AI travel assistant
            </p>
          </div>

          <VoiceCallInterface onClose={() => navigate(-1)} />
        </div>
      </div>
    </div>
  );
}
