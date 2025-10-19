import { useState, useMemo } from "react"; // 👈 FIX: useMemo imported
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Star, MapPin, Clock, Scissors, Sparkles, Paintbrush, HandMetal, Info,
  ChevronRight, Plus, Users, User, Child, Gift
} from "lucide-react";

// --- START: BEAUTY ENCYCLOPEDIA DATA ---
// NOTE: Is data ko tumhari API se aana chahiye. Abhi yeh mock data hai.
const NESTED_SERVICES = {
  "Hair Services": [
    { 
      name: "Haircut & Styling", 
      icon: Scissors,
      subCategories: [ 
        { name: "Haircuts & Basic Styling", items: [
            { id: 'wcut', name: "Women's Haircut", price: 800, duration: 45, type: 'Haircut', gender: 'Women' },
            { id: 'mcut', name: "Men's Haircut", price: 400, duration: 30, type: 'Haircut', gender: 'Men' },
        ]},
        { name: "Hair Coloring", items: [
            { id: 'fcolor', name: "Full Color", price: 3500, duration: 120, type: 'Coloring' },
            { id: 'root', name: "Root Touch-up", price: 1800, duration: 90, type: 'Coloring' },
        ]},
      ]
    },
    { name: "Hair Treatments", icon: Sparkles, services: [
        { id: 'keratin', name: "Keratin Treatment", price: 5500, duration: 180, gender: 'Unisex' },
    ]},
  ],
  "Nail Services": [
    { name: "Manicures", icon: HandMetal, services: [
        { id: 'cmani', name: "Classic Manicure", price: 600, duration: 40 },
    ]},
    { name: "Pedicures", icon: HandMetal, services: [
        { id: 'cpedi', name: "Classic Pedicure", price: 800, duration: 50 },
    ]},
  ],
  "Skincare Services": [
    { name: "Facials", icon: Sparkles, services: [
        { id: 'basic', name: "Basic Cleansing Facial", price: 900, duration: 60 },
    ]},
    { name: "Hair Removal", icon: HandMetal, services: [
        { id: 'wax', name: "Waxing (Various Options)", price: 500, duration: 30, gender: 'Women' },
    ]},
  ],
  "Makeup Services": [
    { name: "Application", icon: Paintbrush, services: [
        { id: 'full', name: "Full Face Makeup", price: 2500, duration: 60 },
        { id: 'bridal', name: "Bridal Makeup", price: 15000, duration: 120 },
    ]},
  ],
  "Bridal & Special Events": [
    { name: "Bridal Packages", icon: Gift, services: [
        { id: 'pwedding', name: "Pre-wedding Skincare Package", price: 10000, duration: 'Multi-day' },
    ]},
  ]
};

// Main categories array extracted from the nested data
const MAIN_BEAUTY_CATEGORIES = Object.keys(NESTED_SERVICES);

// Mock beauty parlor data (for listing)
const mockBeautyParlors = [
{
id: "1",
name: "Glamour Beauty Lounge (Top Rated)",
image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    rating: 4.7, reviews: 234, address: "Sector 22, Near Metro Station", distance: "1.2 km",
    categories: ["Hair Services", "Skincare Services", "Nail Services"] // Parlor ki available categories
},
{
id: "2",
name: "Sparkle & Shine Studio",
image: "https://images.unsplash.com/photo-1522335613345-cd4468f7f7c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
    rating: 4.5, reviews: 150, address: "Sector 18, City Center", distance: "3.5 km",
    categories: ["Nail Services", "Makeup Services", "Hair Services"] 
}
];

// Helper component to render a single service item
const ServiceItem = ({ parlorId, service, isWomenOnly = false, isGendered = false }: { parlorId: string, service: any, isWomenOnly?: boolean, isGendered?: boolean }) => {
    const [, setLocation] = useLocation();

    const handleBook = (service: any) => {
        // Navigate to booking page with parlor and service IDs
        setLocation(`/book/beauty?parlorId=${parlorId}&serviceId=${service.id}`);
    };

    return (
        <div className={`flex items-center justify-between py-2 border-b last:border-b-0 ${isWomenOnly ? 'bg-pink-50/50' : ''}`}>
            <div>
                <p className="font-medium text-sm">{service.name}</p>
                <p className="text-xs text-muted-foreground flex items-center">
                    {isWomenOnly && <Badge variant="destructive" className="mr-1 h-4 px-1">Women Only</Badge>}
                    {isGendered && service.gender && <Badge variant="secondary" className="mr-1 h-4 px-1">{service.gender}</Badge>}
                    <Clock className="h-3 w-3 mr-1" />
                    {service.duration || 'Varies'} {service.duration !== 'Multi-day' && service.duration !== 'Full Day' && 'mins'}
                </p>
            </div>
            <div className="flex items-center space-x-3">
                <p className="font-semibold text-base">₹{service.price}</p>
                <Button 
                    size="sm" 
                    onClick={() => handleBook(service)}
                    data-testid={`book-${service.id}`}
                >
                    Book
                </Button>
            </div>
        </div>
    );
};

