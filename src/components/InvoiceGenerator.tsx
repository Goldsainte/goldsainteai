import { useState } from "react";
import { FileText, Download, Send } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  line_items: LineItem[] | any;
  payment_terms: string;
  notes: string;
}

interface InvoiceGeneratorProps {
  jobId: string;
  customerId: string;
  agentId: string;
}

export const InvoiceGenerator = ({
  jobId,
  customerId,
  agentId,
}: InvoiceGeneratorProps) => {
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [generating, setGenerating] = useState(false);

  const generateInvoice = async () => {
    try {
      setGenerating(true);

      // Get job details
      const { data: jobData, error: jobError } = await supabase
        .from("marketplace_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      // Generate invoice number
      const { data: invoiceNumber, error: numberError } = await supabase
        .rpc("generate_invoice_number");

      if (numberError) throw numberError;

      // Calculate amounts
      const subtotal = jobData.total_paid_amount || 0;
      const taxRate = 10; // 10% tax (adjust based on region)
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Create line items
      const lineItems = [
        {
          description: `Travel Services - ${jobData.title}`,
          quantity: 1,
          unit_price: subtotal,
          total: subtotal,
        },
      ];

      // Insert invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

      const { data: newInvoice, error: invoiceError } = await supabase
        .from("marketplace_invoices")
        .insert({
          invoice_number: invoiceNumber,
          job_id: jobId,
          customer_id: customerId,
          agent_id: agentId,
          due_date: dueDate.toISOString().split("T")[0],
          status: "draft",
          subtotal,
          tax_rate: taxRate,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: jobData.currency || "USD",
          line_items: lineItems,
          payment_terms: "Net 30",
          notes: "Thank you for your business!",
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      setInvoice(newInvoice as Invoice);

      toast({
        title: "Invoice generated",
        description: `Invoice ${invoiceNumber} has been created.`,
      });
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      toast({
        title: "Failed to generate invoice",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadInvoice = () => {
    if (!invoice) return;

    // Create a simple text representation
    const content = `
INVOICE ${invoice.invoice_number}

Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

LINE ITEMS:
${invoice.line_items
  .map(
    (item: any) =>
      `${item.description} - ${invoice.currency} ${item.total.toFixed(2)}`
  )
  .join("\n")}

Subtotal: ${invoice.currency} ${invoice.subtotal.toFixed(2)}
Tax (${invoice.tax_rate}%): ${invoice.currency} ${invoice.tax_amount.toFixed(2)}
TOTAL: ${invoice.currency} ${invoice.total_amount.toFixed(2)}

Payment Terms: ${invoice.payment_terms}
Notes: ${invoice.notes}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoice.invoice_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendInvoice = async () => {
    if (!invoice) return;

    try {
      const { error } = await supabase
        .from("marketplace_invoices")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", invoice.id);

      if (error) throw error;

      toast({
        title: "Invoice sent",
        description: "The invoice has been sent to the customer.",
      });

      setInvoice({ ...invoice, status: "sent" });
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Failed to send invoice",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!invoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Professional Invoice
          </CardTitle>
          <CardDescription>
            Generate a detailed invoice with tax breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={generateInvoice} disabled={generating} className="w-full">
            {generating ? "Generating..." : "Generate Invoice"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Invoice {invoice.invoice_number}
            </CardTitle>
            <CardDescription>
              Issued on {new Date(invoice.issue_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge
            variant={
              invoice.status === "paid"
                ? "default"
                : invoice.status === "sent"
                ? "secondary"
                : "outline"
            }
          >
            {invoice.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date:</span>
            <span className="font-medium">
              {new Date(invoice.due_date).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment Terms:</span>
            <span className="font-medium">{invoice.payment_terms}</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Line Items</h4>
          {invoice.line_items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{item.description}</span>
              <span className="font-medium">
                {invoice.currency} {item.total.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span>
              {invoice.currency} {invoice.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({invoice.tax_rate}%):</span>
            <span>
              {invoice.currency} {invoice.tax_amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>
              {invoice.currency} {invoice.total_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {invoice.notes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-sm mb-1">Notes</h4>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          </>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadInvoice} className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {invoice.status === "draft" && (
            <Button onClick={sendInvoice} className="flex-1">
              <Send className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
