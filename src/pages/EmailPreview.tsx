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
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400&display=swap');
          body { font-family: 'Lato', sans-serif; line-height: 1.8; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5F5F0; }
          .container { max-width: 650px; margin: 40px auto; background: white; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1A1F2C 0%, #2C3444 100%); padding: 50px 40px; text-align: center; border-top: 5px solid #C9A55B; }
          .logo { color: #C9A55B; font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
          .tagline { color: #E5D5B7; font-size: 14px; letter-spacing: 4px; text-transform: uppercase; margin-top: 10px; font-weight: 300; }
          .header-subtitle { color: #E5D5B7; font-size: 16px; margin-top: 20px; font-weight: 300; letter-spacing: 1px; }
          .content { padding: 50px 40px; background: white; }
          .greeting { font-family: 'Playfair Display', serif; font-size: 28px; color: #1A1F2C; margin-bottom: 20px; font-weight: 600; }
          .intro-text { color: #5A5A5A; font-size: 16px; margin-bottom: 30px; line-height: 1.8; }
          .booking-ref { background: linear-gradient(135deg, #C9A55B 0%, #B8944A 100%); color: white; padding: 25px; text-align: center; font-size: 24px; font-weight: 400; margin: 30px 0; border-radius: 8px; letter-spacing: 3px; box-shadow: 0 4px 15px rgba(201,165,91,0.3); font-family: 'Playfair Display', serif; }
          .booking-ref-label { font-size: 12px; letter-spacing: 2px; opacity: 0.9; margin-bottom: 5px; text-transform: uppercase; }
          .details { background: #FAFAF8; padding: 30px; margin: 30px 0; border-radius: 8px; border-left: 4px solid #C9A55B; }
          .section-title { font-family: 'Playfair Display', serif; color: #C9A55B; font-size: 20px; margin: 30px 0 15px 0; font-weight: 600; letter-spacing: 1px; }
          .detail-item { padding: 12px 0; border-bottom: 1px solid #E5E5E0; display: flex; justify-content: space-between; }
          .detail-label { color: #5A5A5A; font-weight: 400; }
          .detail-value { color: #2C2C2C; font-weight: 400; text-align: right; }
          .total-price { font-size: 28px; font-weight: 700; color: #C9A55B; text-align: center; padding: 30px; margin: 30px 0; background: linear-gradient(135deg, #F8F6F0 0%, #FAF8F2 100%); border-radius: 8px; border: 2px solid #C9A55B; font-family: 'Playfair Display', serif; }
          .total-label { font-size: 14px; letter-spacing: 2px; color: #5A5A5A; margin-bottom: 10px; text-transform: uppercase; }
          .info-box { background: linear-gradient(135deg, #F8F6F0 0%, #FAF8F2 100%); padding: 25px; margin: 30px 0; border-radius: 8px; border: 1px solid #E5D5B7; }
          .info-title { font-family: 'Playfair Display', serif; color: #C9A55B; font-size: 18px; margin-bottom: 15px; font-weight: 600; }
          .info-text { color: #5A5A5A; font-size: 14px; line-height: 1.8; margin: 8px 0; }
          .footer { background: #1A1F2C; text-align: center; padding: 40px 20px; color: #B8B8B8; font-size: 13px; }
          .footer-divider { width: 60px; height: 2px; background: #C9A55B; margin: 20px auto; }
          .signature { font-style: italic; color: #E5D5B7; margin-top: 30px; font-size: 15px; }
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
            <h1 class="greeting">Welcome, John Smith</h1>
            <p class="intro-text">
              Thank you for choosing Goldstone. We are delighted to confirm your reservation 
              and look forward to providing you with an exceptional travel experience.
            </p>
            
            <div class="booking-ref">
              <div class="booking-ref-label">Your Confirmation Code</div>
              GS-HTL-2024-001234
            </div>
            
            <div class="details">
              <div class="section-title">Hotel Details</div>
              <div class="detail-item">
                <span class="detail-label">Property</span>
                <span class="detail-value">The Grand Luxury Hotel & Spa</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Room Type</span>
                <span class="detail-value">Deluxe King Suite with Ocean View</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Bed Type</span>
                <span class="detail-value">King Bed</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-in</span>
                <span class="detail-value">March 15, 2024</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Check-out</span>
                <span class="detail-value">March 18, 2024</span>
              </div>
            </div>
            
            <div class="total-price">
              <div class="total-label">Total Amount</div>
              USD 1,725.00
            </div>
            
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
            
            <p>Thank you for booking with GoldSainte. Your flight reservation has been confirmed. Please review the details below and save this email for your records.</p>
            
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
                <strong>Check-in:</strong> Check in online beginning 24 hours prior to departure. Airport kiosks and ticket counters also available.<br><br>
                <strong>Airport Arrival:</strong> Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights.<br><br>
                <strong>Travel Documents:</strong> Valid government-issued photo identification is required for all passengers. International travel requires a valid passport.<br><br>
                <strong>Baggage Information:</strong> Review airline baggage policies. Additional fees may apply for checked baggage and oversized items.<br><br>
                <strong>Boarding:</strong> Boarding begins approximately 30-45 minutes prior to departure. Please arrive at your gate with adequate time.
              </div>
            </div>
            
            <h2>Price breakdown</h2>
            
            <div class="price-box">
              <div class="price-row">
                <span>Base fare</span>
                <span>USD 980.00</span>
              </div>
              <div class="price-row">
                <span>Seat selection</span>
                <span>USD 70.00</span>
              </div>
              <div class="price-row">
                <span>Checked baggage (2 bags)</span>
                <span>USD 100.00</span>
              </div>
              <div class="price-total">
                <span>Total paid</span>
                <span>USD 1,150.00</span>
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
          onClick={() => navigate('/')}
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
