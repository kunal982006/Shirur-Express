import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Sandwich,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";

// NOTE: Yeh static data tumhari file mein yahan tha.
// Ideally, isko src/data/constants.ts mein move kar dena chahiye.
const services = [
  { name: "Electrician", slug: "electrician", icon: Zap, description: "Find certified electricians near you for all electrical work", badge: "Available 24/7", color: "accent" },
  { name: "Plumber", slug: "plumber", icon: Wrench, description: "Expert plumbing services for repairs and installations", badge: "Quick Response", color: "primary" },
  { name: "Beauty Parlor", slug: "beauty", icon: Scissors, description: "Professional beauty services at your convenience", badge: "10% Platform Fee", color: "secondary" },
  { name: "Cake Shop", slug: "cake-shop", icon: Cake, description: "Order delicious custom cakes for every occasion", badge: "View Gallery", color: "destructive" },
  { name: "Grocery (GMart)", slug: "grocery", icon: ShoppingBasket, description: "Order fresh groceries with fast home delivery", badge: "₹7/km delivery", color: "secondary" },
  { name: "No Brokerage", slug: "rental", icon: HomeIcon, description: "Find rental properties directly from owners", badge: "Zero Brokerage", color: "primary" },
  { name: "Street Food", slug: "street-food", icon: Sandwich, description: "Discover delicious street food vendors nearby", badge: "Hot Deals", color: "accent" },
  { name: "Restaurants", slug: "restaurants", icon: UtensilsCrossed, description: "Book tables and browse menus from top restaurants", badge: "Reserve Now", color: "destructive" },
];

const offers = [
  { title: "50% OFF", subtitle: "On your first electrician or plumber service", code: "WELCOME50", badge: "New User", color: "accent", icon: Gift },
  { title: "Free Delivery", subtitle: "On orders above ₹500 from GMart", code: "FREEDEL500", badge: "Grocery", color: "secondary", icon: Percent },
  { title: "20% Cashback", subtitle: "On all beauty parlor bookings this week", code: "BEAUTY20", badge: "Beauty", color: "primary", icon: Sparkles },
];


export default function Home() {
  const [, navigate] = useLocation();

  const [selectedService, setSelectedService] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const { data: serviceCategories } = useQuery({
    queryKey: ["/api/service-categories"],
  });

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus('success');
        setLocation("Current GPS Location (Coordinates Captured)");
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setLocationStatus('error');
        alert("Unable to retrieve your location. Please type manually.");
        setLatitude(null);
        setLongitude(null);
        setLocation("");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearch = () => {
    if (selectedService && (location || (latitude && longitude))) {
      const coords = (latitude && longitude) ? `&lat=${latitude}&lng=${longitude}` : '';
      navigate(`/${selectedService}?location=${encodeURIComponent(location)}${coords}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section: Minimal Search Focus */}
      <section 
        className="py-16 md:py-20 bg-primary-foreground/5 relative overflow-hidden shadow-inner flex items-center justify-center" // Reduced Padding
        data-testid="hero-section"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">

          {/* 💥 HEADLINES DELETED 💥 */}

          {/* Integrated Search Bar with GPS - The only focus */}
          <div className="bg-card p-6 rounded-xl shadow-2xl max-w-4xl mx-auto border border-primary/10 transition-all hover:shadow-primary/20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

              {/* Service Select */}
              <div className="md:col-span-1">
                <label className="text-sm font-medium text-left block mb-1 text-muted-foreground/80">Service Type</label>
                <Select
                  value={selectedService}
                  onValueChange={setSelectedService}
                >
                  <SelectTrigger className="w-full text-left h-10">
                    <SelectValue placeholder="Select a Service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.slug} value={service.slug}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Input & GPS Button */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-medium text-left block mb-1 text-muted-foreground/80">Location (GPS Enabled)</label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter your Location or use GPS"
                      className="pl-10 h-10"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if(locationStatus === 'success' || locationStatus === 'error') {
                            setLocationStatus('idle');
                            setLatitude(null);
                            setLongitude(null);
                        }
                      }}
                      disabled={locationStatus === 'loading'}
                    />
                  </div>
                  <Button
                    type="button"
                    variant={locationStatus === 'success' ? 'secondary' : 'outline'}
                    size="icon"
                    onClick={handleLocationClick}
                    className="h-10 w-10 flex-shrink-0"
                    disabled={locationStatus === 'loading'}
                    data-testid="button-use-gps"
                  >
                    {locationStatus === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                  </Button>
                </div>
                {(locationStatus === 'success' && latitude) && (
                  <p className="text-xs text-green-600 mt-1 text-left">
                    GPS Coordinates Captured! (Lat: {latitude.toFixed(4)}, Lng: {longitude?.toFixed(4)})
                  </p>
                )}
                {(locationStatus === 'error' && location === 'Geolocation Failed') && (
                    <p className="text-xs text-destructive mt-1 text-left">
                        GPS Failed. Please type the location manually.
                    </p>
                )}
              </div>

              {/* Search Button */}
              <Button
                className="w-full h-10 md:col-span-1"
                onClick={handleSearch}
                disabled={!selectedService || (!location && !latitude)}
                data-testid="button-hero-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Search {selectedService ? selectedService : 'Services'}
              </Button>
            </div>
          </div>

          {/* Quick Link Buttons (Under Search Bar) */}
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-medium">
            <span className="text-muted-foreground hidden sm:inline">Top Services:</span>
            <Link to="/electrician" className="hover:text-primary transition bg-white/50 p-1 px-3 rounded-full shadow-sm">Electrician</Link>
            <Link to="/plumber" className="hover:text-primary transition bg-white/50 p-1 px-3 rounded-full shadow-sm">Plumber</Link>
            <Link to="/grocery" className="hover:text-primary transition bg-white/50 p-1 px-3 rounded-full shadow-sm">GMart Grocery</Link>
          </div>
        </div>
      </section>

      {/* Services Section - Now just the grid */}
      <section id="services" className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Browse All Categories
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

      {/* Special Offers Section */}
      <section id="offers" className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Exclusive Deals for You
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
                  offer.color === "accent"
                    ? "from-accent to-accent/80"
                    : offer.color === "secondary"
                    ? "from-secondary to-secondary/80"
                    : "from-primary to-primary/80"
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
                    <span className="text-sm font-medium">
                      Code: {offer.code}
                    </span>
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
                  Share ServiceHub with friends and both of you get ₹200 credit
                  when they complete their first booking
                </p>
                <Button
                  className="flex items-center space-x-2"
                  data-testid="button-refer"
                >
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