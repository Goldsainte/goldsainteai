import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { CheckCircle2, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";

interface AskQuestionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  tripTitle?: string;
  hostName?: string;
  partnerId?: string;
}

type DrawerState = "idle" | "submitting" | "sent";

export function AskQuestionDrawer({
  open,
  onOpenChange,
  tripId,
  tripTitle,
  hostName,
  partnerId,
}: AskQuestionDrawerProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [question, setQuestion] = useState("");
  const [drawerState, setDrawerState] = useState<DrawerState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail("");
    setFirstName("");
    setPhone("");
    setQuestion("");
    setDrawerState("idle");
    setErrorMsg(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Delay reset so the closing animation plays first
      setTimeout(resetForm, 300);
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedEmail = email.trim();
    const trimmedQuestion = question.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!trimmedQuestion) {
      setErrorMsg("Please type your question before sending.");
      return;
    }
    if (trimmedQuestion.length > 1000) {
      setErrorMsg("Question must be 1 000 characters or fewer.");
      return;
    }

    setDrawerState("submitting");

    // Stash question locally as fallback in case the user clears their browser
    // before clicking the magic link.
    try {
      sessionStorage.setItem(
        "goldsainte:pendingQuestion",
        JSON.stringify({ tripId, question: trimmedQuestion, ts: Date.now() })
      );
    } catch {
      // sessionStorage unavailable — not fatal
    }

    try {
      const { error } = await supabase.functions.invoke("submit-trip-inquiry", {
        body: {
          email: trimmedEmail,
          firstName: firstName.trim() || undefined,
          phone: phone.trim() || undefined,
          tripId,
          partnerId,
          question: trimmedQuestion,
          tripTitle,
          hostName,
        },
      });

      if (error) {
        throw error;
      }

      trackEvent("inquiry_submitted", { trip_id: tripId, trip_title: tripTitle, method: "magic_link" });
      setDrawerState("sent");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setDrawerState("idle");
    }
  };

  const displayName = hostName ?? "the specialist";

  // Rotating example prompts to unfreeze blank-input anxiety
  const placeholderExamples = [
    "Is this trip suitable for a honeymoon?",
    "Can I customise the itinerary?",
    "What's the best time of year to go?",
    "Are solo travellers welcome?",
  ];
  const questionPlaceholder = placeholderExamples[
    Math.abs(tripId.charCodeAt(0) ?? 0) % placeholderExamples.length
  ];

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      {/* On mobile: full-width bottom sheet. On md+: centred, max-w-lg, still bottom-anchored */}
      <SheetContent
        side="bottom"
        className="mx-auto w-full max-w-lg rounded-t-2xl pb-safe-bottom pb-8 md:rounded-2xl"
        // Don't let a stray backdrop click discard the form / confirmation —
        // closing is explicit (the X, "Got it", or Cancel).
        onInteractOutside={(e) => e.preventDefault()}
      >
        {drawerState === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <SheetTitle className="text-xl font-semibold">Question sent</SheetTitle>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your question's on its way to {displayName}. They'll reply right here in your
              conversation.
            </p>
            {tripTitle && (
              <p className="text-xs italic text-muted-foreground">"{tripTitle}"</p>
            )}
            <p className="max-w-xs text-xs text-muted-foreground">
              We've emailed <strong>{email}</strong> a secure link to open the conversation and
              see the reply — no password needed.
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => handleClose(false)}
            >
              Got it
            </Button>
          </div>
        ) : (
          <>
            <SheetHeader className="mb-4">
              <SheetTitle>Ask {displayName} a question</SheetTitle>
              {/* Trip context anchor — helps users who have multiple tabs open */}
              {tripTitle && (
                <SheetDescription className="italic text-[#7A6A3A]">"{tripTitle}"</SheetDescription>
              )}
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="aq-email">Your email</Label>
                <Input
                  id="aq-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={drawerState === "submitting"}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="aq-name">
                    First name <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="aq-name"
                    type="text"
                    placeholder="Jordan"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={drawerState === "submitting"}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="aq-phone">
                    Phone <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="aq-phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={drawerState === "submitting"}
                  />
                </div>
              </div>
              <p className="-mt-1.5 text-xs text-muted-foreground">
                Optional, and never shared. We only use these to reach you when {displayName} replies.
              </p>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="aq-question">Your question</Label>
                <Textarea
                  id="aq-question"
                  placeholder={questionPlaceholder}
                  rows={4}
                  maxLength={1000}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={drawerState === "submitting"}
                  required
                />
                <p className="text-xs text-muted-foreground text-right">
                  {question.length}/1000
                </p>
              </div>

              {errorMsg && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={drawerState === "submitting"}
                className="w-full"
              >
                {drawerState === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending&hellip;
                  </>
                ) : (
                  "Send question"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                We'll send your question now and email you a secure link to follow the
                conversation — no password required.
              </p>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
