import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, UtensilsCrossed, Star, MapPin, Phone, Clock, Calendar, Users, Leaf } from "lucide-react";

const cuisineTypes = [
  { value: "all", label: "All Cuisines" },
  { value: "Indian", label: "Indian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Italian", label: "Italian" },
  { value: "Continental", label: "Continental" },
  { value: "Mexican", label: "Mexican" },
  { value: "Thai", label: "Thai" },
];

const menuCategories = [
  { value: "all", label: "All Items" },
  { value: "Starters", label: "Starters" },
  { value: "Main Course", label: "Main Course" },
  { value: "Desserts", label: "Desserts" },
  { value: "Beverages", label: "Beverages" },
];

const timeSlots = [
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "6:00 PM - 7:00 PM",
  "7:00 PM - 8:00 PM",
  "8:00 PM - 9:00 PM",
  "9:00 PM - 10:00 PM",
];

export default function Restaurants() {
  const { toast } = useToast();
  const [selectedCuisine, setSelectedCuisine] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Booking form state
  const [bookingDate, setBookingDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [numberOfGuests, setNumberOfGuests] = useState("2");
  const [specialRequests, setSpecialRequests] = useState("");

  const { data: restaurants, isLoading: loadingRestaurants } = useQuery<any[]>({
    queryKey: ["/api/service-providers", "restaurants"],
  });

  const { data: allMenuItems, isLoading: loadingMenu } = useQuery<any[]>({
    queryKey: ["/api/restaurant-menu-items"],
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/table-bookings`, "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Booking Requested",
        description: "Your table booking request has been sent to the restaurant.",
      });
      setBookingOpen(false);
      resetBookingForm();
      queryClient.invalidateQueries({ queryKey: ["/api/table-bookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    },
  });

  const resetBookingForm = () => {
    setBookingDate("");
    setTimeSlot("");
    setNumberOfGuests("2");
    setSpecialRequests("");
  };

  const handleBookTable = () => {
    if (!bookingDate || !timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select date and time slot",
        variant: "destructive",
      });
      return;
    }

    bookingMutation.mutate({
      providerId: selectedRestaurant.id,
      date: new Date(bookingDate),
      timeSlot,
      numberOfGuests: parseInt(numberOfGuests),
      specialRequests,
    });
  };

  // Filter menu items
  const filteredMenuItems = allMenuItems?.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (selectedCuisine !== "all" && item.cuisine !== selectedCuisine) return false;
    if (vegOnly && !item.isVeg) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-white hover:bg-white/20" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
            <UtensilsCrossed className="h-12 w-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Restaurants</h1>
          </div>
          <p className="text-lg md:text-xl opacity-90 max-w-3xl">
            Book tables at your favorite restaurants and explore diverse cuisines
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="bg-muted/30 py-6 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                <SelectTrigger data-testid="select-cuisine">
                  <SelectValue placeholder="Cuisine Type" />
                </SelectTrigger>
                <SelectContent>
                  {cuisineTypes.map((cuisine) => (
                    <SelectItem key={cuisine.value} value={cuisine.value}>
                      {cuisine.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Menu Category" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant={vegOnly ? "default" : "outline"}
              onClick={() => setVegOnly(!vegOnly)}
              className="flex items-center gap-2"
              data-testid="button-veg-filter"
            >
              <Leaf className="h-4 w-4" />
              Veg Only
            </Button>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Top Restaurants Near You</h2>
          
          {loadingRestaurants ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-48 bg-muted rounded-lg mb-4" />
                    <div className="h-6 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : restaurants && restaurants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Card key={restaurant.id} className="hover:shadow-lg transition-shadow" data-testid={`card-restaurant-${restaurant.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{restaurant.businessName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span>{restaurant.address}</span>
                        </div>
                      </div>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-sm font-semibold">{restaurant.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    {restaurant.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {restaurant.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2 mb-4">
                      {restaurant.specializations?.slice(0, 3).map((spec: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Dialog open={bookingOpen && selectedRestaurant?.id === restaurant.id} onOpenChange={(open) => {
                        setBookingOpen(open);
                        if (open) setSelectedRestaurant(restaurant);
                      }}>
                        <DialogTrigger asChild>
                          <Button className="flex-1" data-testid={`button-book-${restaurant.id}`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Book Table
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Book a Table at {restaurant.businessName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="date">Date</Label>
                              <Input
                                id="date"
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                data-testid="input-booking-date"
                              />
                            </div>
                            <div>
                              <Label htmlFor="time-slot">Time Slot</Label>
                              <Select value={timeSlot} onValueChange={setTimeSlot}>
                                <SelectTrigger data-testid="select-time-slot">
                                  <SelectValue placeholder="Select time slot" />
                                </SelectTrigger>
                                <SelectContent>
                                  {timeSlots.map((slot) => (
                                    <SelectItem key={slot} value={slot}>
                                      {slot}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="guests">Number of Guests</Label>
                              <Input
                                id="guests"
                                type="number"
                                min="1"
                                max="20"
                                value={numberOfGuests}
                                onChange={(e) => setNumberOfGuests(e.target.value)}
                                data-testid="input-guests"
                              />
                            </div>
                            <div>
                              <Label htmlFor="requests">Special Requests (Optional)</Label>
                              <Textarea
                                id="requests"
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder="Any special requirements or dietary restrictions..."
                                data-testid="textarea-requests"
                              />
                            </div>
                            <Button 
                              onClick={handleBookTable} 
                              className="w-full"
                              disabled={bookingMutation.isPending}
                              data-testid="button-confirm-booking"
                            >
                              {bookingMutation.isPending ? "Booking..." : "Confirm Booking"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" data-testid={`button-call-${restaurant.id}`}>
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <UtensilsCrossed className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground">No restaurants found in your area</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your location or check back later</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Popular Dishes</h2>
          
          {loadingMenu ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4">
                    <div className="h-5 bg-muted rounded mb-2 w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMenuItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMenuItems.map((item) => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-item-${item.id}`}>
                  {item.imageUrl && (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <div className="flex gap-1">
                        {item.isVeg && (
                          <div className="border-2 border-green-600 p-0.5 w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                          </div>
                        )}
                        {!item.isVeg && (
                          <div className="border-2 border-red-600 p-0.5 w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-red-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-primary">₹{item.price}</span>
                      {item.cuisine && (
                        <Badge variant="outline" className="text-xs">
                          {item.cuisine}
                        </Badge>
                      )}
                    </div>
                    
                    {item.category && (
                      <Badge variant="secondary" className="text-xs mb-3">
                        {item.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg text-muted-foreground">No items match your filters</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your cuisine or category selection</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
