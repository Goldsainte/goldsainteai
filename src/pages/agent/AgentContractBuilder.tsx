import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Send, FileText, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SignaturePad from "react-signature-canvas";

type ContractSection = {
  id: string;
  title: string;
  content: string;
  fields?: { name: string; value: string; required?: boolean }[];
};

export default function AgentContractBuilder() {
  const { tripId } = useParams<{ tripId: string }>();
  const [searchParams] = useSearchParams();
  const linkedBookingId = searchParams.get("bookingId");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tripData, setTripData] = useState<any>(null);
  const [travelerData, setTravelerData] = useState<any>(null);
  const [agentSignature, setAgentSignature] = useState<string>("");
  const [contractId, setContractId] = useState<string | null>(null);
  
  const [sections] = useState<ContractSection[]>([
    {
      id: "parties",
      title: "Parties to the Agreement",
      content: "This Travel Services Agreement is entered into between the Agent and the Traveler.",
      fields: [
        { name: "agentName", value: "", required: true },
        { name: "agentAgency", value: "", required: true },
        { name: "agentLicense", value: "", required: false },
      ],
    },
    {
      id: "services",
      title: "Services Provided",
      content: "The Agent agrees to provide comprehensive travel planning and booking services including but not limited to:",
      fields: [
        { name: "servicesDescription", value: "Flight arrangements, hotel accommodations, activities booking, transportation coordination", required: true },
      ],
    },
    {
      id: "payment",
      title: "Payment Terms",
      content: "Payment schedule and terms for the services provided.",
      fields: [
        { name: "totalCost", value: "", required: true },
        { name: "depositAmount", value: "", required: true },
        { name: "depositDueDate", value: "", required: true },
        { name: "finalPaymentDate", value: "", required: true },
      ],
    },
    {
      id: "cancellation",
      title: "Cancellation Policy",
      content: "Terms and conditions for cancellation by either party.",
      fields: [
        { name: "cancellationTerms", value: "90+ days: full refund minus $500 admin fee. 60-89 days: 50% refund. 30-59 days: 25% refund. Less than 30 days: no refund.", required: true },
      ],
    },
    {
      id: "liability",
      title: "Liability and Insurance",
      content: "The Agent recommends travel insurance and limits liability as follows:",
      fields: [
        { name: "insuranceRecommendation", value: "Travel insurance strongly recommended", required: true },
        { name: "liabilityLimit", value: "Agent liability limited to total amount paid for services", required: true },
      ],
    },
    {
      id: "modifications",
      title: "Trip Modifications",
      content: "Terms for changes to the itinerary after booking.",
      fields: [
        { name: "modificationPolicy", value: "Changes subject to supplier penalties and $150 modification fee per change", required: true },
      ],
    },
    {
      id: "force_majeure",
      title: "Force Majeure",
      content: "Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control.",
      fields: [],
    },
    {
      id: "dispute_resolution",
      title: "Dispute Resolution",
      content: "Any disputes shall be resolved through mediation before legal action.",
      fields: [
        { name: "governingLaw", value: "This agreement shall be governed by the laws of [State/Country]", required: true },
      ],
    },
    {
      id: "data_privacy",
      title: "Data Privacy",
      content: "Personal information will be used solely for trip planning and in accordance with applicable privacy laws.",
      fields: [],
    },
    {
      id: "responsibilities",
      title: "Traveler Responsibilities",
      content: "The Traveler agrees to:",
      fields: [
        { name: "travelerDuties", value: "Provide accurate information, obtain necessary travel documents, arrive on time for bookings, comply with supplier terms", required: true },
      ],
    },
  ]);
  
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTripData();
  }, [tripId]);

  async function loadTripData() {
    if (!tripId) return;
    
    try {
      setLoading(true);
      
      // Load trip details
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*, profiles!trips_traveler_id_fkey(full_name, email, id)")
        .eq("id", tripId)
        .single();
      
      if (tripError) throw tripError;
      
      setTripData(trip);
      setTravelerData(trip.profiles);
      
      // Check if contract already exists
      const { data: existingContract } = await supabase
        .from("trip_contracts")
        .select("*")
        .eq("trip_id", tripId)
        .maybeSingle();
      
      if (existingContract) {
        setContractId(existingContract.id);
        const savedValues = existingContract.field_values as Record<string, string> | null;
        setFieldValues(savedValues || {});
        if (existingContract.agent_signature) {
          setAgentSignature(existingContract.agent_signature);
        }
      } else {
        // Pre-fill with trip data
        const budgetStr = trip.budget_range?.match(/\d+/)?.[0] || "5000";
        const budget = parseFloat(budgetStr);
        setFieldValues({
          totalCost: budget.toString(),
          depositAmount: (budget * 0.25).toString(),
        });
      }
    } catch (error) {
      console.error("Error loading trip:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load trip details",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDraft() {
    if (!tripId || !tripData || !travelerData) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const contractData = {
        trip_id: tripId,
        agent_id: user.id,
        traveler_id: travelerData.id,
        contract_sections: sections,
        traveler_info: {
          firstName: travelerData.full_name?.split(" ")[0] || "",
          lastName: travelerData.full_name?.split(" ").slice(1).join(" ") || "",
          email: travelerData.email,
        },
        trip_info: {
          destination: tripData.destination,
          startDate: tripData.start_date,
          endDate: tripData.end_date,
          duration: tripData.duration_days,
          totalCost: fieldValues.totalCost,
        },
        field_values: fieldValues,
        agent_signature: agentSignature || null,
        status: "draft",
      };
      if (linkedBookingId) {
        (contractData as any).booking_id = linkedBookingId;
      }

      if (contractId) {
        const { error } = await supabase
          .from("trip_contracts")
          .update(contractData)
          .eq("id", contractId);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("trip_contracts")
          .insert(contractData)
          .select()
          .single();
        
        if (error) throw error;
        if (data) setContractId(data.id);
      }
      
      toast({
        title: "Draft Saved",
        description: "Your contract draft has been saved",
      });
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save draft",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendToTraveler() {
    if (!agentSignature) {
      toast({
        variant: "destructive",
        title: "Signature Required",
        description: "Please sign the contract before sending",
      });
      return;
    }
    
    await handleSaveDraft();
    
    if (!contractId || !travelerData?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot send contract without saving first",
      });
      return;
    }
    
    try {
      // Update status to pending_signatures
      const { error: updateError } = await supabase
        .from("trip_contracts")
        .update({ 
          status: "pending_signatures",
          agent_signed_at: new Date().toISOString(),
        })
        .eq("id", contractId);
      
      if (updateError) throw updateError;
      
      // Send notification email
      const { error: emailError } = await supabase.functions.invoke("send-contract-notification", {
        body: {
          contractId,
          tripId,
          recipientEmail: travelerData.email,
          recipientType: "traveler",
        },
      });
      
      if (emailError) throw emailError;

      // Auto-DM the traveler a signing link (non-fatal if it fails)
      try {
        const signLink = `${window.location.origin}/contract/${contractId}/sign?type=traveler`;
        await supabase.functions.invoke("send-direct-message", {
          body: {
            recipientId: travelerData.id,
            message: `I've prepared your trip contract${tripData?.destination ? ` for ${tripData.destination}` : ""}. Please review and sign here: ${signLink}`,
            tripTitle: tripData?.title || tripData?.destination || "Trip contract",
          },
        });
      } catch (dmErr) {
        console.error("Contract DM failed (non-fatal):", dmErr);
      }

      toast({
        title: "Contract Sent",
        description: "The contract has been sent to the traveler for signature",
      });
      
      navigate("/agent-dashboard");
    } catch (error: any) {
      console.error("Error sending contract:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send contract",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading contract builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Trip Service Agreement</h1>
              <p className="text-muted-foreground">
                {tripData?.destination} • {tripData?.start_date && new Date(tripData.start_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={saving}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                onClick={handleSendToTraveler}
                disabled={saving || !agentSignature}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Send to Traveler
              </Button>
            </div>
          </div>
        </div>

        {/* Contract Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {index + 1}. {section.title}
                </CardTitle>
                <CardDescription>{section.content}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields?.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.name.includes("Description") || field.name.includes("Terms") || field.name.includes("Policy") || field.name.includes("Duties") ? (
                      <Textarea
                        id={field.name}
                        value={fieldValues[field.name] || field.value}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.name}
                        value={fieldValues[field.name] || field.value}
                        onChange={(e) => setFieldValues({ ...fieldValues, [field.name]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Agent Signature */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Agent Signature</CardTitle>
              <CardDescription>
                By signing below, you confirm that all information is accurate and you agree to the terms.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-4">
                {agentSignature ? (
                  <div className="space-y-2">
                    <img src={agentSignature} alt="Signature" className="max-h-32" loading="lazy"/>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAgentSignature("")}
                    >
                      Clear Signature
                    </Button>
                  </div>
                ) : (
                  <SignaturePad
                    canvasProps={{
                      className: "w-full h-32 bg-muted rounded",
                    }}
                    onEnd={(pad: any) => {
                      setAgentSignature(pad.toDataURL());
                    }}
                  />
                )}
              </div>
              {agentSignature && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Signed
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
