// Supabase Edge Function: send-contract-notification
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "https://goldsainte.ai",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ContractNotificationRequest = {
  contractId: string;
  tripId: string;
  recipientEmail: string;
  recipientType: "traveler" | "creator";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, tripId, recipientEmail, recipientType }: ContractNotificationRequest = await req.json();

    if (!contractId || !tripId || !recipientEmail || !recipientType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: contractId, tripId, recipientEmail, recipientType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Load contract and trip details
    const { data: contract, error: contractError } = await supabase
      .from("trip_contracts")
      .select(`
        *,
        trips(
          id,
          destination,
          start_date,
          end_date,
          budget_max
        ),
        agent:profiles!trip_contracts_agent_id_fkey(
          full_name,
          email
        )
      `)
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      console.error("Contract not found:", contractError);
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signing link
    const APP_URL = Deno.env.get("APP_URL") || "https://goldsainte.com";
    const signingLink = `${APP_URL}/contract/${contractId}/sign?type=${recipientType}`;

    // Get recipient name based on type
    const recipientName = recipientType === "traveler" 
      ? `${contract.traveler_info.firstName} ${contract.traveler_info.lastName}`
      : "Creator";

    // Email subject
    const emailSubject = `Goldsainte Trip Contract - ${contract.trips.destination}`;

    // Email HTML template
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0a2225 0%, #0c4d47 100%); padding: 40px 20px; text-align: center;">
            <div style="font-family: Georgia, serif; font-size: 32px; font-weight: 600; color: #BFAD72; margin-bottom: 10px;">
              G
            </div>
            <h1 style="color: #E5DFC6; font-size: 24px; margin: 0; font-weight: 400;">
              Goldsainte
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #0a2225; font-family: Georgia, serif; font-size: 28px; margin-bottom: 20px;">
              Review & Sign Your Trip Contract
            </h2>
            
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 20px;">
              Hello ${recipientName},
            </p>
            
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 30px;">
              Your travel agent has prepared a comprehensive service agreement for your upcoming trip to <strong>${contract.trips.destination}</strong>.
            </p>
            
            <!-- Trip Details Card -->
            <div style="background: #f7f3ea; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #BFAD72;">
              <h3 style="color: #0a2225; font-size: 18px; margin-top: 0; margin-bottom: 20px;">Trip Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #8D8D8D; font-size: 14px;">Destination:</td>
                  <td style="padding: 8px 0; color: #0a2225; font-weight: 500; text-align: right;">${contract.trips.destination}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8D8D8D; font-size: 14px;">Dates:</td>
                  <td style="padding: 8px 0; color: #0a2225; font-weight: 500; text-align: right;">
                    ${new Date(contract.trip_info.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - 
                    ${new Date(contract.trip_info.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8D8D8D; font-size: 14px;">Duration:</td>
                  <td style="padding: 8px 0; color: #0a2225; font-weight: 500; text-align: right;">${contract.trip_info.duration} days</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #8D8D8D; font-size: 14px;">Total Cost:</td>
                  <td style="padding: 8px 0; color: #0a2225; font-weight: 600; font-size: 16px; text-align: right;">$${parseFloat(contract.trip_info.totalCost).toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 30px;">
              Please review the contract carefully. It includes important information about payment terms, cancellation policies, and your responsibilities as a ${recipientType}.
            </p>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${signingLink}" style="display: inline-block; background: linear-gradient(135deg, #0c4d47 0%, #BFAD72 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 30px; font-weight: 500; font-size: 16px;">
                Review & Sign Contract →
              </a>
            </div>

            <!-- Important Notice -->
            <div style="background: #fff9e6; border: 1px solid #ffd700; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <p style="margin: 0; color: #8B7500; font-size: 14px; line-height: 1.6;">
                <strong>⚠️ Important:</strong> This link is unique to you and will expire in 30 days. Your electronic signature is legally binding and equivalent to a handwritten signature.
              </p>
            </div>

            <!-- Support -->
            <p style="color: #8D8D8D; font-size: 13px; line-height: 1.6; margin-top: 30px;">
              If you have any questions about the contract terms, please contact your travel agent <strong>${contract.agent.full_name}</strong> directly through the Goldsainte platform.
            </p>
          </div>

          <!-- Footer -->
          <div style="background: #f7f3ea; padding: 30px; text-align: center; border-top: 1px solid #E5DFC6;">
            <p style="color: #8D8D8D; font-size: 12px; margin: 0 0 10px 0;">
              <strong style="color: #0a2225;">Goldsainte AI</strong><br>
              Luxury Travel, Beautifully Orchestrated
            </p>
            <p style="color: #8D8D8D; font-size: 11px; margin: 0;">
              © ${new Date().getFullYear()} Goldsainte. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email via Resend (or your email service)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set, logging email instead");
      console.log("Would send email to:", recipientEmail);
      console.log("Signing link:", signingLink);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email logged (RESEND_API_KEY not configured)",
          signingLink 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Goldsainte Contracts <contracts@goldsainte.com>",
        to: recipientEmail,
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email send error:", errorText);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Contract notification sent successfully",
        emailId: emailData.id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error sending contract notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send contract notification",
        details: error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

export type { ContractNotificationRequest };
