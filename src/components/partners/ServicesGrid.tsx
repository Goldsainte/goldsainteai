import { Plane, Clock, MapPin, Briefcase, Car } from "lucide-react";
import airportImage from "@/assets/partners/airport-transfer.webp";
import cityImage from "@/assets/partners/city-services.webp";
import corporateImage from "@/assets/partners/corporate-services.webp";
import fleetImage from "@/assets/partners/fleet-diversity.webp";

const services = [
  {
    title: "Airport Transfers",
    description: "Premium meet-and-greet services for arrivals and departures",
    icon: Plane,
    image: airportImage
  },
  {
    title: "Hourly Rentals",
    description: "Flexible hourly booking for business meetings and events",
    icon: Clock,
    image: cityImage
  },
  {
    title: "Point-to-Point",
    description: "Direct transfers between any two locations with style",
    icon: MapPin,
    image: corporateImage
  },
  {
    title: "Corporate Services",
    description: "Dedicated transportation solutions for businesses",
    icon: Briefcase,
    image: fleetImage
  }
];

const vehicleTypes = [
  { name: "Luxury Sedans", icon: Car },
  { name: "SUVs & Premium Vans", icon: Car },
  { name: "Executive Vehicles", icon: Car },
  { name: "Specialty Transportation", icon: Car }
];

export const ServicesGrid = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="font-secondary text-3xl md:text-4xl font-bold mb-4">Transportation Services We Support</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your services power complete travel experiences—not just rides, but seamless journeys integrated into curated itineraries
          </p>
        </div>

        {/* Service Types Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {services.map((service, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
            >
              <div className="aspect-[4/3] relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-end">
                  <div className="w-12 h-12 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <service.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-secondary text-lg font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-200 leading-relaxed">{service.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vehicle Types */}
        <div className="max-w-4xl mx-auto">
          <h3 className="font-secondary text-2xl font-bold text-center mb-8">Fleet Categories</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicleTypes.map((type, index) => (
              <div 
                key={index}
                className="bg-card p-6 rounded-lg border border-border text-center hover:border-primary/50 transition-colors"
              >
                <type.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="font-semibold">{type.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
