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
            <div class="conf-value">ABC123</div>
          </div>
          
          <div class="content">
            <p>Dear John Smith,</p>
            
            <p>Your flight reservation has been confirmed. Please review the details below and save this email for your records.</p>
            
            <div class="flight-summary">
              <div class="flight-route">
                <div class="airport">
                  <div class="airport-code">JFK</div>
                  <div class="airport-name">Sat, Mar 15, 2024</div>
                </div>
                <div class="arrow">✈</div>
                <div class="airport">
                  <div class="airport-code">LAX</div>
                  <div class="airport-name">Sat, Mar 15, 2024</div>
                </div>
              </div>
              
              <div class="info-section">
                <div class="section-title">Outbound Flight</div>
                <div class="flight-segment">
                  <div class="segment-header">AA 123 • BOEING 777</div>
                  <div class="segment-details">
                    <div>
                      <div class="time-block">08:00 AM</div>
                      <div class="date-block">Sat, Mar 15, 2024</div>
                      <div class="city-block">JFK</div>
                    </div>
                    <div class="duration">
                      <div class="arrow">→</div>
                      <div class="duration-text">5h 45m</div>
                    </div>
                    <div>
                      <div class="time-block">11:45 AM</div>
                      <div class="date-block">Sat, Mar 15, 2024</div>
                      <div class="city-block">LAX</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <div class="section-title">Passenger Information</div>
              <div class="passenger-list">
                <div class="passenger-item">
                  <div class="passenger-name">John Smith</div>
                  <div class="passenger-details">Seat: 12A • 1 checked bag(s)</div>
                </div>
                <div class="passenger-item">
                  <div class="passenger-name">Jane Smith</div>
                  <div class="passenger-details">Seat: 12B • 1 checked bag(s)</div>
                </div>
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
                <span>USD 980.00</span>
              </div>
              <div class="price-row">
                <span>Seat Selection</span>
                <span>USD 70.00</span>
              </div>
              <div class="price-row">
                <span>Baggage</span>
                <span>USD 100.00</span>
              </div>
              <div class="price-total">
                <span>Total Paid</span>
                <span>USD 1,150.00</span>
              </div>
            </div>
            
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
