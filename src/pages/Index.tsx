import { SearchBar } from "@/components/SearchBar";
import { SimplePropertyCard } from "@/components/SimplePropertyCard";
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
    <main className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-12">
          <h1 className="text-4xl md:text-5xl font-primary font-bold text-foreground">
            Find your perfect stay
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover exceptional hotels, resorts, and accommodations worldwide
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar />

        {/* Properties Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {properties.length} properties available
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Handpicked stays for your perfect vacation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <SimplePropertyCard key={property.id} {...property} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
