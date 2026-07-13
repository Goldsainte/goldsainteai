import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export const TermsDialog = ({ children }: { children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-secondary text-2xl">Goldsainte Terms & Conditions</DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-4 text-sm">
          <p className="font-semibold">Effective Date: January 1, 2025</p>
          
          <section>
            <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
            <p>By registering as a travel agent on the Goldsainte platform, you agree to be bound by these Terms & Conditions. Goldsainte reserves the right to modify these terms at any time, with notice provided to all registered agents.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Agent Eligibility</h3>
            <p>To qualify as a Goldsainte travel agent, you must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Hold valid business registration and required travel agent licenses</li>
              <li>Maintain professional liability insurance</li>
              <li>Have a minimum of 2 years experience in the travel industry (exceptions may apply)</li>
              <li>Pass Goldsainte's verification and background checks</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Platform Usage</h3>
            <p>Agents agree to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provide accurate, complete, and current information in all listings</li>
              <li>Honor all bookings confirmed through the platform</li>
              <li>Maintain professional communication standards with clients</li>
              <li>Process refunds and cancellations according to stated policies</li>
              <li>Not engage in fraudulent, deceptive, or illegal activities</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Commission and Payments</h3>
            <p>Goldsainte charges a platform commission on all completed bookings. Payment terms include:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Commission rates are set at onboarding and may be adjusted with 30 days notice</li>
              <li>Payments are processed within 14 business days after service completion</li>
              <li>Agents are responsible for all applicable taxes on earnings</li>
              <li>Chargebacks and refunds may result in commission adjustments</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Content and Intellectual Property</h3>
            <p>Agents retain ownership of their uploaded content but grant Goldsainte a non-exclusive license to display, promote, and distribute this content. Agents must not infringe on third-party intellectual property rights.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Liability and Indemnification</h3>
            <p>Agents indemnify and hold Goldsainte harmless from all claims, damages, and expenses arising from their services, including but not limited to travel disruptions, cancellations, and client disputes. Goldsainte is not liable for agent actions or service quality.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Termination</h3>
            <p>Goldsainte may suspend or terminate agent accounts for violations of these terms, fraudulent activity, or quality concerns. Agents may terminate their account with 30 days written notice, subject to completion of pending bookings.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Dispute Resolution</h3>
            <p>Any disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The prevailing party shall be entitled to reasonable attorney's fees.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Governing Law</h3>
            <p>These terms are governed by the laws of the jurisdiction in which Goldsainte is incorporated, without regard to conflict of law provisions.</p>
          </section>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export const PrivacyDialog = ({ children }: { children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-secondary text-2xl">Goldsainte Privacy Policy</DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-4 text-sm">
          <p className="font-semibold">Effective Date: January 1, 2025</p>
          
          <section>
            <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
            <p>Goldsainte collects the following information from travel agents:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Business Information:</strong> Agency name, registration numbers, licenses, certifications</li>
              <li><strong>Contact Information:</strong> Email, phone, business address</li>
              <li><strong>Financial Information:</strong> Payment processor details, tax IDs, bank information</li>
              <li><strong>Professional Information:</strong> Experience, specializations, languages, service offerings</li>
              <li><strong>Platform Activity:</strong> Listings, bookings, communications, ratings, and reviews</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
            <p>We use collected information to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Verify agent credentials and maintain platform integrity</li>
              <li>Process payments and financial transactions</li>
              <li>Facilitate bookings and client communications</li>
              <li>Improve platform services and user experience</li>
              <li>Comply with legal and regulatory requirements</li>
              <li>Send operational notifications and marketing communications (with consent)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
            <p>We share agent information with:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Clients:</strong> Public profile information, ratings, and reviews</li>
              <li><strong>Payment Processors:</strong> Financial information for payment processing</li>
              <li><strong>Service Providers:</strong> Third-party vendors assisting with platform operations</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect rights and safety</li>
            </ul>
            <p className="mt-2">We never sell agent data to third parties for marketing purposes.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
            <p>Goldsainte employs industry-standard security measures including encryption, secure servers, and access controls. However, no system is completely secure, and we cannot guarantee absolute data security.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Data Retention</h3>
            <p>We retain agent information for as long as your account is active and for 7 years after account closure for legal and compliance purposes. Financial records are retained according to applicable tax laws.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
            <p>Agents have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Access and review their personal information</li>
              <li>Request corrections to inaccurate data</li>
              <li>Request deletion of data (subject to legal retention requirements)</li>
              <li>Opt-out of marketing communications</li>
              <li>Export their data in a portable format</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. GDPR Compliance</h3>
            <p>For agents in the European Union, we comply with GDPR requirements including the right to data portability, the right to be forgotten, and breach notification obligations.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Cookies and Tracking</h3>
            <p>We use cookies and similar technologies for authentication, preferences, and analytics. You can control cookie settings through your browser.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Changes to Privacy Policy</h3>
            <p>We may update this policy periodically. Material changes will be communicated via email or platform notification at least 30 days before taking effect.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">10. Contact Us</h3>
            <p>For privacy-related inquiries, contact us at: support@goldsainte.com</p>
          </section>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export const VendorDialog = ({ children }: { children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-secondary text-2xl">Goldsainte Vendor Agreement</DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-4 text-sm">
          <p className="font-semibold">Effective Date: January 1, 2025</p>
          
          <section>
            <h3 className="font-semibold text-base mb-2">1. Vendor Relationship</h3>
            <p>This agreement establishes an independent contractor relationship between the travel agent (Vendor) and Goldsainte. Vendors are not employees, partners, or agents of Goldsainte and are solely responsible for their business operations, taxes, and compliance.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Service Standards</h3>
            <p>Vendors agree to maintain high professional standards including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Responding to client inquiries within 24 hours</li>
              <li>Providing accurate travel information and pricing</li>
              <li>Honoring confirmed bookings without unauthorized changes</li>
              <li>Maintaining a minimum 4.0-star rating (over 10 reviews)</li>
              <li>Processing refunds within stated timeframes</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Listing Requirements</h3>
            <p>All service listings must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Contain accurate, complete, and current information</li>
              <li>Include clear pricing with no hidden fees</li>
              <li>State cancellation and refund policies upfront</li>
              <li>Use authentic, legally-owned photos and descriptions</li>
              <li>Comply with truth-in-advertising standards</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Commission Structure</h3>
            <p>Goldsainte earns a commission on all completed bookings:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Flat rate: 3.5% of the booking value on the advisor side (travelers pay a separate 3.5% service fee)</li>
              <li>Commission is calculated on the total booking value excluding taxes</li>
              <li>Payouts are released from escrow in milestones per the platform's release process</li>
              <li>Rates may be adjusted with 30 days advance notice</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Payment Terms</h3>
            <p>Payments are processed according to the following schedule:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Funds are released 14 days after service completion or departure date</li>
              <li>Payment methods: Bank transfer, PayPal, Payoneer, or Stripe</li>
              <li>Minimum payout threshold: $100 USD or equivalent</li>
              <li>Currency conversion fees apply for non-USD payments</li>
              <li>Vendors responsible for all tax reporting and remittance</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Cancellations and Refunds</h3>
            <p>Vendors must:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Honor cancellation policies stated in listings</li>
              <li>Process approved refunds within 5-7 business days</li>
              <li>Bear costs of vendor-caused cancellations or errors</li>
              <li>Provide alternative arrangements when possible</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Insurance and Liability</h3>
            <p>Vendors must maintain:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Professional liability insurance (minimum $1M coverage)</li>
              <li>General business insurance as required by jurisdiction</li>
              <li>Errors and omissions coverage for travel services</li>
            </ul>
            <p className="mt-2">Vendors are solely liable for services provided and indemnify Goldsainte against all related claims.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Intellectual Property</h3>
            <p>Vendors grant Goldsainte a non-exclusive, worldwide license to display listing content, including text, images, and videos, for marketing and promotional purposes. Vendors warrant they own or have rights to all uploaded content.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Prohibited Activities</h3>
            <p>Vendors may not:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Circumvent the platform to complete transactions off-platform</li>
              <li>Manipulate reviews or ratings</li>
              <li>Share client contact information without consent</li>
              <li>Engage in discriminatory practices</li>
              <li>Misrepresent credentials, services, or pricing</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">10. Performance Monitoring</h3>
            <p>Goldsainte monitors vendor performance through metrics including response time, cancellation rate, client satisfaction, and dispute resolution. Consistently poor performance may result in account suspension or termination.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">11. Termination</h3>
            <p>Either party may terminate this agreement with 30 days written notice. Immediate termination may occur for:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Breach of agreement terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Loss of required licenses or insurance</li>
              <li>Failure to meet performance standards</li>
            </ul>
            <p className="mt-2">Upon termination, vendors must complete all pending bookings or arrange suitable alternatives.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">12. Dispute Resolution</h3>
            <p>Disputes between vendors and Goldsainte shall be resolved through mediation, followed by binding arbitration if necessary. Disputes between vendors and clients are primarily the vendor's responsibility, though Goldsainte may assist in resolution.</p>
          </section>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);

export const InsuranceDialog = ({ children }: { children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent className="max-w-3xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle className="font-secondary text-2xl">Travel Insurance & Liability Requirements</DialogTitle>
      </DialogHeader>
      <ScrollArea className="h-[60vh] pr-4">
        <div className="space-y-4 text-sm">
          <p className="font-semibold">Effective Date: January 1, 2025</p>
          
          <section>
            <h3 className="font-semibold text-base mb-2">1. Mandatory Insurance Coverage</h3>
            <p>All Goldsainte travel agents must maintain the following insurance coverage:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Professional Liability Insurance:</strong> Minimum $1,000,000 per occurrence</li>
              <li><strong>Errors & Omissions Insurance:</strong> Minimum $1,000,000 aggregate</li>
              <li><strong>General Liability Insurance:</strong> Minimum $500,000 per occurrence</li>
              <li><strong>Cyber Liability Insurance:</strong> Recommended minimum $250,000 (required for agencies handling 100+ bookings/year)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">2. Insurance Documentation</h3>
            <p>Vendors must provide:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Current certificates of insurance upon onboarding</li>
              <li>Updated certificates within 15 days of policy renewal</li>
              <li>Proof that Goldsainte is listed as an additional insured party</li>
              <li>Notification of any policy cancellations or lapses within 48 hours</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">3. Travel Insurance Offerings</h3>
            <p>Agents are required to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Offer comprehensive travel insurance to all clients</li>
              <li>Clearly explain insurance benefits, exclusions, and limitations</li>
              <li>Provide insurance options from reputable, licensed carriers</li>
              <li>Document client acceptance or waiver of insurance coverage</li>
              <li>Not misrepresent insurance coverage or benefits</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">4. Liability Limitations</h3>
            <p>Agents acknowledge and accept:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Goldsainte acts as a marketplace platform only and bears no liability for travel services</li>
              <li>Agents are solely responsible for service quality, fulfillment, and client satisfaction</li>
              <li>Agents bear full responsibility for travel disruptions, delays, cancellations, and emergencies</li>
              <li>Client agreements must clearly state agent liability limitations and insurance requirements</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">5. Indemnification</h3>
            <p>Agents agree to indemnify, defend, and hold harmless Goldsainte, its officers, directors, employees, and affiliates from all claims, damages, losses, and expenses (including attorney's fees) arising from:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Travel services provided by the agent</li>
              <li>Breach of this agreement or applicable laws</li>
              <li>Negligence, errors, or omissions in service delivery</li>
              <li>Third-party claims related to agent's business operations</li>
              <li>Data breaches or privacy violations</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">6. Client Disclosure Requirements</h3>
            <p>Agents must disclose to clients:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Their independent contractor status (not Goldsainte employees)</li>
              <li>Cancellation policies and refund terms</li>
              <li>Travel insurance options and recommendations</li>
              <li>Liability limitations and dispute resolution processes</li>
              <li>Force majeure and unforeseen circumstance policies</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">7. Force Majeure Events</h3>
            <p>Neither party is liable for failure to perform due to circumstances beyond reasonable control, including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Natural disasters, pandemics, or acts of God</li>
              <li>War, terrorism, or civil unrest</li>
              <li>Government actions or travel restrictions</li>
              <li>Airline or supplier bankruptcies</li>
            </ul>
            <p className="mt-2">However, agents must make reasonable efforts to mitigate client impact and provide alternatives or refunds as appropriate.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">8. Claims Process</h3>
            <p>In the event of a claim or dispute:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Agents must notify Goldsainte within 24 hours</li>
              <li>Provide all relevant documentation and communications</li>
              <li>Cooperate fully with investigation and resolution efforts</li>
              <li>Submit insurance claims to their carriers as appropriate</li>
              <li>Not admit fault or liability without prior consultation</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">9. Regulatory Compliance</h3>
            <p>Agents must comply with all applicable travel industry regulations including:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Travel agent licensing requirements in their jurisdiction</li>
              <li>Consumer protection laws and regulations</li>
              <li>Data protection and privacy laws (GDPR, CCPA, etc.)</li>
              <li>Truth-in-advertising and disclosure requirements</li>
              <li>Financial bonding or trust account requirements where applicable</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">10. Suspension for Insurance Lapse</h3>
            <p>Goldsainte reserves the right to immediately suspend or terminate agent accounts if insurance coverage lapses, is cancelled, or falls below required minimums. Reactivation requires proof of renewed coverage and may be subject to additional review.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">11. Updates and Modifications</h3>
            <p>Goldsainte may update insurance and liability requirements as industry standards evolve or regulatory requirements change. Agents will be notified at least 60 days before new requirements take effect.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">12. Questions and Support</h3>
            <p>For questions regarding insurance requirements or claims, contact: support@goldsainte.com</p>
          </section>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
);
