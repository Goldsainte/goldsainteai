import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AmadeusConfirmationRequest {
  guestEmail: string;
  guestName: string;
  bookingReference: string;
  amadeusConfirmationNumber: string;
  bookingData: any;
  hotelName: string;
  hotelAddress: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  guests: number;
  nights: number;
  totalPrice: number;
  currency: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      guestEmail,
      guestName,
      bookingReference,
      amadeusConfirmationNumber,
      bookingData,
      hotelName,
      hotelAddress,
      checkInDate,
      checkOutDate,
      roomType,
      guests,
      nights,
      totalPrice,
      currency
    }: AmadeusConfirmationRequest = await req.json();

    console.log('📧 Sending Amadeus confirmation email to:', guestEmail);

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    const emailSubject = `✅ Hotel Booking Confirmed - ${hotelName} - ${amadeusConfirmationNumber}`;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hotel Booking Confirmed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
          .confirmation-box { background: #10b981; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
          .confirmation-number { font-size: 32px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; }
          .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #6b7280; font-size: 14px; }
          .info-value { color: #111827; font-weight: 600; text-align: right; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-title { font-weight: bold; color: #856404; margin-bottom: 8px; }
          .warning-text { color: #856404; font-size: 14px; }
          .price-box { background: #f0fdf4; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .price-total { font-size: 24px; font-weight: bold; color: #10b981; text-align: right; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          h2 { color: #111827; font-size: 20px; margin-top: 30px; margin-bottom: 15px; }
          .success-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your hotel reservation is now confirmed</p>
        </div>
        
        <div class="content">
          <div class="confirmation-box">
            <div>Amadeus Confirmation Number</div>
            <div class="confirmation-number">${amadeusConfirmationNumber}</div>
            <div style="font-size: 14px; opacity: 0.9; margin-top: 10px;">Please save this number for your records</div>
          </div>
          
          <p>Dear ${guestName},</p>
          <p>Great news! Your hotel booking has been successfully confirmed with the property. You can now look forward to your stay!</p>
          
          <h2>Booking Information</h2>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Booking Reference</span>
              <span class="info-value">${bookingReference}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Confirmation Number</span>
              <span class="info-value">${amadeusConfirmationNumber}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status</span>
              <span class="info-value"><span class="success-badge">CONFIRMED</span></span>
            </div>
          </div>
          
          <h2>Hotel Details</h2>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Property</span>
              <span class="info-value">${hotelName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address</span>
              <span class="info-value">${hotelAddress}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Room Type</span>
              <span class="info-value">${roomType}</span>
            </div>
          </div>
          
          <h2>Stay Details</h2>
          <div class="info-box">
            <div class="info-row">
              <span class="info-label">Check-in</span>
              <span class="info-value">${formatDate(checkInDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Check-out</span>
              <span class="info-value">${formatDate(checkOutDate)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duration</span>
              <span class="info-value">${nights} ${nights === 1 ? 'night' : 'nights'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Guests</span>
              <span class="info-value">${guests} ${guests === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
          
          <h2>Payment Summary</h2>
          <div class="price-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>Total Paid</span>
              <span class="price-total">${currency} ${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="warning-box">
            <div class="warning-title">📋 Important Information</div>
            <div class="warning-text">
              <strong>What to bring:</strong> Please bring a valid government-issued photo ID and the credit card used for booking.<br><br>
              <strong>Check-in time:</strong> Standard check-in is at 3:00 PM. Contact the property directly for early check-in requests.<br><br>
              <strong>Check-out time:</strong> Standard check-out is at 11:00 AM.<br><br>
              <strong>Confirmation number:</strong> Quote ${amadeusConfirmationNumber} when checking in or contacting the property.<br><br>
              <strong>Questions?</strong> Contact the property directly using your confirmation number for any special requests or questions about your stay.
            </div>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #6b7280;">Thank you for booking with us! We hope you enjoy your stay.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated confirmation email. Please do not reply to this message.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </body>
      </html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "GlobalStay <bookings@resend.dev>",
        to: [guestEmail],
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const data = await response.json();
    console.log("✅ Amadeus confirmation email sent successfully:", data.id);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-amadeus-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
