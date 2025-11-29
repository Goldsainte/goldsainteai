import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CountryCodeSelect } from './CountryCodeSelect';
import { OTPInput } from './OTPInput';
import { usePhoneVerification } from '@/hooks/usePhoneVerification';
import { CheckCircle, Phone, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhoneVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

export function PhoneVerificationModal({ open, onOpenChange, onVerified }: PhoneVerificationModalProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { 
    isLoading, 
    error, 
    sendVerificationCode, 
    checkVerificationCode, 
    formatToE164,
    reset 
  } = usePhoneVerification();

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhoneNumber('');
      setCode('');
      setCooldown(0);
      reset();
    }
  }, [open, reset]);

  const handleSendCode = async () => {
    const e164Phone = formatToE164(countryCode, phoneNumber);
    const result = await sendVerificationCode(e164Phone);
    if (result.success) {
      setStep('code');
      setCooldown(60);
    }
  };

  const handleVerifyCode = async () => {
    const e164Phone = formatToE164(countryCode, phoneNumber);
    const result = await checkVerificationCode(e164Phone, code);
    if (result.verified) {
      setStep('success');
      onVerified?.();
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setCode('');
    const e164Phone = formatToE164(countryCode, phoneNumber);
    const result = await sendVerificationCode(e164Phone);
    if (result.success) {
      setCooldown(60);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'success' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Phone Verified
              </>
            ) : (
              <>
                <Phone className="h-5 w-5" />
                Verify Phone Number
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' && 'Enter your phone number to receive a verification code.'}
            {step === 'code' && `Enter the 6-digit code sent to ${countryCode} ${phoneNumber}`}
            {step === 'success' && 'Your phone number has been verified successfully.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {step === 'phone' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect 
                    value={countryCode} 
                    onChange={setCountryCode}
                    disabled={isLoading}
                  />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="555 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-()]/g, ''))}
                    disabled={isLoading}
                    className="flex-1 rounded-xl"
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button 
                onClick={handleSendCode} 
                disabled={isLoading || phoneNumber.length < 6}
                className="w-full rounded-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="space-y-4">
                <OTPInput
                  value={code}
                  onChange={setCode}
                  length={6}
                  disabled={isLoading}
                />

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isLoading || code.length !== 6}
                  className="w-full rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('phone')}
                    disabled={isLoading}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Change number
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResendCode}
                    disabled={isLoading || cooldown > 0}
                    className={cn(
                      "text-muted-foreground",
                      cooldown > 0 && "opacity-50"
                    )}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </Button>
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-muted-foreground">
                Your phone number {countryCode} {phoneNumber} is now verified.
              </p>
              <Button 
                onClick={() => onOpenChange(false)}
                className="w-full rounded-xl"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
