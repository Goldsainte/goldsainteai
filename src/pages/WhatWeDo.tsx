import { Link } from "react-router-dom";
import { ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

const WhatWeDo = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton className="mb-6" />
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">What We Do</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Learn how Goldsainte provides AI-powered travel services across accommodations, attractions, car rentals, flights, and transportation.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="bg-card border rounded-lg p-6 mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Contents</h2>
        <div className="grid gap-2 text-sm">
          <a href="#section-1" className="text-primary hover:underline">1. Definitions and Who We Are</a>
          <a href="#section-2" className="text-primary hover:underline">2. How Our Service Works</a>
          <a href="#section-3" className="text-primary hover:underline">3. Who We Work With</a>
          <a href="#section-4" className="text-primary hover:underline">4. How We Make Money</a>
          <a href="#section-5" className="text-primary hover:underline">5. Recommendation Systems</a>
          <a href="#section-6" className="text-primary hover:underline">6. Reviews</a>
          <a href="#section-7" className="text-primary hover:underline">7. Prices</a>
          <a href="#section-8" className="text-primary hover:underline">8. Payments</a>
          <a href="#section-9" className="text-primary hover:underline">9. Host Type</a>
          <a href="#section-10" className="text-primary hover:underline">10. Star Ratings, Review Scores, and Quality Ratings</a>
          <a href="#section-11" className="text-primary hover:underline">11. Help and Advice – If the Unexpected Happens</a>
          <a href="#section-12" className="text-primary hover:underline">12. Overbooking</a>
          <a href="#section-13" className="text-primary hover:underline">13. Private and Public Transportation</a>
          <a href="#section-14" className="text-primary hover:underline">14. Cruises</a>
          <a href="#section-15" className="text-primary hover:underline">15. Goldsainte Dictionary</a>
          <a href="#attractions" className="text-primary hover:underline ml-4">• Attractions (2A-2I)</a>
          <a href="#car-rentals" className="text-primary hover:underline ml-4">• Car Rentals (3A-3I)</a>
          <a href="#flights" className="text-primary hover:underline ml-4">• Flights (4A-4H)</a>
          <a href="#transportation" className="text-primary hover:underline ml-4">• Private and Public Transportation (5A-5I)</a>
        </div>
      </nav>

      {/* Main Content */}
      <div className="space-y-12">
        
        {/* Section 1 */}
        <section id="section-1" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">1. Definitions and Who We Are</h2>
          <p className="leading-relaxed">
            Some words used in these Terms have specific meanings. Refer to the Goldsainte Ai / Inc. dictionary for definitions.
          </p>
          <p className="leading-relaxed">
            When you book an Accommodation, Goldsainte Ai / Inc. provides and is responsible for the Platform but not the Travel Experience itself (see section 2). Goldsainte Ai / Inc. is incorporated in the United States, with its registered address at:
          </p>
          <p className="font-semibold">
            850 New Burton Road, Suite 201, Dover, DE, 19904, County of Kent
          </p>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">2. How Our Service Works</h2>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. makes it easy for you to compare bookings from many hotels, hosts, and other Service Providers.
          </p>
          <p className="leading-relaxed">
            When you make a booking on our Platform, you enter into a contract directly with the Service Provider (unless otherwise stated).
          </p>
          <p className="leading-relaxed">
            Information on our Platform is based on what Service Providers provide. We do our best to keep this information up to date, though updates such as text descriptions or amenities may take a few hours to reflect on the Platform.
          </p>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">3. Who We Work With</h2>
          <p className="leading-relaxed">
            Only Service Providers with a contractual relationship with Goldsainte Ai / Inc. appear on our Platform. Service Providers may also offer Travel Experiences outside our Platform.
          </p>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. does not own any Accommodations. Each Service Provider is a separate entity that agrees to work with us in a defined way.
          </p>
          <p className="leading-relaxed">
            Our Platform displays Accommodations you can book worldwide, and search results indicate which properties might be right for you based on your preferences.
          </p>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">4. How We Make Money</h2>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. does not buy or resell Travel Experiences. Service Providers pay a commission after a guest completes a booking.
          </p>
          <p className="leading-relaxed">
            Accommodations with a "Preferred Partner" badge pay a higher commission.
          </p>
          <p className="leading-relaxed">
            Accommodations with an "Ad" badge have paid for placement in search results.
          </p>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">5. Recommendation Systems</h2>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. uses recommendation systems to help you discover properties you may like. These include:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Trending destinations based on searches by other travelers with similar preferences.</li>
            <li>Homes guests love: high-review properties.</li>
            <li>Personalized property suggestions based on prior bookings or search behavior.</li>
          </ul>
          
          <h3 className="text-xl font-semibold mt-6">Search Results Ranking Factors</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your search criteria (destination, dates, guests, etc.)</li>
            <li>Past interactions on our Platform (if you have not opted out)</li>
            <li>Property performance: click-through rate, gross bookings, net bookings</li>
            <li>Availability, pricing, review scores, and property features</li>
            <li>Commission, program participation (e.g., Preferred Partner), and payment behavior</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Adjust Search Order</h3>
          <p className="leading-relaxed">You can adjust search order via:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Homes & apartments first</li>
            <li>Price (lowest first)</li>
            <li>Property rating (high to low or low to high)</li>
            <li>Top-reviewed or closest distance</li>
          </ul>
          
          <p className="leading-relaxed mt-4">
            Personalized recommendations are based on your Platform interactions and may be disabled through account settings or cookie preferences.
          </p>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">6. Reviews</h2>
          <p className="leading-relaxed">
            Reviews are scored 1–10 using a weighted system. Guests may also provide subscores for: location, cleanliness, staff, comfort, facilities, value, and free Wifi.
          </p>
          <p className="leading-relaxed">
            You can submit reviews if you stayed at or visited an Accommodation booked through Goldsainte Ai / Inc.
          </p>
          <p className="leading-relaxed">
            Reviews may be edited by contacting Customer Service.
          </p>
          <p className="leading-relaxed">
            Fraudulent reviews are investigated and removed.
          </p>
          <p className="leading-relaxed">
            Reviews may be translated using automated tools.
          </p>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">7. Prices</h2>
          <p className="leading-relaxed">
            Service Providers set rates displayed on the Platform. Prices may vary due to location, room type, number of guests, and applicable taxes or fees.
          </p>
          <p className="leading-relaxed">
            Additional equipment, services, or facilities may incur extra costs, disclosed before booking.
          </p>
        </section>

        {/* Section 8 */}
        <section id="section-8" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">8. Payments</h2>
          <p className="leading-relaxed">Payment options include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Direct payment to the Service Provider at the Accommodation.</li>
            <li>Payment in advance, forwarded to the Service Provider by Goldsainte Ai / Inc.</li>
            <li>Goldsainte Ai / Inc. processing the payment to the Service Provider in advance.</li>
          </ul>
          <p className="leading-relaxed mt-4">
            Cancellation or no-show fees depend on the Service Provider's policies.
          </p>
        </section>

        {/* Section 9 */}
        <section id="section-9" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">9. Host Type</h2>
          <p className="leading-relaxed">
            Service Providers declare if they are a "private host" or "professional host" (EU law).
          </p>
          <p className="leading-relaxed">
            EEA, Switzerland, and UK users may see labels indicating management type.
          </p>
          <p className="leading-relaxed">
            Labels have no tax implications.
          </p>
        </section>

        {/* Section 10 */}
        <section id="section-10" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">10. Star Ratings, Review Scores, and Quality Ratings</h2>
          <div className="space-y-3">
            <div>
              <h3 className="text-xl font-semibold">Star Ratings</h3>
              <p className="leading-relaxed">Assigned by Service Providers or third parties (1–5 stars).</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Review Scores</h3>
              <p className="leading-relaxed">Weighted scores 1–10, submitted by guests.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Quality Ratings</h3>
              <p className="leading-relaxed">Assigned by Goldsainte Ai / Inc. using property features, photos, review scores, and historical data.</p>
            </div>
          </div>
        </section>

        {/* Section 11 */}
        <section id="section-11" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">11. Help and Advice – If the Unexpected Happens</h2>
          <p className="leading-relaxed">
            Contact Customer Service through your booking, app, or Help Center. Provide:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Booking confirmation, PIN, contact details, and email used</li>
            <li>Summary of the issue and desired outcome</li>
            <li>Supporting documentation (receipts, photos, bank statements)</li>
          </ul>
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Mispriced Bookings</h3>
            <p className="leading-relaxed">Rare pricing errors may result in cancellation and a refund.</p>
          </div>
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Removing Service Providers</h3>
            <p className="leading-relaxed">Goldsainte Ai / Inc. may remove Service Providers for contractual breaches or inaccurate descriptions.</p>
          </div>
        </section>

        {/* Section 12 */}
        <section id="section-12" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">12. Overbooking</h2>
          <p className="leading-relaxed">
            Service Providers must honor confirmed bookings.
          </p>
          <p className="leading-relaxed">
            If overbooked, they must provide solutions promptly.
          </p>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. can assist in finding alternatives.
          </p>
          
          <div className="mt-6">
            <h3 className="text-xl font-semibold">Refunds</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>If the Service Provider processed payment, they refund directly.</li>
              <li>If Goldsainte Ai / Inc. processed payment, we refund within ~5 business days.</li>
            </ul>
          </div>
        </section>

        {/* Section 13 */}
        <section id="section-13" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">13. Private and Public Transportation</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">13.1 Scope</h3>
              <p className="leading-relaxed">
                Applies to all Private and Public Transportation products and services, in addition to general Travel Experiences terms.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold">13.2 Contractual Relationship</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Private Transportation: Contract with Service Provider or via Third-Party Aggregator.</li>
                <li>Public Transportation: Service Provider's terms apply.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">13.3 Responsibilities</h3>
              
              <h4 className="font-semibold mt-4">Goldsainte Ai / Inc.:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provides Platform for booking and communicates details to Service Providers.</li>
                <li>Supplies contact info for Private Transportation.</li>
                <li>Ensures vehicle size and passenger details are relayed to the Service Provider.</li>
              </ul>

              <h4 className="font-semibold mt-4">You:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li>Confirm booking details and provide accurate information.</li>
                <li>Ensure passengers comply with all applicable terms.</li>
                <li>Arrive on time and keep phones available for communication.</li>
                <li>Provide flight details for airport pickups.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">13.4 Price and Payment</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Goldsainte Ai / Inc. arranges payment unless the Service Provider handles it directly.</li>
                <li>Pre-booked private transport includes tolls, taxes, and surcharges.</li>
                <li>Public transport tickets must be kept with you; extra charges may apply if lost.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">13.5 Amendments, Cancellations, and Refunds</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cancellation policies depend on Service Provider or aggregator.</li>
                <li>Refunds are processed within five business days where applicable.</li>
                <li>Private Transportation: Refund possible if driver fails to arrive on time or due to Service Provider error.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">13.6 Additional Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Drivers' waiting times are listed in confirmation emails.</li>
                <li>Repair or cleaning fees for unreasonable passenger behavior are the responsibility of the passenger.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 14 */}
        <section id="section-14" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">14. Cruises</h2>
          <p className="leading-relaxed">
            Goldsainte Ai / Inc. does not resell or provide cruises. Bookings are made directly with the cruise provider, who sets their own terms.
          </p>
        </section>

        {/* Section 15 - Dictionary */}
        <section id="section-15" className="space-y-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2">15. Goldsainte Dictionary (Key Terms)</h2>
          <p className="leading-relaxed">
            Account, Accommodation, Attraction, Booking, Platform, Service Provider, Travel Experience, Payment Method, Rewards, Wallet, etc., are defined per context throughout these Terms.
          </p>
        </section>

        {/* Service-Specific: Attractions */}
        <section id="attractions" className="space-y-4 mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2 bg-accent/30 p-4 rounded-lg">2. Attractions</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold">2A. Definitions and Who We Are</h3>
              <p className="leading-relaxed mt-2">
                Some words used here have specific meanings. Refer to the Goldsainte Ai / Inc. dictionary for full definitions.
              </p>
              <p className="leading-relaxed">
                When you book an Attraction, Goldsainte Ai / Inc. provides and is responsible for the Platform, but not the Travel Experience itself.
              </p>
              <p className="leading-relaxed font-semibold">
                Goldsainte Ai / Inc. is incorporated in the United States, with its registered address at: 850 New Burton Road, Suite 201, Dover, DE, 19904, County of Kent
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2B. How Our Service Works</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. provides a Platform to find and book Attraction services.
              </p>
              <p className="leading-relaxed">
                When you make a booking, you enter into a contract with the Service Provider or a Third-Party Aggregator.
              </p>
              <p className="leading-relaxed">
                Information on the Platform is provided by Service Providers and Aggregators. We make every effort to keep this information current.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2C. Who We Work With</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>We only display Service Providers or Third-Party Aggregators with whom we have a contractual relationship.</li>
                <li>Third-Party Aggregators may act as intermediaries or resell Attraction services.</li>
                <li>Some Attractions may also be offered outside our Platform, so our listings may not be exhaustive.</li>
                <li>The Platform shows available Attractions worldwide, tailored to your preferences.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2D. How We Make Money</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. does not buy or resell services. We earn a commission from Service Providers or Aggregators after a booking is made.
              </p>
              <p className="leading-relaxed">
                No booking fees are charged to you.
              </p>
              <p className="leading-relaxed">
                Attractions labeled "Ad" have paid for placement on the Platform.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2E. Recommendation Systems</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. uses recommendation systems to help you discover Attractions you might like.
              </p>
              <p className="leading-relaxed font-semibold">Factors include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Search criteria (destination, date, etc.)</li>
                <li>Past Platform interactions (unless personalized recommendations are turned off)</li>
                <li>Current browsing location</li>
                <li>Attraction popularity and performance metrics</li>
              </ul>
              
              <p className="leading-relaxed font-semibold mt-4">Default sorting:</p>
              <p className="leading-relaxed">
                Top Picks: Attractions with high booking rates, positive reviews, and availability appear first.
              </p>
              
              <p className="leading-relaxed font-semibold mt-4">Other sorting options:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Most popular</li>
                <li>Lowest price</li>
                <li>Distance from your accommodation</li>
                <li>Best reviewed</li>
              </ul>
              
              <p className="leading-relaxed mt-4">
                Filters allow narrowing by category, price, city, features (e.g., free cancellation, skip the line), review score, time, location, and language.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2F. Reviews</h3>
              <p className="leading-relaxed mt-2">
                Guest reviews are ranked by relevance, prioritizing those with comments and factoring in language.
              </p>
              <p className="leading-relaxed">
                You may sort reviews by newest first or oldest first. All reviews must comply with Content Standards and Guidelines.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2G. Prices</h3>
              <p className="leading-relaxed mt-2">
                Rates are set by Service Providers or Aggregators. You agree to pay all applicable charges, including extras, insurance, and taxes.
              </p>
              <p className="leading-relaxed">
                Currency conversions are for reference only; actual charges may vary.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2H. Payments</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. organizes payment where applicable. Specific payment details are provided at booking.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">2I. Help and Advice – If the Unexpected Happens</h3>
              <p className="leading-relaxed mt-2">
                Contact us via your booking, our app, or the Help Center. Provide:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Booking confirmation and PIN, contact info, email used</li>
                <li>Summary of the issue and desired outcome</li>
                <li>Supporting documents (receipts, photos, statements)</li>
              </ul>
              <p className="leading-relaxed mt-2">We will do our best to help you quickly.</p>
            </div>
          </div>
        </section>

        {/* Service-Specific: Car Rentals */}
        <section id="car-rentals" className="space-y-4 mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2 bg-accent/30 p-4 rounded-lg">3. Car Rentals</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold">3A. Definitions and Who We Are</h3>
              <p className="leading-relaxed mt-2">
                Check the Goldsainte Ai / Inc. dictionary for terms.
              </p>
              <p className="leading-relaxed">
                When you book a Rental, Goldsainte Ai / Inc. provides and manages the Platform but does not provide the car rental itself.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3B. How Our Service Works</h3>
              <p className="leading-relaxed mt-2">
                Our Platform allows you to compare bookings from multiple rental companies.
              </p>
              <p className="leading-relaxed">
                When you book, you enter a contract with Goldsainte Ai / Inc. for booking management.
              </p>
              <p className="leading-relaxed">
                Signing the Rental Agreement at pickup creates a contract with the rental company.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3C. Who We Work With</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Only rental companies with a contractual relationship with Goldsainte Ai / Inc. are displayed.</li>
                <li>Some may also offer services outside the Platform.</li>
                <li>All are professional traders verified by our team.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3D. How We Make Money</h3>
              <p className="leading-relaxed mt-2">Goldsainte Ai / Inc. earns commission via:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Direct commission agreements with rental companies</li>
                <li>Applying a markup to net rates</li>
              </ul>
              <p className="leading-relaxed mt-2">Cars labeled "Ad" indicate paid promotion.</p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3E. Recommendation Systems</h3>
              <p className="leading-relaxed mt-2">Factors influencing recommendations include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Search criteria (location, dates)</li>
                <li>Past interactions with the Platform</li>
                <li>Provider performance</li>
                <li>Car features (price, size, specs)</li>
              </ul>
              
              <p className="leading-relaxed font-semibold mt-4">Sorting options:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Recommended: Default, based on multiple weighted factors</li>
                <li>Price, distance, or rating</li>
              </ul>
              
              <p className="leading-relaxed mt-2">Filters allow further refinement</p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3F. Reviews</h3>
              <p className="leading-relaxed mt-2">
                After a rental, guests may leave reviews that help other customers.
              </p>
              <p className="leading-relaxed">
                Reviews may be used for marketing or shared with rental companies to improve service.
              </p>
              <p className="leading-relaxed">
                All reviews comply with Content Standards and Guidelines.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3G. Prices</h3>
              <p className="leading-relaxed mt-2">
                Rental rates are set by Service Providers. You are responsible for all costs, including extras, insurance, and taxes.
              </p>
              <p className="leading-relaxed">
                Currency conversions are informational only.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3H. Payments</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. organizes payment. See booking for details.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">3I. Help and Advice – If the Unexpected Happens</h3>
              <p className="leading-relaxed mt-2">
                Contact us via your booking, app, or Help Center with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Booking reference and email</li>
                <li>Summary of the issue</li>
                <li>Supporting documents (statements, agreements, receipts, photos)</li>
              </ul>
              <p className="leading-relaxed mt-2">We will assist promptly.</p>
            </div>
          </div>
        </section>

        {/* Service-Specific: Flights */}
        <section id="flights" className="space-y-4 mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2 bg-accent/30 p-4 rounded-lg">4. Flights</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold">4A. Definitions and Who We Are</h3>
              <p className="leading-relaxed mt-2">
                Check the Goldsainte Ai / Inc. dictionary for terms.
              </p>
              <p className="leading-relaxed">
                When you book a Flight, Goldsainte Ai / Inc. provides the Platform but not the Flight itself.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4B. How Our Service Works</h3>
              <p className="leading-relaxed mt-2">
                We provide a Platform to find and book Flights.
              </p>
              <p className="leading-relaxed">
                Contracts are with Service Providers and Third-Party Aggregators.
              </p>
              <p className="leading-relaxed">
                Information comes from Service Providers and Aggregators and is updated regularly.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4C. Who We Work With</h3>
              <p className="leading-relaxed mt-2">
                Only Service Providers with contractual relationships with Third-Party Aggregators appear.
              </p>
              <p className="leading-relaxed">
                Some providers may offer flights outside the Platform.
              </p>
              <p className="leading-relaxed">
                Listings show available Flights worldwide.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4D. How We Make Money</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. receives commission from Third-Party Aggregators when bookings or extras (baggage, seat selection) are made.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4E. Recommendation Systems</h3>
              <p className="leading-relaxed mt-2">Recommendations are based on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Search criteria (destination, dates)</li>
                <li>Past interactions (unless personalized recommendations are turned off)</li>
                <li>Flight features, price, travel time, stops, baggage allowance</li>
                <li>Personalized suggestions for trips similar to yours</li>
              </ul>
              
              <p className="leading-relaxed font-semibold mt-4">Sorting options:</p>
              <p className="leading-relaxed">Best (default), Cheapest, Fastest. Filters include stops, duration, and airlines.</p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4F. Prices</h3>
              <p className="leading-relaxed mt-2">
                Rates are set by Service Providers or Aggregators. You pay all applicable charges.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4G. Payments</h3>
              <p className="leading-relaxed mt-2">
                Payment may be organized by Goldsainte Ai / Inc. or a Third-Party Aggregator.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">4H. Help and Advice – If the Unexpected Happens</h3>
              <p className="leading-relaxed mt-2">
                Contact us via booking, app, or Help Center with booking reference, PIN, summary, and supporting documents. We will assist promptly.
              </p>
            </div>
          </div>
        </section>

        {/* Service-Specific: Transportation */}
        <section id="transportation" className="space-y-4 mt-16">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold border-b pb-2 bg-accent/30 p-4 rounded-lg">5. Private and Public Transportation</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold">5A. Definitions and Who We Are</h3>
              <p className="leading-relaxed mt-2">
                See the Goldsainte Ai / Inc. dictionary for definitions.
              </p>
              <p className="leading-relaxed">
                When you book transportation, Goldsainte Ai / Inc. provides the Platform but not the service itself.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5B. How Our Service Works</h3>
              <p className="leading-relaxed mt-2">
                Our Platform allows comparing public and private transportation options.
              </p>
              <p className="leading-relaxed">
                Service Providers are independent companies.
              </p>
              <p className="leading-relaxed">
                Platform information is provided by Service Providers and updated regularly.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5C. Who We Work With</h3>
              <p className="leading-relaxed mt-2">
                Only Service Providers with a contractual relationship appear.
              </p>
              <p className="leading-relaxed">
                All are professional traders.
              </p>
              <p className="leading-relaxed">
                Listings may not be exhaustive.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5D. How We Make Money</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. earns commission from transportation providers after bookings.
              </p>
              <p className="leading-relaxed">
                No booking fees are charged.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5E. Recommendation Systems</h3>
              <p className="leading-relaxed mt-2">Recommendations are based on:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Search criteria (destination, dates, passengers)</li>
                <li>Provider performance</li>
                <li>Private transport ranking considers vehicle size, price, and availability</li>
                <li>Trains and buses ranked by price and convenience</li>
              </ul>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5F. Reviews</h3>
              <p className="leading-relaxed mt-2">
                Guests may leave reviews for journeys, which may be shared with Service Providers or used for marketing.
              </p>
              <p className="leading-relaxed">
                Reviews comply with Content Standards and Guidelines.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5G. Prices</h3>
              <p className="leading-relaxed mt-2">
                Booking prices include Service Provider rates and Goldsainte Ai / Inc. commission.
              </p>
              <p className="leading-relaxed">
                You agree to pay all applicable charges (tolls, fees). Currency conversions are informational.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5H. Payments</h3>
              <p className="leading-relaxed mt-2">
                Goldsainte Ai / Inc. organizes payment where applicable.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold">5I. Help and Advice – If the Unexpected Happens</h3>
              <p className="leading-relaxed mt-2">
                Contact us with booking reference, contact info, and any supporting documents. Most issues are resolved within 14 days.
              </p>
            </div>
          </div>
        </section>

      </div>

      {/* Back to Top Button */}
      <div className="flex justify-center mt-12 pt-8 border-t">
        <Button onClick={scrollToTop} variant="outline" className="gap-2">
          <ChevronUp className="h-4 w-4" />
          Back to Top
        </Button>
      </div>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
        <p>
          For more information, visit our <Link to="/about" className="text-primary hover:underline">About page</Link> or <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
};

export default WhatWeDo;
