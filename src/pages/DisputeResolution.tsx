import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Scale, Users, AlertCircle } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

const disputeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bookingReference: z.string().optional(),
  disputeType: z.enum(["informal", "mediation", "arbitration", "other"]),
  description: z.string().min(50, "Description must be at least 50 characters").max(2000, "Description must not exceed 2000 characters"),
  preferredContactMethod: z.enum(["email", "phone"]).default("email"),
});

type DisputeFormValues = z.infer<typeof disputeSchema>;

const DisputeResolution = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      preferredContactMethod: "email",
      disputeType: "informal",
    },
  });

  const onSubmit = async (values: DisputeFormValues) => {
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("submit-dispute", {
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone || null,
          bookingReference: values.bookingReference || null,
          disputeType: values.disputeType,
          description: values.description,
          preferredContactMethod: values.preferredContactMethod,
        },
      });

      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      toast({
        title: "Dispute Submitted",
        description: "Your dispute has been submitted successfully. We will review it within 30 days.",
      });

      form.reset();
      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.error("Error submitting dispute:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your dispute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <BackButton className="mb-6" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Dispute Resolution</h1>
        <p className="text-muted-foreground text-lg">
          We are committed to resolving any disputes fairly and efficiently. Please use the form below to submit your dispute.
        </p>
        <div className="mt-4 rounded-xl border border-[#E5DFC6] bg-[#F5F0E0]/50 p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-[#0a2225]">
            <strong>Have an existing booking issue?</strong> You can file a dispute directly from your booking details page for faster resolution.
          </p>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <a href="/my-bookings">My Bookings</a>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Dispute</CardTitle>
              <CardDescription>
                Fill out this form to initiate the dispute resolution process. We will respond within 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bookingReference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Reference</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., BK123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="disputeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dispute Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select dispute type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="informal">Informal Resolution Request</SelectItem>
                            <SelectItem value="mediation">Mediation Request</SelectItem>
                            <SelectItem value="arbitration">Arbitration Request</SelectItem>
                            <SelectItem value="other">General Inquiry</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Detailed Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please provide a detailed description of your dispute, including relevant dates, amounts, and any other pertinent information..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {field.value?.length || 0} / 2000 characters (minimum 50)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredContactMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Contact Method *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contact method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Dispute"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Process Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-semibold mb-1">1. Informal Resolution</p>
                <p className="text-muted-foreground">We review your case within 30 days</p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Mediation</p>
                <p className="text-muted-foreground">Neutral third-party facilitation if needed</p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Arbitration</p>
                <p className="text-muted-foreground">Binding resolution through AAA</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold">Goldsainte Ai / Goldsainte Inc.</p>
              <p className="text-muted-foreground">
                850 New Burton Road, Suite 201<br />
                Dover, DE 19904<br />
                County of Kent, USA
              </p>
              <p className="text-muted-foreground">
                Email: support@goldsainte.com
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Dispute Resolution Text */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Dispute Resolution Policy</CardTitle>
            <CardDescription>
              Complete terms and conditions for dispute resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="overview">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">A. Overview</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>
                    Goldsainte Ai / Inc. strives to provide seamless booking experiences. However, in the event of a disagreement, dispute, or claim arising out of or relating to your use of our Platform, services, or the Travel Experience itself ("Dispute"), this section explains how such matters will be resolved.
                  </p>
                  <p>
                    By using Goldsainte Ai / Inc., you agree to resolve disputes according to the terms outlined below.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="informal">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">B. Informal Resolution</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>Before initiating formal legal action, you agree to:</p>
                  <ul>
                    <li>Contact Goldsainte Ai / Inc. Customer Support promptly via your account, app, or Help Center.</li>
                    <li>
                      Provide relevant details, including:
                      <ul>
                        <li>Booking reference or confirmation number</li>
                        <li>Your contact information</li>
                        <li>A clear summary of the issue</li>
                        <li>Any supporting documentation (photos, receipts, emails, bank statements)</li>
                      </ul>
                    </li>
                    <li>Allow us 30 days to review and attempt to resolve the issue informally.</li>
                  </ul>
                  <p>Most disputes are resolved at this stage without further escalation.</p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="mediation">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">C. Mediation</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>If a dispute cannot be resolved informally, you and Goldsainte Ai / Inc. agree to attempt mediation before pursuing arbitration or litigation:</p>
                  <ul>
                    <li>Either party may initiate mediation by providing written notice to the other party.</li>
                    <li>A mutually agreed-upon, neutral third-party mediator will facilitate the process.</li>
                    <li>Mediation sessions will take place virtually or in-person in Dover, Delaware, USA, unless otherwise agreed.</li>
                    <li>Both parties must participate in good faith.</li>
                    <li>Costs of mediation are shared equally unless otherwise agreed.</li>
                    <li>If mediation does not resolve the dispute within 60 days, either party may proceed to arbitration.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="arbitration">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">D. Arbitration</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>All disputes that cannot be resolved through informal resolution or mediation will be resolved through binding arbitration:</p>
                  <ul>
                    <li><strong>Arbitration Rules:</strong> The arbitration will be conducted under the rules of the American Arbitration Association (AAA) or another mutually agreed arbitration body.</li>
                    <li><strong>Location:</strong> Arbitration will take place in Dover, Delaware, USA, unless both parties agree otherwise.</li>
                    <li><strong>Arbitrator:</strong> A single neutral arbitrator with relevant experience in travel and online services disputes will be appointed.</li>
                    <li><strong>Decision:</strong> The arbitrator's decision will be final, binding, and enforceable in any court of competent jurisdiction.</li>
                    <li><strong>Costs:</strong> Each party bears its own costs, including attorney's fees, unless the arbitrator determines otherwise.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="exceptions">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">E. Exceptions</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>Arbitration does not prevent either party from:</p>
                  <ul>
                    <li>Seeking urgent injunctive or equitable relief in a court of competent jurisdiction.</li>
                    <li>Filing claims in small claims court for amounts within the applicable jurisdictional limit.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="waiver">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">F. Class Action Waiver</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>
                    You and Goldsainte Ai / Inc. agree that all disputes must be resolved individually, and not as a class or consolidated action.
                  </p>
                  <p>
                    Any arbitration or legal proceeding will apply only to you and us, and not to any other user or third party.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="jurisdiction">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">G. Governing Law and Jurisdiction</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>
                    This Dispute Resolution section is governed by the laws of the State of Delaware, USA, without regard to its conflict of law rules.
                  </p>
                  <p>
                    Any court with jurisdiction in Kent County, Delaware may enforce arbitration awards or hear matters excluded from arbitration.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="severability">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">H. Severability</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>
                    If any provision of this Dispute Resolution section is found invalid or unenforceable, the remaining provisions remain fully in effect.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="contact">
                <AccordionTrigger className="text-xl font-semibold hover:no-underline">I. Contact for Disputes</AccordionTrigger>
                <AccordionContent className="prose prose-sm max-w-none">
                  <p>For any dispute or claim, contact:</p>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold">Goldsainte Ai / Goldsainte Inc.</p>
                    <p>850 New Burton Road, Suite 201</p>
                    <p>Dover, DE, 19904, County of Kent, USA</p>
                    <p>Email: support@goldsainte.com</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DisputeResolution;
