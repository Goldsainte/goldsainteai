import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  guestEmail: string;
  guestName: string;
  bookingReference: string;
  bookingType: string;
  bookingData: any;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice: number;
  currency: string;
  specialRequests?: string;
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
      bookingType,
      bookingData,
      checkInDate,
      checkOutDate,
      totalPrice,
      currency,
      specialRequests
    }: ConfirmationEmailRequest = await req.json();

    console.log('Sending confirmation email to:', guestEmail);

    // Calculate breakdown
    const subtotal = totalPrice / 1.15; // Reverse calculate from total
    const tax = subtotal * 0.10;
    const serviceFee = subtotal * 0.05;

    // Build hotel/property details
    let propertyDetails = '';
    if (bookingType === 'hotel') {
      const hotelName = bookingData.hotel?.name || 'Hotel';
      const roomType = bookingData.room?.description?.text || 'Standard Room';
      const bedType = bookingData.room?.typeEstimated?.bedType || 'Not specified';
      
      propertyDetails = `
        <h2 style="color: #C9A55B; margin-top: 20px;">Hotel Details</h2>
        <p><strong>Property:</strong> ${hotelName}</p>
        <p><strong>Room Type:</strong> ${roomType}</p>
        <p><strong>Bed Type:</strong> ${bedType}</p>
        <p><strong>Check-in:</strong> ${checkInDate || 'TBD'}</p>
        <p><strong>Check-out:</strong> ${checkOutDate || 'TBD'}</p>
      `;
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1A1F2C; color: white; padding: 30px; text-align: center; }
            .logo { color: #C9A55B; font-size: 24px; font-weight: bold; }
            .content { background-color: #f9f9f9; padding: 30px; }
            .booking-ref { background-color: #C9A55B; color: white; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
            .details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .price-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 18px; font-weight: bold; color: #C9A55B; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Goldstone Suites</div>
              <p>Booking Confirmation</p>
            </div>
            
            <div class="content">
              <h1 style="color: #1A1F2C;">Thank you for your booking, ${guestName}!</h1>
              <p>Your reservation has been confirmed. Please find your booking details below:</p>
              
              <div class="booking-ref">
                Booking Reference: ${bookingReference}
              </div>
              
              <div class="details">
                ${propertyDetails}
                
                ${specialRequests ? `
                  <h2 style="color: #C9A55B; margin-top: 20px;">Special Requests</h2>
                  <p>${specialRequests}</p>
                ` : ''}
                
                <h2 style="color: #C9A55B; margin-top: 20px;">Price Breakdown</h2>
                <div class="price-row">
                  <span>Subtotal:</span>
                  <span>${currency} ${subtotal.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Tax (10%):</span>
                  <span>${currency} ${tax.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Service Fee (5%):</span>
                  <span>${currency} ${serviceFee.toFixed(2)}</span>
                </div>
                <div class="price-row total">
                  <span>Total:</span>
                  <span>${currency} ${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <p style="margin-top: 20px;">
                <strong>Important Information:</strong><br>
                - Please bring a valid ID and this confirmation email at check-in<br>
                - Check-in time: 3:00 PM<br>
                - Check-out time: 11:00 AM<br>
                - For any changes or cancellations, please contact us with your booking reference
              </p>
              
              <p>If you have any questions, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this message.</p>
              <p>&copy; 2025 Goldstone Suites. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Goldstone Suites <onboarding@resend.dev>",
        to: [guestEmail],
        subject: `Booking Confirmed - ${bookingReference}`,
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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
