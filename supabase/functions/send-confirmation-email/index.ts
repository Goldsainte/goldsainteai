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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400&display=swap');
            
            body { 
              font-family: 'Lato', sans-serif; 
              line-height: 1.8; 
              color: #2C2C2C; 
              margin: 0;
              padding: 0;
              background-color: #F5F5F0;
            }
            .container { 
              max-width: 650px; 
              margin: 40px auto; 
              background: white;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #1A1F2C 0%, #2C3444 100%);
              padding: 50px 40px;
              text-align: center;
              border-top: 5px solid #C9A55B;
            }
            .logo-container {
              margin-bottom: 20px;
            }
            .logo { 
              color: #C9A55B; 
              font-family: 'Playfair Display', serif;
              font-size: 36px; 
              font-weight: 700;
              letter-spacing: 2px;
              text-transform: uppercase;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .tagline {
              color: #E5D5B7;
              font-size: 14px;
              letter-spacing: 4px;
              text-transform: uppercase;
              margin-top: 10px;
              font-weight: 300;
            }
            .header-subtitle {
              color: #E5D5B7;
              font-size: 16px;
              margin-top: 20px;
              font-weight: 300;
              letter-spacing: 1px;
            }
            .content { 
              padding: 50px 40px;
              background: white;
            }
            .greeting {
              font-family: 'Playfair Display', serif;
              font-size: 28px;
              color: #1A1F2C;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .intro-text {
              color: #5A5A5A;
              font-size: 16px;
              margin-bottom: 30px;
              line-height: 1.8;
            }
            .booking-ref { 
              background: linear-gradient(135deg, #C9A55B 0%, #B8944A 100%);
              color: white; 
              padding: 25px; 
              text-align: center; 
              font-size: 24px; 
              font-weight: 400;
              margin: 30px 0;
              border-radius: 8px;
              letter-spacing: 3px;
              box-shadow: 0 4px 15px rgba(201,165,91,0.3);
              font-family: 'Playfair Display', serif;
            }
            .booking-ref-label {
              font-size: 12px;
              letter-spacing: 2px;
              opacity: 0.9;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            .details { 
              background: #FAFAF8;
              padding: 30px; 
              margin: 30px 0;
              border-radius: 8px;
              border-left: 4px solid #C9A55B;
            }
            .section-title {
              font-family: 'Playfair Display', serif;
              color: #C9A55B;
              font-size: 20px;
              margin: 30px 0 15px 0;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .detail-item {
              padding: 12px 0;
              border-bottom: 1px solid #E5E5E0;
              display: flex;
              justify-content: space-between;
            }
            .detail-label {
              color: #5A5A5A;
              font-weight: 400;
            }
            .detail-value {
              color: #2C2C2C;
              font-weight: 400;
            }
            .price-row { 
              display: flex; 
              justify-content: space-between; 
              padding: 15px 0;
              border-bottom: 1px solid #E5E5E0;
              font-size: 15px;
            }
            .total { 
              font-size: 22px; 
              font-weight: 600;
              color: #C9A55B;
              padding: 20px 0 10px 0;
              border-top: 2px solid #C9A55B;
              margin-top: 10px;
              font-family: 'Playfair Display', serif;
            }
            .info-box {
              background: linear-gradient(135deg, #F8F6F0 0%, #FAF8F2 100%);
              padding: 25px;
              margin: 30px 0;
              border-radius: 8px;
              border: 1px solid #E5D5B7;
            }
            .info-title {
              font-family: 'Playfair Display', serif;
              color: #C9A55B;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .info-text {
              color: #5A5A5A;
              font-size: 14px;
              line-height: 1.8;
              margin: 8px 0;
            }
            .footer { 
              background: #1A1F2C;
              text-align: center; 
              padding: 40px 20px;
              color: #B8B8B8;
              font-size: 13px;
            }
            .footer-divider {
              width: 60px;
              height: 2px;
              background: #C9A55B;
              margin: 20px auto;
            }
            .signature {
              font-style: italic;
              color: #E5D5B7;
              margin-top: 30px;
              font-size: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <h1 class="logo">Goldstone</h1>
                <div class="tagline">Luxury Accommodations</div>
              </div>
              <div class="header-subtitle">Reservation Confirmation</div>
            </div>
            
            <div class="content">
              <h1 class="greeting">Welcome, ${guestName}</h1>
              <p class="intro-text">
                Thank you for choosing Goldstone. We are delighted to confirm your reservation 
                and look forward to providing you with an exceptional experience of refined luxury 
                and impeccable service.
              </p>
              
              <div class="booking-ref">
                <div class="booking-ref-label">Your Confirmation Code</div>
                ${bookingReference}
              </div>
              
              <div class="details">
                ${propertyDetails}
                
                ${specialRequests ? `
                  <h2 class="section-title">Your Special Requests</h2>
                  <p class="info-text">${specialRequests}</p>
                ` : ''}
                
                <h2 class="section-title">Investment Summary</h2>
                <div class="price-row">
                  <span class="detail-label">Accommodation</span>
                  <span class="detail-value">${currency} ${subtotal.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span class="detail-label">Tax & VAT</span>
                  <span class="detail-value">${currency} ${tax.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span class="detail-label">Service Excellence Fee</span>
                  <span class="detail-value">${currency} ${serviceFee.toFixed(2)}</span>
                </div>
                <div class="price-row total">
                  <span>Total Investment</span>
                  <span>${currency} ${totalPrice.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="info-box">
                <div class="info-title">Essential Information</div>
                <div class="info-text">• Please present a valid identification document and this confirmation upon arrival</div>
                <div class="info-text">• Check-in: 3:00 PM | Check-out: 11:00 AM</div>
                <div class="info-text">• Early check-in and late check-out available upon request</div>
                <div class="info-text">• For modifications or inquiries, reference your confirmation code</div>
                <div class="info-text">• Complimentary concierge services available 24/7</div>
              </div>
              
              <p class="intro-text">
                Should you require any assistance or have special arrangements in mind, 
                our dedicated concierge team is at your service around the clock.
              </p>
              
              <p class="signature">
                With warm regards,<br>
                The Goldstone Team
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; color: #E5D5B7;">GOLDSTONE LUXURY ACCOMMODATIONS</p>
              <div class="footer-divider"></div>
              <p style="margin: 5px 0;">This is an automated confirmation. Please retain for your records.</p>
              <p style="margin: 20px 0 0 0; font-size: 11px;">&copy; 2025 Goldstone Suites. All rights reserved.</p>
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
