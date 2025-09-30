import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SearchFilters } from "@/components/SearchFilters";
import { PropertyCard } from "@/components/PropertyCard";
import { Footer } from "@/components/Footer";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";
import property4 from "@/assets/property4.jpg";
import property5 from "@/assets/property5.jpg";
import property6 from "@/assets/property6.jpg";

const properties = [
  {
    id: 1,
    image: property1,
    title: "Grand Luxury Hotel & Spa",
    location: "Miami Beach, Florida",
    rating: 9.2,
    reviews: 2847,
    price: 299,
    originalPrice: 399,
  },
  {
    id: 2,
    image: property2,
    title: "Oceanfront Paradise Resort",
    location: "Maldives",
    rating: 9.5,
    reviews: 1923,
    price: 599,
    originalPrice: 799,
  },
  {
    id: 3,
    image: property3,
    title: "Metropolitan Suites Downtown",
    location: "New York City, NY",
    rating: 8.9,
    reviews: 3156,
    price: 249,
  },
  {
    id: 4,
    image: property4,
    title: "Alpine Peak Lodge",
    location: "Aspen, Colorado",
    rating: 9.1,
    reviews: 1567,
    price: 449,
    originalPrice: 599,
  },
  {
    id: 5,
    image: property5,
    title: "Heritage Boutique Hotel",
    location: "Paris, France",
    rating: 9.4,
    reviews: 2234,
    price: 379,
  },
  {
    id: 6,
    image: property6,
    title: "Tropical Villa Retreat",
    location: "Bali, Indonesia",
    rating: 9.3,
    reviews: 1891,
    price: 329,
    originalPrice: 429,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Hero />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="flex flex-col md:flex-row gap-8">
          <SearchFilters />
          
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">
                {properties.length} properties found
              </h2>
              <p className="text-muted-foreground">
                Compare prices from different travel sites to find the best deals
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
