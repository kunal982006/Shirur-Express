import { useState, useMemo } from "react"; 
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Star, MapPin, Sparkles,
} from "lucide-react";

// --- Data (Minimal for Listing) ---
const NESTED_SERVICES = {
  "Hair Services": [], "Nail Services": [], "Skincare Services": [], "Makeup Services": [], "Bridal & Special Events": [],
};
const MAIN_BEAUTY_CATEGORIES = Object.keys(NESTED_SERVICES);

const mockBeautyParlors = [
{
id: "1",
name: "Glamour Beauty Lounge (Top Rated)",
image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    rating: 4.7, reviews: 234, address: "Sector 22, Near Metro Station", distance: "1.2 km",
    categories: ["Hair Services", "Skincare Services", "Nail Services"]
},
{
id: "2",
name: "Sparkle & Shine Studio",
image: "https://images.unsplash.com/photo-1522335613345-cd4468f7f7c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    rating: 4.5, reviews: 150, address: "Sector 18, City Center", distance: "3.5 km",
    categories: ["Nail Services", "Makeup Services", "Hair Services"] 
}
];
// --- End Data ---

export default function Beauty() {
  const [, setLocation] = useLocation();
  const [filterMainCategory, setFilterMainCategory] = useState("All");

  const { data: beautyParlors, isLoading } = useQuery({
    queryKey: ["/api/service-providers", { category: "beauty" }],
    queryFn: () => Promise.resolve(mockBeautyParlors), 
  });

  const filteredParlors = useMemo(() => {
    if (!beautyParlors) return [];

    if (filterMainCategory === "All") {
      return beautyParlors;
    }
    return beautyParlors.filter((parlor: any) => 
        parlor.categories.includes(filterMainCategory)
    );
  }, [beautyParlors, filterMainCategory]);


  return (
    <div className="py-8 md:py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header & Back Button */}
        <Button
          variant="ghost"
          className="mb-6 flex items-center space-x-2"
          onClick={() => setLocation("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Services</span>
        </Button>

        {/* Horizontal Scrollable Main Categories (Filter Buttons) */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-3 mb-6 pb-2 border-b border-gray-200">
            <Button
                variant={filterMainCategory === "All" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMainCategory("All")}
                className="flex-shrink-0"
            >
                All Parlors
            </Button>

            {MAIN_BEAUTY_CATEGORIES.map((cat) => (
                <Button
                    key={cat}
                    variant={filterMainCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterMainCategory(cat)}
                    className="flex-shrink-0"
                >
                    {cat}
                </Button>
            ))}
        </div>


        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Book Your Beauty Services</h2>
          <p className="text-muted-foreground">
            Top-rated salons and spas near you. Click on a parlor to view the full menu.
          </p>
        </div>

        {/* Beauty Parlor Cards */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <Card key={i} className="animate-pulse"><CardContent className="p-6 h-32 bg-gray-200 rounded-lg"></CardContent></Card>
              ))}
            </div>
          ) : filteredParlors && filteredParlors.length === 0 ? (
            <Card><CardContent className="p-8 text-center">No parlors found for the selected category. Try 'All Parlors'.</CardContent></Card>
          ) : (
            filteredParlors?.map((parlor: any) => (
              <Card key={parlor.id} className="shadow-xl hover:shadow-2xl transition-all">
                <Link to={`/beauty/${parlor.id}`} className="block hover:no-underline">
                <CardContent className="p-0">

                  {/* Parlor Info Header */}
                  <div className="p-6 flex items-center justify-between cursor-pointer">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={parlor.image} alt={parlor.name} className="w-full h-full object-cover"/>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">{parlor.name}</h3>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span>{parlor.rating} ({parlor.reviews})</span>
                          <MapPin className="h-4 w-4" />
                          <span>{parlor.distance} away</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge variant="secondary" className="flex items-center mb-2"><Sparkles className="h-3 w-3 mr-1" />Verified</Badge>
                      <Button size="sm" variant="default" onClick={(e) => { e.preventDefault(); setLocation(`/beauty/${parlor.id}`); }}>
                        View Menu
                      </Button>
                    </div>
                  </div>
                </CardContent>
                </Link>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}