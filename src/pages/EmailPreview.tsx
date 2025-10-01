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
          .flight-segment { background: #F8F6F0; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #C9A55B; }
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
              GS-FLT-2024-567890
            </div>
            
            <div class="details">
              <div class="section-title">Flight Itinerary</div>
              <div class="detail-item">
                <span class="detail-label">Route</span>
                <span class="detail-value" style="font-weight: 600; color: #C9A55B;">JFK → LAX</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Airline</span>
                <span class="detail-value">American Airlines</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Total Duration</span>
                <span class="detail-value">5h 45m</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Stops</span>
                <span class="detail-value">Direct Flight</span>
              </div>
              
              <div style="margin-top: 25px;">
                <div style="font-family: 'Playfair Display', serif; color: #1A1F2C; font-size: 18px; font-weight: 600; margin-bottom: 15px;">
                  Outbound Journey
                </div>
                <div class="flight-segment">
                  <div style="font-weight: 600; color: #C9A55B; margin-bottom: 8px;">✈ Departure</div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                    <div>
                      <div style="color: #5A5A5A; font-size: 12px;">From</div>
                      <div style="font-weight: 600;">JFK - New York</div>
                      <div style="font-size: 13px;">Sat, Mar 15, 2024</div>
                      <div style="font-size: 13px; color: #C9A55B;">08:00 AM</div>
                    </div>
                    <div>
                      <div style="color: #5A5A5A; font-size: 12px;">To</div>
                      <div style="font-weight: 600;">LAX - Los Angeles</div>
                      <div style="font-size: 13px;">Sat, Mar 15, 2024</div>
                      <div style="font-size: 13px; color: #C9A55B;">11:45 AM</div>
                    </div>
                  </div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E5E0; font-size: 13px; color: #5A5A5A;">
                    Flight AA123 • Aircraft Boeing 777 • Duration 5h 45m
                  </div>
                </div>
              </div>
              
              <div style="margin-top: 25px;">
                <div class="section-title">Travelers</div>
                <div class="detail-item">
                  <span class="detail-label">Passenger 1</span>
                  <span class="detail-value">John Smith</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Passenger 2</span>
                  <span class="detail-value">Jane Smith</span>
                </div>
              </div>
            </div>
            
            <div class="total-price">
              <div class="total-label">Total Amount</div>
              USD 1,150.00
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