// Helper component to render the service menu dynamically
const ServiceMenu = ({ parlorId }: { parlorId: string }) => {
    const menu = NESTED_SERVICES; 

    return (
        <div className="space-y-8">
            {Object.entries(menu).map(([mainCat, subCats]: [string, any]) => (
                <div key={mainCat}>
                    <h4 className="text-xl font-bold mb-3 border-b pb-1 flex items-center space-x-2">
                        {/* Icon Mapping */}
                        {mainCat.includes('Hair') ? <Scissors className="h-5 w-5 text-primary"/> : mainCat.includes('Skin') ? <Sparkles className="h-5 w-5 text-primary"/> : mainCat.includes('Nail') ? <HandMetal className="h-5 w-5 text-primary"/> : mainCat.includes('Makeup') ? <Paintbrush className="h-5 w-5 text-primary"/> : <Gift className="h-5 w-5 text-primary"/>}
                        <span>{mainCat}</span>
                    </h4>

                    {subCats.map((subCat: any) => (
                        <div key={subCat.name} className="ml-2 mt-4 p-4 bg-gray-100 rounded-lg shadow-inner">
                            <h5 className="font-semibold text-lg text-primary">{subCat.name}</h5>

                            {/* NESTED SERVICES (Sub-Sub Categories like Hair Coloring) */}
                            {subCat.subCategories ? (
                                subCat.subCategories.map((nestedCat: any) => (
                                    <div key={nestedCat.name} className="mt-3 p-3 border-l-4 border-primary/50 bg-white shadow-md rounded">
                                        <p className="font-medium text-base mb-2">{nestedCat.name}</p>
                                        {nestedCat.items.map((service: any) => (
                                            <ServiceItem key={service.id} parlorId={parlorId} service={service} isGendered={true}/>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                /* FLAT SERVICES (e.g., Hair Treatments, Manicures) */
                                <div className="mt-3">
                                    {subCat.services.map((service: any) => (
                                        <ServiceItem 
                                            key={service.id} 
                                            parlorId={parlorId} 
                                            service={service} 
                                            isWomenOnly={subCat.name.includes('Hair Removal') && service.gender === 'Women'} 
                                            isGendered={service.gender}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Beautician Add Option */}
                            <div className="mt-3 pt-2 border-t border-dashed border-gray-300">
                                <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                                    <Plus className="h-4 w-4 mr-2" /> Add Service (Admin/Beautician)
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
// --- END: SERVICE MENU COMPONENTS ---


export default function Beauty() {
const [, setLocation] = useLocation();
const [expandedParlorId, setExpandedParlorId] = useState<string | null>(null);
  // NEW STATE: Filter for main category buttons
  const [filterMainCategory, setFilterMainCategory] = useState("All");

const { data: beautyParlors, isLoading } = useQuery({
queryKey: ["/api/service-providers", { category: "beauty" }],
queryFn: () => Promise.resolve(mockBeautyParlors), 
});

  // NEW LOGIC: Filter parlors based on the active category button
  const filteredParlors = useMemo(() => {
    if (!beautyParlors) return [];

    if (filterMainCategory === "All") {
      return beautyParlors;
    }
    // Filter only those parlors that offer the selected category
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

        {/* 💥 NEW: Horizontal Scrollable Main Categories (Filter Buttons) 💥 */}
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
Top-rated salons and spas near you. Select a parlor to view the full menu.
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
                // No Parlors Found State (after filtering)
<Card><CardContent className="p-8 text-center">No parlors found for the selected category. Try 'All Parlors' or check back later.</CardContent></Card>
) : (
filteredParlors?.map((parlor: any) => (
<Card key={parlor.id} className="shadow-xl">
<CardContent className="p-0">

                    {/* Parlor Info Header */}
                    <div className="p-6 flex items-center justify-between">
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
                        <Badge variant="secondary" className="flex items-center"><Sparkles className="h-3 w-3 mr-1" />Verified</Badge>
                    </div>

                    {/* Expand/Collapse Button */}
                    <div className="p-6 pt-0 border-t border-border">
                        <Button
                            variant="link"
                            className="w-full justify-start text-primary"
                            onClick={() => setExpandedParlorId(expandedParlorId === parlor.id ? null : parlor.id)}
                            data-testid={`button-view-menu-${parlor.id}`}
                        >
                            View Full Menu & Pricing 
                            <ChevronRight className={`h-4 w-4 ml-2 transition-transform ${expandedParlorId === parlor.id ? 'rotate-90' : ''}`} />
                        </Button>
                    </div>

                    {/* NESTED MENU SECTION */}
                    {expandedParlorId === parlor.id && (
                        <div className="p-6 pt-0 border-t border-border bg-gray-50">
                            <ServiceMenu parlorId={parlor.id} />
                        </div>
                    )}
</CardContent>
</Card>
))
)}
</div>
</div>
{/* NOTE: Final ServiceMenu definition is below main component */}
</div>
);
}