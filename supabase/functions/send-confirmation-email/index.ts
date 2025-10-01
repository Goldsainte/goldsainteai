import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  guestEmail?: string;
  guestName?: string;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  bookingReference: string;
  bookingType: string;
  bookingData: any;
  checkInDate?: string;
  checkOutDate?: string;
  totalPrice: number;
  currency: string;
  specialRequests?: string;
}

const formatTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
};

const formatDate = (dateTime: string) => {
  return new Date(dateTime).toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

const getDuration = (duration: string) => {
  return duration.replace('PT', '').replace('H', 'h ').replace('M', 'm');
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      guestEmail: legacyGuestEmail,
      guestName: legacyGuestName,
      guestInfo,
      bookingReference,
      bookingType,
      bookingData,
      checkInDate,
      checkOutDate,
      totalPrice,
      currency,
      specialRequests
    }: ConfirmationEmailRequest = await req.json();

    // Support both old and new format
    const guestEmail = guestInfo?.email || legacyGuestEmail;
    const guestName = guestInfo ? `${guestInfo.firstName} ${guestInfo.lastName}` : legacyGuestName;

    console.log('Sending confirmation email to:', guestEmail, 'Type:', bookingType);

    // Build booking details based on type
    let bookingDetails = '';
    let emailSubject = '';
    
    if (bookingType === 'hotel') {
      const hotelName = bookingData.hotel?.name || bookingData.hotelName || 'Hotel';
      const roomType = bookingData.room?.description?.text || bookingData.roomType || 'Standard Room';
      const bedType = bookingData.room?.typeEstimated?.bedType || bookingData.bedType || 'Not specified';
      
      emailSubject = `Hotel Booking Confirmed - ${hotelName}`;
      
      bookingDetails = `
        <div class="section-title">Hotel Details</div>
        <div class="detail-item">
          <span class="detail-label">Property</span>
          <span class="detail-value">${hotelName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Room Type</span>
          <span class="detail-value">${roomType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Bed Type</span>
          <span class="detail-value">${bedType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Check-in</span>
          <span class="detail-value">${checkInDate || 'TBD'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Check-out</span>
          <span class="detail-value">${checkOutDate || 'TBD'}</span>
        </div>
      `;
    } else if (bookingType === 'flight') {
      const flightOffer = bookingData.flight_offer || bookingData.flightOffer;
      const passengers = bookingData.passengers || [];
      
      if (flightOffer) {
        const firstSegment = flightOffer.itineraries?.[0]?.segments?.[0];
        const lastSegment = flightOffer.itineraries?.[0]?.segments?.slice(-1)[0];
        const returnItinerary = flightOffer.itineraries?.[1];
        
        const origin = firstSegment?.departure?.iataCode || 'N/A';
        const destination = lastSegment?.arrival?.iataCode || 'N/A';
        const departureTime = firstSegment?.departure?.at;
        const arrivalTime = lastSegment?.arrival?.at;
        const duration = flightOffer.itineraries?.[0]?.duration || 'N/A';
        const stops = flightOffer.itineraries?.[0]?.segments?.length - 1 || 0;
        const airline = firstSegment?.carrierCode || 'N/A';
        
        emailSubject = `Flight Confirmed - ${origin} to ${destination}`;
        
        // Build outbound flight details
        let outboundSegments = '';
        flightOffer.itineraries[0].segments.forEach((segment: any, index: number) => {
          outboundSegments += `
            <div style="background: #F8F6F0; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #C9A55B;">
              <div style="font-weight: 600; color: #C9A55B; margin-bottom: 8px;">
                ${index === 0 ? '✈ Departure' : `Connection ${index}`}
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                <div>
                  <div style="color: #5A5A5A; font-size: 12px;">From</div>
                  <div style="font-weight: 600;">${segment.departure.iataCode}</div>
                  <div style="font-size: 13px;">${formatDate(segment.departure.at)}</div>
                  <div style="font-size: 13px; color: #C9A55B;">${formatTime(segment.departure.at)}</div>
                </div>
                <div>
                  <div style="color: #5A5A5A; font-size: 12px;">To</div>
                  <div style="font-weight: 600;">${segment.arrival.iataCode}</div>
                  <div style="font-size: 13px;">${formatDate(segment.arrival.at)}</div>
                  <div style="font-size: 13px; color: #C9A55B;">${formatTime(segment.arrival.at)}</div>
                </div>
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E5E0; font-size: 13px; color: #5A5A5A;">
                Flight ${segment.carrierCode}${segment.number} • Aircraft ${segment.aircraft?.code || 'N/A'} • Duration ${getDuration(segment.duration)}
              </div>
            </div>
          `;
        });
        
        // Build return flight details if exists
        let returnSegments = '';
        if (returnItinerary) {
          returnItinerary.segments.forEach((segment: any, index: number) => {
            returnSegments += `
              <div style="background: #F8F6F0; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #C9A55B;">
                <div style="font-weight: 600; color: #C9A55B; margin-bottom: 8px;">
                  ${index === 0 ? '✈ Return Departure' : `Connection ${index}`}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                  <div>
                    <div style="color: #5A5A5A; font-size: 12px;">From</div>
                    <div style="font-weight: 600;">${segment.departure.iataCode}</div>
                    <div style="font-size: 13px;">${formatDate(segment.departure.at)}</div>
                    <div style="font-size: 13px; color: #C9A55B;">${formatTime(segment.departure.at)}</div>
                  </div>
                  <div>
                    <div style="color: #5A5A5A; font-size: 12px;">To</div>
                    <div style="font-weight: 600;">${segment.arrival.iataCode}</div>
                    <div style="font-size: 13px;">${formatDate(segment.arrival.at)}</div>
                    <div style="font-size: 13px; color: #C9A55B;">${formatTime(segment.arrival.at)}</div>
                  </div>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E5E0; font-size: 13px; color: #5A5A5A;">
                  Flight ${segment.carrierCode}${segment.number} • Aircraft ${segment.aircraft?.code || 'N/A'} • Duration ${getDuration(segment.duration)}
                </div>
              </div>
            `;
          });
        }
        
        // Build passenger list
        let passengerList = '';
        passengers.forEach((passenger: any, index: number) => {
          passengerList += `
            <div class="detail-item">
              <span class="detail-label">Passenger ${index + 1}</span>
              <span class="detail-value">${passenger.firstName} ${passenger.lastName}</span>
            </div>
          `;
        });
        
        bookingDetails = `
          <div class="section-title">Flight Itinerary</div>
          <div class="detail-item">
            <span class="detail-label">Route</span>
            <span class="detail-value" style="font-weight: 600; color: #C9A55B;">${origin} → ${destination}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Airline</span>
            <span class="detail-value">${airline}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total Duration</span>
            <span class="detail-value">${getDuration(duration)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Stops</span>
            <span class="detail-value">${stops === 0 ? 'Direct Flight' : `${stops} stop(s)`}</span>
          </div>
          
          <div style="margin-top: 25px;">
            <div style="font-family: 'Playfair Display', serif; color: #1A1F2C; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
              Outbound Journey
            </div>
            ${outboundSegments}
          </div>
          
          ${returnSegments ? `
            <div style="margin-top: 25px;">
              <div style="font-family: 'Playfair Display', serif; color: #1A1F2C; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                Return Journey
              </div>
              ${returnSegments}
            </div>
          ` : ''}
          
          <div style="margin-top: 25px;">
            <div class="section-title">Travelers</div>
            ${passengerList}
          </div>
        `;
      }
    } else if (bookingType === 'restaurant') {
      const restaurantName = bookingData.restaurantName || 'Restaurant';
      const restaurantAddress = bookingData.restaurantAddress || '';
      const date = bookingData.date || 'TBD';
      const time = bookingData.time || 'TBD';
      const guests = bookingData.guests || 1;
      
      emailSubject = `Reservation Confirmed - ${restaurantName}`;
      
      bookingDetails = `
        <div class="section-title">Restaurant Reservation</div>
        <div class="detail-item">
          <span class="detail-label">Restaurant</span>
          <span class="detail-value">${restaurantName}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${restaurantAddress}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Date</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Time</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Party Size</span>
          <span class="detail-value">${guests} ${guests === 1 ? 'guest' : 'guests'}</span>
        </div>
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
              text-align: right;
            }
            .total-price { 
              font-size: 28px; 
              font-weight: 700;
              color: #C9A55B;
              text-align: center;
              padding: 30px;
              margin: 30px 0;
              background: linear-gradient(135deg, #F8F6F0 0%, #FAF8F2 100%);
              border-radius: 8px;
              border: 2px solid #C9A55B;
              font-family: 'Playfair Display', serif;
            }
            .total-label {
              font-size: 14px;
              letter-spacing: 2px;
              color: #5A5A5A;
              margin-bottom: 10px;
              text-transform: uppercase;
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
                <div class="tagline">Luxury Travel</div>
              </div>
              <div class="header-subtitle">Booking Confirmation</div>
            </div>
            
            <div class="content">
              <h1 class="greeting">Welcome, ${guestName}</h1>
              <p class="intro-text">
                Thank you for choosing Goldstone. We are delighted to confirm your reservation 
                and look forward to providing you with an exceptional travel experience.
              </p>
              
              <div class="booking-ref">
                <div class="booking-ref-label">Your Confirmation Code</div>
                ${bookingReference}
              </div>
              
              <div class="details">
                ${bookingDetails}
                
                ${specialRequests ? `
                  <div class="section-title">Your Special Requests</div>
                  <p class="info-text">${specialRequests}</p>
                ` : ''}
              </div>
              
              ${totalPrice > 0 ? `
                <div class="total-price">
                  <div class="total-label">Total Amount</div>
                  ${currency} ${totalPrice.toFixed(2)}
                </div>
              ` : ''}
              
              <div class="info-box">
                <div class="info-title">Important Information</div>
                <div class="info-text">• Please keep this confirmation code for your records</div>
                <div class="info-text">• Present this confirmation upon arrival or check-in</div>
                <div class="info-text">• For any changes or inquiries, reference your confirmation code</div>
                <div class="info-text">• Our concierge team is available 24/7 to assist you</div>
                <div class="info-text">• Ensure all travel documents are valid and up to date</div>
              </div>
              
              <p class="intro-text">
                Should you require any assistance, our dedicated team is at your service.
                We look forward to making your journey unforgettable.
              </p>
              
              <p class="signature">
                With warm regards,<br>
                The Goldstone Team
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0; color: #E5D5B7;">GOLDSTONE LUXURY TRAVEL</p>
              <div class="footer-divider"></div>
              <p style="margin: 5px 0;">This is an automated confirmation. Please retain for your records.</p>
              <p style="margin: 20px 0 0 0; font-size: 11px;">&copy; 2025 Goldstone. All rights reserved.</p>
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
        from: "Goldstone Travel <onboarding@resend.dev>",
        to: [guestEmail],
        subject: emailSubject || `Booking Confirmed - ${bookingReference}`,
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
