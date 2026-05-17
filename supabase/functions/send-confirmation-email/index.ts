import "../_shared/resend-guard.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { resolveAllowedOrigin } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function corsHeaders(req?: Request): Record<string, string> {
  return {
  "Access-Control-Allow-Origin": resolveAllowedOrigin(req),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};
}

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
    return new Response(null, { headers: corsHeaders(req) });
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
      const hotelName = bookingData.hotel?.name || bookingData.hotelName || bookingData.selectedRoom?.hotelName || 'Hotel';
      const hotelAddress = bookingData.hotel?.address?.lines?.[0] || bookingData.hotelAddress || 'Hotel Address';
      const roomType = bookingData.selectedRoom?.name || bookingData.room?.description?.text || bookingData.roomType || 'Standard Room';
      const bedType = bookingData.selectedRoom?.bedType || bookingData.room?.typeEstimated?.bedType || bookingData.bedType || 'Not specified';
      const guests = bookingData.guests || bookingData.adults || 2;
      const nights = bookingData.nights || 1;
      
      console.log('📧 [EMAIL-TEMPLATE] Hotel email data:', {
        checkInDate,
        checkOutDate,
        guests,
        nights,
        hotelName
      });
      
      emailSubject = `Hotel Booking Confirmed - ${hotelName}`;
      
      // Build booking information section (matching flight's ticket info)
      const bookingDate = new Date();
      const issueDate = bookingDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
      const bookingNumber = bookingReference.replace(/[^0-9]/g, '').padStart(13, '0');
      
      const bookingInfo = `
        <h2>Booking Information</h2>
        <div class="info-box">
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Booking Number</td>
                <td class="info-value">${bookingNumber}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Booking Date</td>
                <td class="info-value">${issueDate}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Status</td>
                <td class="info-value">Confirmed</td>
              </tr>
            </table>
          </div>
        </div>
      `;
      
      bookingDetails = `
        ${bookingInfo}
        
        <h2>Reservation details</h2>
        <div class="info-box">
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Property</td>
                <td class="info-value"><strong>${hotelName}</strong></td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Address</td>
                <td class="info-value">${hotelAddress}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Check-in date</td>
                <td class="info-value"><strong>${checkInDate ? new Date(checkInDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'To be confirmed'}</strong></td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Check-out date</td>
                <td class="info-value"><strong>${checkOutDate ? new Date(checkOutDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'To be confirmed'}</strong></td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Duration</td>
                <td class="info-value">${nights} ${nights === 1 ? 'night' : 'nights'}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Guests</td>
                <td class="info-value">${guests} ${guests === 1 ? 'guest' : 'guests'}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <h2>Room details</h2>
        <div class="flight-segment">
          <div class="segment-header">Your Accommodation</div>
          <div class="passenger-item">
            <div class="passenger-name">${roomType}</div>
            <div class="passenger-details">Bed Type: ${bedType}</div>
          </div>
        </div>
        
        <div class="warning-box">
          <div class="warning-title">⚠ Important Hotel Information</div>
          <div class="warning-text">
            <strong>Check-in Time:</strong> Standard check-in is at 3:00 PM. Early check-in may be available upon request and subject to availability.<br><br>
            <strong>Check-out Time:</strong> Standard check-out is at 11:00 AM. Late check-out may be available upon request and subject to additional charges.<br><br>
            <strong>Identification:</strong> A valid government-issued photo ID and credit card will be required at check-in for incidental charges.<br><br>
            <strong>Payment:</strong> The hotel will place a hold on your credit card for incidental charges. This hold will be released upon check-out.<br><br>
            <strong>Cancellation:</strong> Free cancellation may be available up to 24-48 hours before check-in. Please review your rate's cancellation policy.<br><br>
            <strong>Special Requests:</strong> Special requests such as room location, high floor, or bed type preferences are subject to availability and cannot be guaranteed.<br><br>
            <strong>Contact Property:</strong> For any special requests or questions about your stay, please contact the property directly using the confirmation number above.
          </div>
        </div>
        
        <h2>Price breakdown</h2>
        <div class="price-box">
          <div class="price-total">
            <table>
              <tr>
                <td>Total paid</td>
                <td style="text-align: right;">${currency} ${totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
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
        
        emailSubject = `Flight Confirmed - ${origin} to ${destination} - Confirmation ${bookingReference}`;
        
        // Build ticket information section
        const ticketDate = new Date(departureTime);
        const issueDate = ticketDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
        const expirationDate = new Date(ticketDate);
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
        const expDate = expirationDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
        
        const ticketNumber = bookingReference.replace(/[^0-9]/g, '').padStart(13, '0');
        
        const ticketInfo = `
          <h2>Ticket Information</h2>
          <div class="info-box">
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Ticket Number</td>
                  <td class="info-value">${ticketNumber}</td>
                </tr>
              </table>
            </div>
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Issue Date</td>
                  <td class="info-value">${issueDate}</td>
                </tr>
              </table>
            </div>
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Expiration Date</td>
                  <td class="info-value">${expDate}</td>
                </tr>
              </table>
            </div>
          </div>
        `;
        
        // Build outbound flight segments
        let outboundSegments = '';
        flightOffer.itineraries[0].segments.forEach((segment: any) => {
          outboundSegments += `
            <div class="flight-segment">
              <div class="segment-header">${segment.carrierCode} ${segment.number} • ${segment.aircraft?.code || 'N/A'}</div>
              <table class="flight-times">
                <tr>
                  <td>
                    <div class="time-big">${formatTime(segment.departure.at)}</div>
                    <div class="time-date">${formatDate(segment.departure.at)}</div>
                    <div class="time-city">${segment.departure.iataCode}</div>
                  </td>
                  <td>
                    <div class="time-arrow">→</div>
                    <div class="duration">${getDuration(segment.duration)}</div>
                  </td>
                  <td>
                    <div class="time-big">${formatTime(segment.arrival.at)}</div>
                    <div class="time-date">${formatDate(segment.arrival.at)}</div>
                    <div class="time-city">${segment.arrival.iataCode}</div>
                  </td>
                </tr>
              </table>
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
                <table class="flight-times">
                  <tr>
                    <td>
                      <div class="time-big">${formatTime(segment.departure.at)}</div>
                      <div class="time-date">${formatDate(segment.departure.at)}</div>
                      <div class="time-city">${segment.departure.iataCode}</div>
                    </td>
                    <td>
                      <div class="time-arrow">→</div>
                      <div class="duration">${getDuration(segment.duration)}</div>
                    </td>
                    <td>
                      <div class="time-big">${formatTime(segment.arrival.at)}</div>
                      <div class="time-date">${formatDate(segment.arrival.at)}</div>
                      <div class="time-city">${segment.arrival.iataCode}</div>
                    </td>
                  </tr>
                </table>
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
                ${seat ? `Seat ${seat.seatNumber}` : 'Seat not selected'} 
                ${baggage && baggage.bags > 0 ? `• ${baggage.bags} checked bag(s)` : ''}
              </div>
            </div>
          `;
        });
        
        bookingDetails = `
          ${ticketInfo}
          
          <h2>Flight details</h2>
          <div class="info-box">
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Route</td>
                  <td class="info-value"><strong>${origin} → ${destination}</strong></td>
                </tr>
              </table>
            </div>
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Travel date</td>
                  <td class="info-value">${formatDate(departureTime)}</td>
                </tr>
              </table>
            </div>
            <div class="info-row">
              <table>
                <tr>
                  <td class="info-label">Passengers</td>
                  <td class="info-value">${passengers.length} ${passengers.length === 1 ? 'passenger' : 'passengers'}</td>
                </tr>
              </table>
            </div>
          </div>
          
          <h2>Outbound flight</h2>
          ${outboundSegments}
          
          ${returnSegments ? `<h2>Return flight</h2>${returnSegments}` : ''}
          
          <h2>Passenger information</h2>
          <div class="passenger-box">
            ${passengerList}
          </div>
          
          <div class="warning-box">
            <div class="warning-title">⚠ Important Travel Information</div>
            <div class="warning-text">
              <strong>Check-in:</strong> Check in online beginning 24 hours prior to departure. Airport kiosks and ticket counters also available. You must be checked in and at the gate by the check-in deadline or your reservation may be cancelled.<br><br>
              <strong>Airport Arrival:</strong> Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights.<br><br>
              <strong>Travel Documents:</strong> Valid government-issued photo identification is required for all passengers. International travel requires a valid passport.<br><br>
              <strong>Carry-on Baggage:</strong> You may carry on one bag and one personal item at no charge. All items must easily fit into the overhead bin or under the seat in front of you or will need to be checked.<br><br>
              <strong>Checked Baggage:</strong> You may check up to two bags without charge in most markets as long as your bags fit within size and weight limits. Only one checked bag is allowed to certain destinations. Additional fees may apply for oversized items.<br><br>
              <strong>Check-in Requirements:</strong> Check-in requirements vary by airline. If your ticket includes travel on other airlines, please check with the operating carrier on your ticket to avoid any surprises.<br><br>
              <strong>Boarding:</strong> Boarding begins approximately 30-45 minutes prior to departure. Please arrive at your gate with adequate time.
            </div>
          </div>
          
          <h2>Price breakdown</h2>
          <div class="price-box">
            ${fees.seats > 0 || fees.baggage > 0 ? `
              <div class="price-row">
                <table>
                  <tr>
                    <td>Base fare</td>
                    <td style="text-align: right;">${currency} ${(totalPrice - (fees.baggage || 0) - (fees.seats || 0)).toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            ` : ''}
            ${fees.seats > 0 ? `
              <div class="price-row">
                <table>
                  <tr>
                    <td>Seat selection</td>
                    <td style="text-align: right;">${currency} ${fees.seats.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            ` : ''}
            ${fees.baggage > 0 ? `
              <div class="price-row">
                <table>
                  <tr>
                    <td>Checked baggage</td>
                    <td style="text-align: right;">${currency} ${fees.baggage.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
            ` : ''}
            <div class="price-total">
              <table>
                <tr>
                  <td>Total paid</td>
                  <td style="text-align: right;">${currency} ${totalPrice.toFixed(2)}</td>
                </tr>
              </table>
            </div>
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
        <h2>Reservation details</h2>
        <div class="info-box">
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Restaurant</td>
                <td class="info-value">${restaurantName}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Location</td>
                <td class="info-value">${restaurantAddress}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Date</td>
                <td class="info-value">${date}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Time</td>
                <td class="info-value">${time}</td>
              </tr>
            </table>
          </div>
          <div class="info-row">
            <table>
              <tr>
                <td class="info-label">Party size</td>
                <td class="info-value">${guests} ${guests === 1 ? 'guest' : 'guests'}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <h2>Price breakdown</h2>
        <div class="price-box">
          <div class="price-total">
            <table>
              <tr>
                <td>Total paid</td>
                <td style="text-align: right;">${currency} ${totalPrice.toFixed(2)}</td>
              </tr>
            </table>
          </div>
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
            @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
            @font-face {
              font-family: 'Chiffon';
              src: url('https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/Chiffon.otf') format('opentype');
            }
            body {
              font-family: 'Gupter', BlinkMacSystemFont, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #E5DFC6;
            }
            .container {
              max-width: 640px;
              margin: 0 auto;
              background: #ffffff;
            }
            .header {
              background: transparent;
              padding: 24px;
              text-align: center;
            }
            .logo {
              max-width: 280px;
              height: auto;
            }
            .hero-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              object-position: center center;
              display: block;
            }
            .content {
              padding: 0 8px;
            }
            h1 {
              font-family: 'Chiffon', serif;
              font-size: 32px;
              line-height: 40px;
              font-weight: normal;
              color: #0c4d47;
              margin: 32px 0 16px 0;
              padding: 0 8px;
            }
            h2 {
              font-family: 'Chiffon', serif;
              font-size: 22px;
              line-height: 28px;
              font-weight: normal;
              color: #0c4d47;
              margin: 16px 0;
              padding: 0 8px;
            }
            p {
              font-size: 16px;
              line-height: 24px;
              color: #333333;
              margin: 16px 0;
              padding: 0 8px;
            }
            .conf-box {
              border: 2px solid #bfad72;
              border-radius: 4px;
              padding: 16px;
              margin: 16px 8px;
              text-align: center;
              background: #f9f8f5;
            }
            .conf-label {
              font-size: 12px;
              color: #8d8d8d;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }
            .conf-number {
              font-size: 28px;
              font-weight: 700;
              color: #0A2225;
              letter-spacing: 2px;
              font-family: monospace;
            }
            .info-box {
              border: 1px solid #e7e7e7;
              border-radius: 4px;
              margin: 16px 8px;
            }
            .info-row {
              border-top: 1px solid #e7e7e7;
              padding: 16px;
            }
            .info-row:first-child {
              border-top: none;
            }
            .info-row table {
              width: 100%;
              border-collapse: collapse;
            }
            .info-label {
              width: 224px;
              font-size: 16px;
              line-height: 24px;
              color: #595959;
              vertical-align: top;
            }
            .info-value {
              font-size: 16px;
              line-height: 24px;
              color: #333333;
              vertical-align: top;
            }
            .flight-segment {
              background: #f5f5f5;
              border-radius: 4px;
              padding: 16px;
              margin: 12px 8px;
            }
            .segment-header {
              font-size: 14px;
              font-weight: 600;
              color: #0c4d47;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
            .flight-times {
              width: 100%;
            }
            .flight-times td {
              vertical-align: top;
              width: 33%;
            }
            .time-big {
              font-size: 20px;
              font-weight: 700;
              color: #333333;
            }
            .time-date {
              font-size: 13px;
              color: #595959;
              margin-top: 4px;
            }
            .time-city {
              font-size: 14px;
              color: #333333;
              margin-top: 4px;
            }
            .time-arrow {
              text-align: center;
              font-size: 24px;
              color: #595959;
            }
            .duration {
              font-size: 12px;
              color: #595959;
              text-align: center;
            }
            .passenger-box {
              background: #f5f5f5;
              border-radius: 4px;
              padding: 12px 16px;
              margin: 12px 8px;
            }
            .passenger-item {
              padding: 8px 0;
              border-bottom: 1px solid #e7e7e7;
            }
            .passenger-item:last-child {
              border-bottom: none;
            }
            .passenger-name {
              font-size: 16px;
              font-weight: 600;
              color: #333333;
            }
            .passenger-details {
              font-size: 14px;
              color: #595959;
              margin-top: 4px;
            }
            .warning-box {
              border: 1px solid #FFE08A;
              background: #FEFBF0;
              border-radius: 4px;
              padding: 16px;
              margin: 24px 8px;
            }
            .warning-title {
              font-size: 16px;
              font-weight: 600;
              color: #333333;
              margin-bottom: 8px;
            }
            .warning-text {
              font-size: 14px;
              line-height: 20px;
              color: #333333;
            }
            .price-box {
              border: 1px solid #e7e7e7;
              border-radius: 4px;
              padding: 16px;
              margin: 24px 8px;
            }
            .price-row {
              padding: 8px 0;
              font-size: 14px;
              color: #333333;
            }
            .price-row table {
              width: 100%;
            }
            .price-total {
              padding: 16px 0 0 0;
              margin-top: 8px;
              border-top: 2px solid #e7e7e7;
              font-size: 20px;
              font-weight: 700;
              color: #333333;
            }
            .price-total table {
              width: 100%;
            }
            .footer {
              background: #BFAD72;
              text-align: center;
              padding: 24px;
              color: #0A2225;
              font-size: 12px;
              margin-top: 32px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
            </div>
            
            <img src="https://iwdevxltjuedijrcdejs.supabase.co/storage/v1/object/public/assets/${bookingType === 'hotel' ? 'email-hero-hotel.jpg' : 'email-hero-luxury.jpg'}" alt="${bookingType === 'hotel' ? 'Luxury Hotel' : 'Luxury Travel'}" class="hero-image" />
            
            <div class="content">
              <h1>✓ Your ${bookingType} is confirmed</h1>
              
              <p>Dear ${guestName},</p>
              
              <p>We're excited to be part of your upcoming journey! Your reservation has been confirmed. Please review the details below and save this email for your records.</p>
              
              ${bookingType === 'hotel' ? `
                <p>Your room will be ready for check-in at the standard time of 3:00 PM. If you need early check-in, please contact the property directly using your confirmation number.</p>
                
                <p>Please bring a valid government-issued photo ID and a credit card for incidentals at check-in. The hotel will place an authorization hold on your card which will be released upon check-out.</p>
                
                <p>For any special requests or questions about your stay, please contact the property directly. We're here to make your stay comfortable and memorable.</p>
              ` : `
                <p>You can check in for your flight using your confirmation number either at the airline's self-service kiosks at the airport (typically available up to 6 hours before departure), or online or via the airline's mobile app starting 24 hours prior to your flight.</p>
                
                <p>Please note that boarding priority is determined by the airline and may vary based on travel date, fare class, and other factors. If you're flying on a standby basis, seats are subject to availability and will be assigned at the gate. Standby travel is generally allowed only on flights operated by the airline listed on your itinerary.</p>
                
                <p>For the most accurate information, be sure to check your airline's specific policies and mobile tools before you travel.</p>
              `}
              
              <div class="conf-box">
                <div class="conf-label">Confirmation Number</div>
                <div class="conf-number">${bookingReference}</div>
              </div>
              
              ${bookingDetails}
              
              <p style="text-align: center; margin: 32px 0;">
                <strong>Questions about your booking?</strong><br>
                <span style="font-size: 14px; color: #595959;">Contact GoldSainte Concierge Support<br>Available 24/7</span>
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 8px 0;">Thank you for choosing GoldSainte</p>
              <p style="margin: 8px 0; font-size: 11px;">Need assistance? Contact our 24/7 Concierge Support Team</p>
              <p style="margin: 0; font-size: 11px;">This is an automated confirmation email. Please do not reply to this message.</p>
              <p style="margin: 12px 0 0 0; font-size: 11px;">© 2025 GoldSainte. All rights reserved.</p>
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
        from: "GoldSainte <hello@goldsainte.com>",
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
        ...corsHeaders(req),
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders(req) },
      }
    );
  }
};

serve(handler);
