import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import ServiceCard from "@/components/service-card";
import { 
  MapPin, 
  Search, 
  Zap, 
  Wrench, 
  Scissors, 
  Cake, 
  ShoppingBasket, 
  Home as HomeIcon,
  Gift,
  Percent,
  Sparkles,
  Share,
  Phone,
  Sandwich,
  UtensilsCrossed
} from "lucide-react";

const services = [
  {
    name: "Electrician",
    slug: "electrician",
    icon: Zap,
    description: "Find certified electricians near you for all electrical work",
    badge: "Available 24/7",
    color: "accent"
  },
  {
    name: "Plumber",
    slug: "plumber", 
    icon: Wrench,
    description: "Expert plumbing services for repairs and installations",
    badge: "Quick Response",
    color: "primary"
  },
  {
    name: "Beauty Parlor",
    slug: "beauty",
    icon: Scissors,
    description: "Professional beauty services at your convenience",
    badge: "10% Platform Fee",
    color: "secondary"
  },
  {
    name: "Cake Shop",
    slug: "cake-shop",
    icon: Cake,
    description: "Order delicious custom cakes for every occasion",
    badge: "View Gallery",
    color: "destructive"
  },
  {
    name: "Grocery (GMart)",
    slug: "grocery",
    icon: ShoppingBasket,
    description: "Order fresh groceries with fast home delivery",
    badge: "₹7/km delivery",
    color: "secondary"
  },
  {
    name: "No Brokerage",
    slug: "rental",
    icon: HomeIcon,
    description: "Find rental properties directly from owners",
    badge: "Zero Brokerage",
    color: "primary"
  },
  {
    name: "Street Food",
    slug: "street-food",
    icon: Sandwich,
    description: "Discover delicious street food vendors nearby",
    badge: "Hot Deals",
    color: "accent"
  },
  {
    name: "Restaurants",
    slug: "restaurants",
    icon: UtensilsCrossed,
    description: "Book tables and browse menus from top restaurants",
    badge: "Reserve Now",
    color: "destructive"
  }
];

const offers = [
  {
    title: "50% OFF",
    subtitle: "On your first electrician or plumber service",
    code: "WELCOME50",
    badge: "New User",
    color: "accent",
    icon: Gift
  },
  {
    title: "Free Delivery",
    subtitle: "On orders above ₹500 from GMart",
    code: "FREEDEL500",
    badge: "Grocery",
    color: "secondary",
    icon: Percent
  },
  {
    title: "20% Cashback",
    subtitle: "On all beauty parlor bookings this week",
    code: "BEAUTY20",
    badge: "Beauty",
    color: "primary",
    icon: Sparkles
  }
];

export default function Home() {
  const [selectedService, setSelectedService] = useState("");
  const [location, setLocation] = useState("");

  const { data: serviceCategories } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const handleSearch = () => {
    if (selectedService && location) {
      // Navigate to the selected service page
      window.location.href = `/${selectedService}?location=${encodeURIComponent(location)}`;
    }
  };

  return (
    <div>
      {/* Services Section */}
      <section id="services" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose from our wide range of professional services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.slug} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      <section id="offers" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Special Offers & Promotions
            </h2>
            <p className="text-muted-foreground text-lg">
              Don't miss out on our exclusive deals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer, index) => (
              <Card 
                key={index} 
                className={`bg-gradient-to-br ${
                  offer.color === 'accent' ? 'from-accent to-accent/80' :
                  offer.color === 'secondary' ? 'from-secondary to-secondary/80' :
                  'from-primary to-primary/80'
                } text-white shadow-lg`}
                data-testid={`card-offer-${index}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                        {offer.badge}
                      </span>
                    </div>
                    <offer.icon className="h-8 w-8 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{offer.title}</h3>
                  <p className="mb-4 opacity-90">{offer.subtitle}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Code: {offer.code}</span>
                    <Button 
                      variant="secondary" 
                      size="sm"
                      data-testid={`button-claim-${index}`}
                    >
                      Claim Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Referral Banner */}
          <Card className="mt-8 shadow-lg overflow-hidden">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-1 p-8">
                <div className="inline-block bg-destructive/10 text-destructive px-3 py-1 rounded-full text-xs font-bold uppercase mb-3">
                  Limited Time
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  Refer a Friend, Get ₹200 Credit
                </h3>
                <p className="text-muted-foreground mb-6">
                  Share ServiceHub with friends and both of you get ₹200 credit when they complete their first booking
                </p>
                <Button className="flex items-center space-x-2" data-testid="button-refer">
                  <Share className="h-4 w-4" />
                  <span>Refer Now</span>
                </Button>
              </div>
              <div className="flex-1 p-8">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Friends celebrating together" 
                  className="rounded-lg shadow-md w-full h-64 object-cover"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
