import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EmailPreview() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("hotel");

  const hotelEmailHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
            @font-face {
              font-family: 'Chiffon';
              src: url('/fonts/Chiffon.otf') format('opentype');
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
            display: table;
            width: 100%;
          }
          .info-row:first-child {
            border-top: none;
          }
          .info-label {
            display: table-cell;
            width: 224px;
            font-size: 16px;
            line-height: 24px;
            color: #595959;
            vertical-align: top;
          }
          .info-value {
            display: table-cell;
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
          .price-total {
            display: flex;
            justify-content: space-between;
            padding: 16px 0 0 0;
            margin-top: 8px;
            border-top: 2px solid #e7e7e7;
            font-size: 20px;
            font-weight: 700;
            color: #333333;
          }
            .footer {
              background: #BFAD72;
              text-align: center;
              padding: 24px;
              color: #0A2225;
              font-size: 12px;
              margin-top: 32px;
            }
          @media only screen and (max-width: 639px) {
            .info-label, .info-value {
              display: block;
              width: 100%;
            }
            .info-label {
              padding-bottom: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
          </div>
          
          <img src="/email-hero-hotel.jpg" alt="Luxury Hotel" class="hero-image" />
          
          <div class="content">
            <h1>✓ Your reservation is confirmed</h1>
            
            <p>Dear John Smith,</p>
            
            <p>We're delighted to confirm your hotel reservation! Your booking has been successfully processed. Please review the details below and save this email for your records.</p>
            
            <p>You can check in at the hotel starting at 3:00 PM on your arrival date. Early check-in may be available upon request and subject to availability. Please contact the property directly if you require early check-in.</p>
            
            <p>A valid government-issued photo ID and credit card will be required at check-in for incidental charges. The hotel will place a hold on your credit card, which will be released upon check-out.</p>
            
            <p>For the most accurate information about amenities, policies, and services, please contact the property directly using the confirmation number below.</p>
            
            <div class="conf-box">
              <div class="conf-label">Confirmation Number</div>
              <div class="conf-number">HTL789456</div>
            </div>
            
            <h2>Booking Information</h2>
            <div class="info-box">
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Booking Number</td>
                    <td class="info-value">0078945600001</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Booking Date</td>
                    <td class="info-value">07 JUL 24</td>
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
            
            <h2>Reservation details</h2>
            <div class="info-box">
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Property</td>
                    <td class="info-value"><strong>The Grand Luxury Hotel & Spa</strong></td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Address</td>
                    <td class="info-value">123 Ocean Drive, Miami Beach, FL 33139</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Check-in date</td>
                    <td class="info-value">Saturday, March 15, 2024</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Check-out date</td>
                    <td class="info-value">Tuesday, March 18, 2024</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Duration</td>
                    <td class="info-value">3 nights</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Guests</td>
                    <td class="info-value">2 guests</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <h2>Room details</h2>
            <div class="flight-segment">
              <div class="segment-header">Your Accommodation</div>
              <div class="passenger-item">
                <div class="passenger-name">Deluxe King Suite with Ocean View</div>
                <div class="passenger-details">Bed Type: King Bed</div>
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
                    <td style="text-align: right;">USD 1,725.00</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <p>If you have any questions or need to make changes to your reservation, please contact us or the property directly. We're here to help make your stay exceptional.</p>
            
            <p style="margin-top: 32px; padding: 0 8px;">
              Safe travels,<br>
              <strong>The GoldSainte Team</strong>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0 0 8px 0;">GOLDSAINTE LUXURY TRAVEL</p>
            <p style="margin: 0;">This is a confirmation email. Please save for your records.</p>
            <p style="margin: 16px 0 0 0; font-size: 11px;">&copy; 2025 GoldSainte Travel. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const flightEmailHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Gupter:wght@400;500;700&display=swap');
            @font-face {
              font-family: 'Chiffon';
              src: url('/fonts/Chiffon.otf') format('opentype');
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
            display: table;
            width: 100%;
          }
          .info-row:first-child {
            border-top: none;
          }
          .info-label {
            display: table-cell;
            width: 224px;
            font-size: 16px;
            line-height: 24px;
            color: #595959;
            vertical-align: top;
          }
          .info-value {
            display: table-cell;
            font-size: 16px;
            line-height: 24px;
            color: #333333;
            vertical-align: top;
          }
          .flight-segment {
            background: #f5f5f5;
            border-radius: 4px;
            padding: 16px;
            margin: 12px 0;
          }
            .segment-header {
              font-size: 14px;
              font-weight: 600;
              color: #0c4d47;
              margin-bottom: 12px;
              text-transform: uppercase;
            }
          .flight-times {
            display: table;
            width: 100%;
          }
          .time-col {
            display: table-cell;
            width: 33%;
            vertical-align: top;
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
            margin: 12px 0;
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
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
            color: #333333;
          }
          .price-total {
            display: flex;
            justify-content: space-between;
            padding: 16px 0 0 0;
            margin-top: 8px;
            border-top: 2px solid #e7e7e7;
            font-size: 20px;
            font-weight: 700;
            color: #333333;
          }
            .footer {
              background: #BFAD72;
              text-align: center;
              padding: 24px;
              color: #0A2225;
              font-size: 12px;
              margin-top: 32px;
            }
          @media only screen and (max-width: 639px) {
            .info-label, .info-value {
              display: block;
              width: 100%;
            }
            .info-label {
              padding-bottom: 4px;
            }
            .time-col {
              display: block;
              width: 100%;
              margin-bottom: 12px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="/logo-horizontal-green.png" alt="GoldSainte" class="logo" />
          </div>
          
          <img src="/email-hero-luxury.jpg?v=5" alt="Luxury Travel" class="hero-image" />
          
          <div class="content">
            <h1>✓ Your flight is confirmed</h1>
            
            <p>Dear John Smith,</p>
            
            <p>We're excited to be part of your upcoming journey! Your flight reservation has been confirmed. Please review the details below and save this email for your records.</p>
            
            <p>You can check in for your flight using your confirmation number either at the airline's self-service kiosks at the airport (typically available up to 6 hours before departure), or online or via the airline's mobile app starting 24 hours prior to your flight.</p>
            
            <p>Please note that boarding priority is determined by the airline and may vary based on travel date, fare class, and other factors. If you're flying on a standby basis, seats are subject to availability and will be assigned at the gate. Standby travel is generally allowed only on flights operated by the airline listed on your itinerary.</p>
            
            <p>For the most accurate information, be sure to check your airline's specific policies and mobile tools before you travel.</p>
            
            <div class="conf-box">
              <div class="conf-label">Confirmation Number</div>
              <div class="conf-number">ABC123</div>
            </div>
            
            <h2>Ticket Information</h2>
            <div class="info-box">
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Ticket Number</td>
                    <td class="info-value">0062249595503</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Issue Date</td>
                    <td class="info-value">07 JUL 24</td>
                  </tr>
                </table>
              </div>
              <div class="info-row">
                <table>
                  <tr>
                    <td class="info-label">Expiration Date</td>
                    <td class="info-value">07 JUL 25</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <h2>Flight details</h2>
            
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">Route</div>
                <div class="info-value"><strong>New York (JFK) → Los Angeles (LAX)</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Travel date</div>
                <div class="info-value">Saturday, March 15, 2024</div>
              </div>
              <div class="info-row">
                <div class="info-label">Passengers</div>
                <div class="info-value">2 adults</div>
              </div>
            </div>
            
            <h2>Outbound flight</h2>
            
            <div style="padding: 0 8px;">
              <div class="flight-segment">
                <div class="segment-header">AA 123 • Boeing 777</div>
                <div class="flight-times">
                  <div class="time-col">
                    <div class="time-big">08:00</div>
                    <div class="time-date">Sat, Mar 15</div>
                    <div class="time-city">New York JFK</div>
                  </div>
                  <div class="time-col">
                    <div class="time-arrow">→</div>
                    <div class="duration">5h 45m</div>
                  </div>
                  <div class="time-col">
                    <div class="time-big">11:45</div>
                    <div class="time-date">Sat, Mar 15</div>
                    <div class="time-city">Los Angeles LAX</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h2>Passenger information</h2>
            
            <div style="padding: 0 8px;">
              <div class="passenger-box">
                <div class="passenger-item">
                  <div class="passenger-name">John Smith</div>
                  <div class="passenger-details">Seat 12A • 1 checked bag</div>
                </div>
                <div class="passenger-item">
                  <div class="passenger-name">Jane Smith</div>
                  <div class="passenger-details">Seat 12B • 1 checked bag</div>
                </div>
              </div>
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
              <div class="price-row">
                <span>Base fare</span>
                <span>$980.00</span>
              </div>
              <div class="price-row">
                <span>Seat selection</span>
                <span>$70.00</span>
              </div>
              <div class="price-row">
                <span>Checked baggage (2 bags)</span>
                <span>$100.00</span>
              </div>
              <div class="price-total">
                <span>Total paid</span>
                <span>$1,150.00</span>
              </div>
            </div>
            
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/home')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1 className="text-4xl font-bold mb-2">Email Preview</h1>
        <p className="text-muted-foreground mb-8">
          Preview confirmation emails sent to customers
        </p>

        <Tabs defaultValue="hotel" onValueChange={setSelectedType}>
          <TabsList>
            <TabsTrigger value="hotel">Hotel Booking</TabsTrigger>
            <TabsTrigger value="flight">Flight Booking</TabsTrigger>
          </TabsList>

          <TabsContent value="hotel" className="mt-6">
            <div className="border rounded-lg overflow-hidden shadow-lg bg-white">
              <iframe
                srcDoc={hotelEmailHTML}
                className="w-full h-[800px]"
                title="Hotel Email Preview"
              />
            </div>
          </TabsContent>

          <TabsContent value="flight" className="mt-6">
            <div className="border rounded-lg overflow-hidden shadow-lg bg-white">
              <iframe
                srcDoc={flightEmailHTML}
                className="w-full h-[900px]"
                title="Flight Email Preview"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
