import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShieldCheck, Clock, AlertCircle, CheckCircle, XCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function CancellationRefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Cancellation & Refund Policy</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Alert className="mb-6">
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            We're committed to transparent and fair cancellation policies. Review the terms below to understand your refund eligibility based on when you cancel.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Flight Cancellations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Flight Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">24+ Hours Before Departure</p>
                    <p className="text-sm text-muted-foreground">Full refund minus $50 processing fee</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">12-24 Hours Before Departure</p>
                    <p className="text-sm text-muted-foreground">70% refund of base fare + $75 cancellation fee</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Less Than 12 Hours Before Departure</p>
                    <p className="text-sm text-muted-foreground">No refund - ticket credit valid for 1 year minus $150 fee</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <p className="font-semibold">Important Notes:</p>
                <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                  <li>Non-refundable tickets are not eligible for cash refunds</li>
                  <li>Refunds are processed to the original payment method within 7-10 business days</li>
                  <li>Airline-imposed fees may apply based on fare rules</li>
                  <li>Changes may incur fare difference charges</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Hotel Cancellations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hotel Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">48+ Hours Before Check-in</p>
                    <p className="text-sm text-muted-foreground">Full refund with no penalties</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">24-48 Hours Before Check-in</p>
                    <p className="text-sm text-muted-foreground">Charge of 1 night room rate</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Less Than 24 Hours / No-Show</p>
                    <p className="text-sm text-muted-foreground">Full booking amount charged - no refund</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <p className="font-semibold">Important Notes:</p>
                <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                  <li>Non-refundable rates cannot be cancelled for a refund</li>
                  <li>Early checkout may incur charges for unused nights</li>
                  <li>Special event dates may have stricter cancellation policies</li>
                  <li>Resort fees and taxes are non-refundable in most cases</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Package Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Package Booking Cancellation Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">30+ Days Before Travel</p>
                    <p className="text-sm text-muted-foreground">90% refund minus $100 administrative fee</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">15-29 Days Before Travel</p>
                    <p className="text-sm text-muted-foreground">50% refund of total package cost</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Less Than 15 Days Before Travel</p>
                    <p className="text-sm text-muted-foreground">No refund - package is non-refundable</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-sm space-y-2">
                <p className="font-semibold">Important Notes:</p>
                <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                  <li>Package components cannot be cancelled individually</li>
                  <li>Unused portions of packages are non-refundable</li>
                  <li>Travel insurance is highly recommended for packages</li>
                  <li>Supplier-specific fees may apply on top of our cancellation fees</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Refund Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Refund Processing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-3">
                <div>
                  <p className="font-semibold mb-1">Processing Timeline</p>
                  <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                    <li>Credit/Debit Card: 7-10 business days</li>
                    <li>PayPal: 5-7 business days</li>
                    <li>Bank Transfer: 10-14 business days</li>
                    <li>Travel Credits: Instant (credited to account immediately)</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <p className="font-semibold mb-1">Refund Methods</p>
                  <p className="text-muted-foreground">Refunds are issued to the original payment method used for booking. If the original payment method is no longer valid, please contact our support team.</p>
                </div>

                <Separator />

                <div>
                  <p className="font-semibold mb-1">Force Majeure & Special Circumstances</p>
                  <p className="text-muted-foreground">In cases of natural disasters, government travel restrictions, or medical emergencies (with documentation), we may waive cancellation fees at our discretion.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel Insurance Recommendation */}
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertDescription>
              <strong>Travel Insurance Recommended:</strong> We strongly recommend purchasing travel insurance to protect your investment. Travel insurance can cover cancellations due to illness, emergencies, and other unforeseen events.
            </AlertDescription>
          </Alert>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>If you have questions about our cancellation policy or need to cancel a booking:</p>
              <ul className="list-disc ml-5 space-y-1 text-muted-foreground">
                <li>Email: support@goldsainte.com</li>
                <li>Phone: 1-800-GOLDSAINTE (24/7 support)</li>
                <li>Live Chat: Available on our website</li>
                <li>Or visit your "My Bookings" page to manage your reservations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
