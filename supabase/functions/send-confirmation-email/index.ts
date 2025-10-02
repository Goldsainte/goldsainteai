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
      const selectedSeats = bookingData.selected_seats || [];
      const selectedBaggage = bookingData.selected_baggage || [];
      const fees = bookingData.fees || {};
      
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
        
        emailSubject = `Flight Confirmed - ${origin} to ${destination} - Confirmation ${bookingReference}`;
        
        // Build outbound flight segments
        let outboundSegments = '';
        flightOffer.itineraries[0].segments.forEach((segment: any) => {
          outboundSegments += `
            <div class="flight-segment">
              <div class="segment-header">${segment.carrierCode} ${segment.number} • ${segment.aircraft?.code || 'N/A'}</div>
              <div class="segment-details">
                <div>
                  <div class="time-block">${formatTime(segment.departure.at)}</div>
                  <div class="date-block">${formatDate(segment.departure.at)}</div>
                  <div class="city-block">${segment.departure.iataCode}</div>
                </div>
                <div class="duration">
                  <div class="arrow">→</div>
                  <div class="duration-text">${getDuration(segment.duration)}</div>
                </div>
                <div>
                  <div class="time-block">${formatTime(segment.arrival.at)}</div>
                  <div class="date-block">${formatDate(segment.arrival.at)}</div>
                  <div class="city-block">${segment.arrival.iataCode}</div>
                </div>
              </div>
            </div>
          `;
        });
        
        // Build return flight segments if exists
        let returnSegments = '';
        if (returnItinerary) {
          returnItinerary.segments.forEach((segment: any) => {
            returnSegments += `
              <div class="flight-segment">
                <div class="segment-header">${segment.carrierCode} ${segment.number} • ${segment.aircraft?.code || 'N/A'}</div>
                <div class="segment-details">
                  <div>
                    <div class="time-block">${formatTime(segment.departure.at)}</div>
                    <div class="date-block">${formatDate(segment.departure.at)}</div>
                    <div class="city-block">${segment.departure.iataCode}</div>
                  </div>
                  <div class="duration">
                    <div class="arrow">→</div>
                    <div class="duration-text">${getDuration(segment.duration)}</div>
                  </div>
                  <div>
                    <div class="time-block">${formatTime(segment.arrival.at)}</div>
                    <div class="date-block">${formatDate(segment.arrival.at)}</div>
                    <div class="city-block">${segment.arrival.iataCode}</div>
                  </div>
                </div>
              </div>
            `;
          });
        }
        
        // Build passenger list with seats
        let passengerList = '';
        passengers.forEach((passenger: any, index: number) => {
          const seat = selectedSeats.find((s: any) => s.passengerId === index);
          const baggage = selectedBaggage.find((b: any) => b.passengerId === index);
          
          passengerList += `
            <div class="passenger-item">
              <div class="passenger-name">${passenger.firstName} ${passenger.lastName}</div>
              <div class="passenger-details">
                ${seat ? `Seat: ${seat.seatNumber}` : 'Seat not selected'} 
                ${baggage && baggage.bags > 0 ? `• ${baggage.bags} checked bag(s)` : ''}
              </div>
            </div>
          `;
        });
        
        bookingDetails = `
          <div class="flight-summary">
            <div class="flight-route">
              <div class="airport">
                <div class="airport-code">${origin}</div>
                <div class="airport-name">${formatDate(departureTime)}</div>
              </div>
              <div class="arrow">✈</div>
              <div class="airport">
                <div class="airport-code">${destination}</div>
                <div class="airport-name">${formatDate(arrivalTime)}</div>
              </div>
            </div>
            
            <div class="info-section">
              <div class="section-title">Outbound Flight</div>
              ${outboundSegments}
            </div>
            
            ${returnSegments ? `
              <div class="info-section">
                <div class="section-title">Return Flight</div>
                ${returnSegments}
              </div>
            ` : ''}
          </div>
          
          <div class="info-section">
            <div class="section-title">Passenger Information</div>
            <div class="passenger-list">
              ${passengerList}
            </div>
          </div>
          
          <div class="important-info">
            <div class="important-title">⚠ Important Travel Information</div>
            <div class="important-text">
              <strong>Check-in:</strong> Online check-in opens 24 hours before departure.<br>
              <strong>Airport Arrival:</strong> Arrive at least 2 hours before domestic flights, 3 hours for international.<br>
              <strong>ID Requirements:</strong> Government-issued photo ID required for all passengers. Valid passport required for international travel.<br>
              <strong>Baggage:</strong> Review airline baggage policies. Checked baggage fees may apply.
            </div>
          </div>
          
          <div class="price-summary">
            <div class="price-row">
              <span>Base Fare</span>
              <span>${currency} ${(totalPrice - (fees.baggage || 0) - (fees.seats || 0)).toFixed(2)}</span>
            </div>
            ${fees.seats > 0 ? `
              <div class="price-row">
                <span>Seat Selection</span>
                <span>${currency} ${fees.seats.toFixed(2)}</span>
              </div>
            ` : ''}
            ${fees.baggage > 0 ? `
              <div class="price-row">
                <span>Baggage</span>
                <span>${currency} ${fees.baggage.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="price-total">
              <span>Total Paid</span>
              <span>${currency} ${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        `;
      }
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
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              line-height: 1.6; 
              color: #333333; 
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 680px; 
              margin: 0 auto; 
              background: white;
            }
            .header { 
              background: #1A1F2C;
              padding: 30px 40px;
              text-align: center;
            }
            .logo { 
              color: #C9A55B; 
              font-size: 32px; 
              font-weight: 700;
              letter-spacing: 3px;
              margin: 0;
            }
            .confirmation-banner {
              background: #0B7A3E;
              color: white;
              padding: 20px 40px;
              text-align: center;
            }
            .confirmation-banner h2 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .confirmation-number {
              background: white;
              border: 2px solid #0B7A3E;
              padding: 20px;
              margin: 20px 40px;
              text-align: center;
            }
            .conf-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .conf-value {
              font-size: 32px;
              font-weight: 700;
              color: #1A1F2C;
              letter-spacing: 2px;
              font-family: monospace;
            }
            .content { 
              padding: 30px 40px;
              background: white;
            }
            .flight-summary {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 25px;
              margin: 20px 0;
            }
            .flight-route {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 20px;
              align-items: center;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #dee2e6;
            }
            .airport {
              text-align: center;
            }
            .airport-code {
              font-size: 36px;
              font-weight: 700;
              color: #1A1F2C;
            }
            .airport-name {
              font-size: 13px;
              color: #666;
              margin-top: 5px;
            }
            .arrow {
              font-size: 24px;
              color: #666;
            }
            .flight-segment {
              background: white;
              border: 1px solid #dee2e6;
              border-radius: 6px;
              padding: 20px;
              margin: 15px 0;
            }
            .segment-header {
              font-size: 14px;
              font-weight: 600;
              color: #0B7A3E;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .segment-details {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              gap: 15px;
              align-items: start;
            }
            .time-block {
              font-size: 24px;
              font-weight: 700;
              color: #1A1F2C;
            }
            .date-block {
              font-size: 13px;
              color: #666;
              margin-top: 3px;
            }
            .city-block {
              font-size: 14px;
              color: #333;
              margin-top: 5px;
            }
            .duration {
              text-align: center;
              padding-top: 8px;
            }
            .duration-text {
              font-size: 12px;
              color: #666;
            }
            .flight-info {
              font-size: 13px;
              color: #666;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 1px solid #dee2e6;
            }
            .info-section {
              margin: 25px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1A1F2C;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #C9A55B;
            }
            .passenger-list {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 15px;
            }
            .passenger-item {
              padding: 10px 0;
              border-bottom: 1px solid #dee2e6;
            }
            .passenger-item:last-child {
              border-bottom: none;
            }
            .passenger-name {
              font-weight: 600;
              font-size: 16px;
              color: #1A1F2C;
            }
            .passenger-details {
              font-size: 13px;
              color: #666;
              margin-top: 3px;
            }
            .important-info {
              background: #FFF3CD;
              border-left: 4px solid #FFC107;
              padding: 20px;
              margin: 25px 0;
            }
            .important-title {
              font-weight: 600;
              color: #856404;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .important-text {
              font-size: 14px;
              color: #856404;
              line-height: 1.6;
            }
            .price-summary {
              background: #f8f9fa;
              border: 2px solid #C9A55B;
              border-radius: 8px;
              padding: 20px;
              margin: 25px 0;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 14px;
            }
            .price-total {
              display: flex;
              justify-content: space-between;
              padding: 15px 0 0 0;
              margin-top: 15px;
              border-top: 2px solid #C9A55B;
              font-size: 24px;
              font-weight: 700;
              color: #1A1F2C;
            }
            .action-button {
              display: inline-block;
              background: #0B7A3E;
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 10px 5px;
            }
            .footer { 
              background: #f8f9fa;
              text-align: center; 
              padding: 30px 40px;
              color: #666;
              font-size: 13px;
              border-top: 1px solid #dee2e6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 class="logo">GOLDSAINTE</h1>
            </div>
            
            <div class="confirmation-banner">
              <h2>✓ Your flight is confirmed</h2>
            </div>

            <div class="confirmation-number">
              <div class="conf-label">Confirmation Number</div>
              <div class="conf-value">${bookingReference}</div>
            </div>
            
            <div class="content">
              <p>Dear ${guestName},</p>
              
              <p>Your flight reservation has been confirmed. Please review the details below and save this email for your records.</p>
              
              ${bookingDetails}
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="margin-bottom: 15px; font-weight: 600;">Questions about your booking?</p>
                <p style="font-size: 14px; color: #666;">Contact GoldSainte Concierge Support<br>Available 24/7</p>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing GoldSainte</p>
              <p style="margin-top: 10px; font-size: 12px;">This is an automated confirmation email. Please do not reply to this message.</p>
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
        from: "GoldSainte <onboarding@resend.dev>",
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
