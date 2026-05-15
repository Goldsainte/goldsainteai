import { useEffect, useState } from "react";
import { Check, Loader2, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function PhoneSignInLinkCard() {
  const [linkPhone, setLinkPhone] = useState("");
  const [linkOtpSent, setLinkOtpSent] = useState(false);
  const [linkOtpCode, setLinkOtpCode] = useState("");
  const [linkingPhone, setLinkingPhone] = useState(false);
  const [authPhone, setAuthPhone] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthPhone(data.user?.phone || null);
    });
  }, []);

  const handleSendLinkOtp = async () => {
    const cleaned = linkPhone.replace(/\s/g, "");
    if (!cleaned.startsWith("+") || cleaned.length < 8) {
      toast.error("Invalid phone", {
        description: "Include country code, e.g. +1 555 123 4567",
      });
      return;
    }
    setLinkingPhone(true);
    const { error } = await supabase.auth.updateUser({ phone: cleaned });
    setLinkingPhone(false);
    if (error) {
      toast.error("Could not send code", { description: error.message });
      return;
    }
    setLinkOtpSent(true);
    toast.success("Code sent", { description: `We texted a code to ${cleaned}` });
  };

  const handleVerifyLinkOtp = async () => {
    setLinkingPhone(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: linkPhone.replace(/\s/g, ""),
      token: linkOtpCode,
      type: "phone_change",
    });
    setLinkingPhone(false);
    if (error) {
      toast.error("Invalid code", { description: error.message });
      return;
    }
    toast.success("Phone linked", {
      description: "You can now sign in with this phone number.",
    });
    setLinkOtpSent(false);
    setLinkPhone("");
    setLinkOtpCode("");
    const { data } = await supabase.auth.getUser();
    setAuthPhone(data.user?.phone || null);
  };

  return (
    <div className="rounded-2xl border border-[#E5DFC6] bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <Phone className="h-4 w-4 text-[#0c4d47]" />
        <h3 className="font-secondary text-lg text-[#0a2225]">Sign in with phone</h3>
      </div>
      <p className="text-xs text-[#6B7280] mb-4">
        Link a phone number so you can sign in with a one-time code instead of a password.
      </p>
      {authPhone ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F0F7F6] border border-[#0c4d47]/20">
          <Check className="h-4 w-4 text-[#0c4d47]" />
          <span className="text-sm text-[#0a2225] font-medium">{authPhone}</span>
          <span className="text-xs text-[#6B7280] ml-2">Linked for sign-in</span>
        </div>
      ) : !linkOtpSent ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="tel"
            value={linkPhone}
            onChange={(e) => setLinkPhone(e.target.value)}
            placeholder="+1 555 123 4567"
            className="rounded-xl flex-1"
          />
          <Button
            onClick={handleSendLinkOtp}
            disabled={linkingPhone || !linkPhone}
            className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white"
          >
            {linkingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#6B7280]">
            Enter the 6-digit code we sent to {linkPhone}
          </p>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={linkOtpCode}
            onChange={(e) => setLinkOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="rounded-xl text-center text-2xl tracking-widest"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleVerifyLinkOtp}
              disabled={linkingPhone || linkOtpCode.length !== 6}
              className="rounded-full bg-[#0c4d47] hover:bg-[#0a3d39] text-white flex-1"
            >
              {linkingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and link"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setLinkOtpSent(false);
                setLinkOtpCode("");
              }}
              className="rounded-full border-[#E5DFC6]"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}