import { Calendar, CreditCard, Megaphone, HeadphonesIcon } from "lucide-react";
import driverImage from "@/assets/partners/professional-driver.jpg";
import techImage from "@/assets/partners/technology-platform.jpg";
import successImage from "@/assets/partners/success-growth.jpg";
import cityImage from "@/assets/partners/city-services.jpg";

const benefits = [
  {
    icon: Calendar,
    title: "Flexible Schedule",
    subtitle: "Work on Your Terms",
    description: "Control your availability and schedule. Accept bookings when it suits your business. No minimum hours required.",
    image: driverImage,
    imagePosition: "left" as const
  },
  {
    icon: CreditCard,
    title: "Guaranteed Payments",
    subtitle: "Get Paid On Time, Every Time",
    description: "Secure payment processing with weekly direct deposits. Track all earnings in real-time through your dashboard.",
    image: techImage,
    imagePosition: "right" as const
  },
  {
    icon: Megaphone,
    title: "Marketing Support",
    subtitle: "We Bring You Customers",
    description: "Benefit from our promotional features, premium placement options, and extensive marketing campaigns to luxury travelers.",
    image: successImage,
    imagePosition: "left" as const
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    subtitle: "Never Alone on the Road",
    description: "Dedicated partner support team available round the clock. Technical assistance, customer service backup, and business guidance.",
    image: cityImage,
    imagePosition: "right" as const
  }
];

export const BenefitsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Partner Benefits</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to succeed and grow your transportation business
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-24">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                benefit.imagePosition === 'right' ? 'md:flex-row-reverse' : ''
              }`}
            >
              {/* Image */}
              <div className={`${benefit.imagePosition === 'right' ? 'md:order-2' : ''}`}>
                <div className="relative rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src={benefit.image} 
                    alt={benefit.title}
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>

              {/* Content */}
              <div className={`${benefit.imagePosition === 'right' ? 'md:order-1' : ''}`}>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <benefit.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-primary font-semibold mb-2">{benefit.subtitle}</div>
                <h3 className="text-3xl md:text-4xl font-bold mb-4">{benefit.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
