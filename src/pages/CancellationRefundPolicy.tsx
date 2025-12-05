import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldCheck, Clock, AlertCircle, CheckCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/ui/BackButton";

export default function CancellationRefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <BackButton className="mb-6" />
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cancellation &amp; Refund Policy</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* High-level notice */}
        <Alert className="mb-6">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Goldsainte operates as a curated{" "}
            <span className="font-semibold">marketplace</span>. We connect travelers with
            independent travel professionals, but we are not the travel provider, tour
            operator, airline, hotel, or ground supplier. Your legal contract for travel
            services is with the relevant travel professional and/or supplier, not with
            Goldsainte.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* 1. Role of Goldsainte */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                1. Role of Goldsainte (Marketplace Only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Goldsainte provides a digital platform where travelers can discover,
                communicate with, and book trips designed and managed by independent
                travel professionals (agents and creators).
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  Goldsainte does <span className="font-semibold">not</span> operate
                  flights, hotels, tours, transfers, or on-the-ground services.
                </li>
                <li>
                  Goldsainte is <span className="font-semibold">not a party</span> to the
                  travel contract between you and the travel professional and/or suppliers.
                </li>
                <li>
                  The travel professional is responsible for honoring published
                  cancellation, refund, and deposit terms for each proposal and booking.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 2. Layers of policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                2. How Cancellations &amp; Refunds Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                When you book a trip on Goldsainte, <span className="font-semibold">
                  three layers
                </span>{" "}
                of policies may apply:
              </p>
              <ol className="list-decimal ml-5 space-y-2">
                <li>
                  <span className="font-semibold">Supplier policies</span> — airlines,
                  hotels, tour operators, ground transport providers, etc.
                </li>
                <li>
                  <span className="font-semibold">Travel professional&apos;s policies</span>{" "}
                  — the agent/creator's own cancellation, refund, and deposit terms as
                  stated in the proposal and booking.
                </li>
                <li>
                  <span className="font-semibold">Goldsainte marketplace policies</span> —{" "}
                  how disputes are reviewed and how platform fees are treated.
                </li>
              </ol>
              <p>
                In the event of a cancellation, the most restrictive applicable policy will
                generally determine refund eligibility.
              </p>
            </CardContent>
          </Card>

          {/* 3. Deposits & non-refundable amounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                3. Deposits, Non-Refundable Elements &amp; Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  Many trips require a <span className="font-semibold">non-refundable</span>{" "}
                  deposit. The proposal and booking will indicate any such deposit and when
                  it is due.
                </li>
                <li>
                  Supplier-imposed non-refundable amounts (e.g., certain airfare classes,
                  prepaid hotel rates, special event tickets) may not be recoverable,
                  regardless of when you cancel.
                </li>
                <li>
                  Goldsainte marketplace or processing fees, where applicable, are typically{" "}
                  <span className="font-semibold">non-refundable</span> once a booking is
                  confirmed, except where required by law.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 4. Timing-based overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                4. Timing Overview (High-Level Guide)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Exact terms for your booking are defined in the proposal and the underlying
                supplier rules. As a general guide only:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <span className="font-semibold">Far in advance</span> (e.g., 60–90+ days
                  before departure) — more options may be available for partial refunds or
                  credits, subject to supplier rules and the travel professional&apos;s
                  policy.
                </li>
                <li>
                  <span className="font-semibold">Closer to departure</span> (e.g., inside
                  30 days) — trips may become partially or fully non-refundable.
                </li>
                <li>
                  <span className="font-semibold">After departure</span> — most services are
                  fully non-refundable.
                </li>
              </ul>
              <Alert variant="default" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This section is a simplified guide. The binding terms are those in your
                  confirmed itinerary, proposal, booking documents, and supplier fare/rate
                  rules.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Separator />

          {/* 5. Changes, no-shows, force majeures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                5. Changes, No-Shows &amp; Force Majeure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  <span className="font-semibold">Voluntary changes</span> (your choice to
                  change dates, destination, or services) may incur change fees, fare
                  differences, or new supplier costs.
                </li>
                <li>
                  <span className="font-semibold">No-shows</span> (failing to appear for a
                  service) are typically fully non-refundable, per supplier rules.
                </li>
                <li>
                  <span className="font-semibold">Force majeure</span> events (weather,
                  natural disasters, strikes, etc.) are handled according to supplier
                  policies; Goldsainte does not guarantee refunds in these situations.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 6. Liability & dispute handling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                6. Liability &amp; Dispute Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  Goldsainte is not responsible for the acts, errors, omissions, or
                  representations of independent travel professionals or suppliers.
                </li>
                <li>
                  Any claims relating to the delivery, quality, or execution of travel
                  services should be directed to the travel professional and/or supplier.
                </li>
                <li>
                  Goldsainte may, at its discretion, assist with coordination or
                  communication as a neutral marketplace, but this does not create or
                  expand Goldsainte&apos;s liability.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 7. What you should always do */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                7. Traveler Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>
                  Carefully review the travel professional&apos;s proposal, including any
                  cancellation, refund, and deposit terms, before accepting.
                </li>
                <li>
                  Review supplier fare rules, rate conditions, and ticket terms where
                  applicable.
                </li>
                <li>
                  Purchase comprehensive travel insurance where appropriate for your
                  destination and risk tolerance.
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 8. Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Questions or Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                If you have questions about how cancellation or refund rules apply to a
                specific booking, please contact your travel professional directly using
                the messaging tools in your account. You can also reach Goldsainte support
                for platform-related questions at:
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Email: support@goldsainte.com</li>
                <li>Or visit your &quot;My Bookings&quot; page to manage your reservations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
