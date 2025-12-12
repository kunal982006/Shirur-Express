import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Star, MapPin, Clock, Plus,
    ChevronDown,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

// --- BEAUTY ENCYCLOPEDIA DATA REFERENCE (MOCK MENU) ---
const NESTED_SERVICES = {
    "Hair Services": [
        {
            name: "Haircut & Styling", subCategories: [
                { name: "Haircuts & Basic Styling", items: [{ id: 'wcut', name: "Women's Haircut", price: 800, duration: 45, gender: 'Women' }] },
                { name: "Hair Coloring", items: [{ id: 'fcolor', name: "Full Color", price: 3500, duration: 120, type: 'Coloring' }] },
            ]
        },
        { name: "Hair Treatments", services: [{ id: 'keratin', name: "Keratin Treatment", price: 5500, duration: 180, gender: 'Unisex' }] },
    ],
    "Nail Services": [
        { name: "Manicures", services: [{ id: 'cmani', name: "Classic Manicure", price: 600, duration: 40 }] },
    ],
    "Skincare Services": [
        { name: "Facials", services: [{ id: 'basic', name: "Basic Cleansing Facial", price: 900, duration: 60 }] },
        { name: "Hair Removal", services: [{ id: 'wax', name: "Waxing (Various Options)", price: 500, duration: 30, gender: 'Women' }] },
    ],
};

const MAIN_CATEGORIES = []; // Placeholder, will be derived dynamically

// Mock Parlor List (Used to find the specific parlor)
const mockBeautyParlors = [
    {
        id: "1",
        name: "Glamour Beauty Lounge (Top Rated)",
        description: "Expert services for hair, skin, and nails. Our priority is hygiene and quality.",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: 4.7, reviews: 234, address: "Sector 22, Near Metro Station", distance: "1.2 km",
    },
    {
        id: "2",
        name: "Sparkle & Shine Studio",
        description: "Modern salon with latest treatments.",
        image: "https://images.unsplash.com/photo-1522335613345-cd4468f7f7c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        rating: 4.5, reviews: 150, address: "Sector 18, City Center", distance: "3.5 km",
    }
];

// Helper component to display a single service item
const ServiceItemCard = ({ parlorId, service, subCategoryName, cart, onAdd, onRemove }: {
    parlorId: string,
    service: any,
    subCategoryName: string,
    cart: Record<string, any>,
    onAdd: (service: any) => void,
    onRemove: (serviceId: string) => void
}) => {
    const isInCart = !!cart[service.id];
    const isWomenOnly = service.gender === 'Women' && subCategoryName.includes('Hair Removal');

    return (
        <Card className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
            <div>
                <p className="font-semibold text-base text-primary">{service.name}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {service.duration || 'Varies'} {service.duration !== 'Multi-day' && service.duration !== 'Full Day' && 'mins'}
                    {isWomenOnly && <Badge variant="destructive" className="ml-2 h-4 px-1">Women Only</Badge>}
                </p>
            </div>
            <div className="flex items-center space-x-3">
                <p className="font-bold text-lg">₹{service.price}</p>
                {isInCart ? (
                    <Button size="sm" variant="destructive" onClick={() => onRemove(service.id)}>
                        Remove
                    </Button>
                ) : (
                    <Button size="sm" onClick={() => onAdd(service)}>
                        Add
                    </Button>
                )}
            </div>
        </Card>
    );
};


export default function BeautyDetail() {
    const [, setLocation] = useLocation();
    const params = useParams();
    const parlorId = params.parlorId as string;

    const [selectedMainCat, setSelectedMainCat] = useState<string | null>(null);
    const [selectedSubCat, setSelectedSubCat] = useState<string | null>(null);
    const [cart, setCart] = useState<Record<string, any>>({});

    // 1. Fetch Parlor Details (REAL API CALL)
    const { data: parlorDetail, isLoading: parlorLoading } = useQuery({
        queryKey: ["parlor-detail", parlorId],
        queryFn: async () => {
            try {
                const res = await api.get(`/service-providers/${parlorId}`);
                const data = res.data;

                if (!data) return null;

                // Transform beautyServices into NESTED_SERVICES format
                const menuData: any = {};

                if (data.beautyServices) {
                    data.beautyServices.forEach((service: any) => {
                        if (!service.isActive) return;

                        // Prioritize service-level fields, fall back to template
                        const template = service.template || {};

                        // New Hierarchy: Section -> SubCategory -> Service
                        // Default to 'Other' if section is missing (e.g. old data)
                        const mainCat = service.section || "Other Services";
                        const subCat = service.subCategory || "General Services";
                        const name = service.name || template.name || "Unnamed Service";
                        const duration = service.duration || template.duration || 30;
                        const description = service.description || template.description;
                        const gender = 'Unisex'; // Could be added to schema later

                        if (!menuData[mainCat]) {
                            menuData[mainCat] = [];
                        }

                        // Check if SubCategory exists within MainCategory
                        let subCatObj = menuData[mainCat].find((s: any) => s.name === subCat);
                        if (!subCatObj) {
                            subCatObj = { name: subCat, services: [] };
                            menuData[mainCat].push(subCatObj);
                        }

                        subCatObj.services.push({
                            id: service.id,
                            name: name,
                            price: Number(service.price),
                            duration: duration,
                            gender: gender,
                            description: description
                        });
                    });
                }

                return {
                    ...data,
                    name: data.businessName, // Map fields for UI compatibility
                    image: data.profileImageUrl,
                    address: data.address,
                    rating: data.rating,
                    reviews: data.reviewCount,
                    distance: "2.5 km", // Mock distance for now
                    menuData
                };
            } catch (err) {
                console.error("Error fetching parlor details:", err);
                return null;
            }
        },
        enabled: !!parlorId,
    });

    const parlorMenu = parlorDetail?.menuData || {};

    // 2. Derive Sub-Categories based on selected Main Category
    const subCategories = useMemo(() => {
        if (!selectedMainCat || !parlorMenu[selectedMainCat]) return [];
        return parlorMenu[selectedMainCat];
    }, [selectedMainCat, parlorMenu]);

    // 3. Derive Final Services based on selected Sub-Category
    const finalServices = useMemo(() => {
        if (!selectedSubCat || subCategories.length === 0) return [];

        const selectedSubCatObject = subCategories.find((cat: any) => cat.name === selectedSubCat);

        if (!selectedSubCatObject) return [];

        if (selectedSubCatObject.subCategories) {
            // Handle nested sub-categories (like Haircuts inside Haircut & Styling)
            return selectedSubCatObject.subCategories.flatMap((nestedCat: any) => nestedCat.items);
        }

        // Handle flat services (like Keratin Treatment inside Hair Treatments)
        return selectedSubCatObject.services || [];

    }, [selectedSubCat, subCategories]);


    if (parlorLoading) {
        return <div className="text-center py-20"><p className="text-muted-foreground">Loading parlor details...</p></div>;
    }

    // FIX: Error check to display "not found" state
    if (!parlorDetail && !parlorLoading) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-semibold text-xl">
                    Parlor not found or invalid ID. 😞
                </p>
                <p className="text-muted-foreground mt-2">
                    Check the URL or return to the listing page.
                </p>
                <Button onClick={() => setLocation("/beauty")} className="mt-4">
                    Go Back to Listing
                </Button>
            </div>
        );
    }

    const handleMainCatChange = (value: string) => {
        setSelectedMainCat(value);

        // Auto-select the first sub-category if available
        const subCats = parlorMenu[value];
        if (subCats && subCats.length > 0) {
            setSelectedSubCat(subCats[0].name);
        } else {
            setSelectedSubCat(null);
        }
    };

    const handleSubCatChange = (value: string) => {
        setSelectedSubCat(value);
    };

    const addToCart = (service: any) => {
        setCart(prev => ({ ...prev, [service.id]: service }));
    };

    const removeFromCart = (serviceId: string) => {
        setCart(prev => {
            const newCart = { ...prev };
            delete newCart[serviceId];
            return newCart;
        });
    };

    const cartItemCount = Object.keys(cart).length;
    const cartTotal = Object.values(cart).reduce((sum: number, item: any) => sum + item.price, 0);

    const handleCheckout = () => {
        const serviceIds = Object.keys(cart).join(',');
        setLocation(`/book/beauty?parlorId=${parlorId}&services=${serviceIds}`);
    };

    return (
        <div className="py-8 md:py-12 bg-gray-50 min-h-screen pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header and Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center space-x-2"
                    onClick={() => setLocation("/beauty")}
                    data-testid="button-back"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Parlor List</span>
                </Button>

                {/* Parlor Banner/Detail Header */}
                <Card className="mb-8 p-0 overflow-hidden">
                    <img src={parlorDetail.image} alt={parlorDetail.name} className="w-full h-48 object-cover" />
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold mb-1">{parlorDetail.name}</h2>
                                <p className="text-sm text-muted-foreground">{parlorDetail.description}</p>
                            </div>
                            <Badge variant="default" className="text-base flex items-center px-3 py-1">
                                <Star className="h-4 w-4 fill-current mr-1" /> {parlorDetail.rating}
                            </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{parlorDetail.address}</span>
                            </div>
                            <span>•</span>
                            <span>{parlorDetail.distance}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* FILTERING SECTION (Electrician Style Dropdowns) */}
                <Card className="mb-8">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold mb-4">Book a Service</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            {/* 1. Main Category Dropdown (Hair, Nail, Skin) */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Main Category</label>
                                <Select onValueChange={handleMainCatChange} value={selectedMainCat || ""}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category (e.g., Hair Services)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(parlorMenu).map((catName) => (
                                            <SelectItem key={catName} value={catName}>
                                                {catName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 2. Sub-Category Dropdown (Haircut & Styling, Treatments) */}
                            <div>
                                <label className="text-sm font-medium mb-1 block">Sub Category</label>
                                <Select
                                    onValueChange={handleSubCatChange}
                                    value={selectedSubCat || ""}
                                    disabled={!selectedMainCat}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={selectedMainCat ? "Select Sub Category" : "Select Main Category First"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {subCategories.map((subCat: any) => (
                                            <SelectItem key={subCat.name} value={subCat.name}>
                                                {subCat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* 3. Empty Slot (Optional: Can be used for Gender/Price Filter) */}
                            <div className="flex items-end">
                                <Button variant="secondary" className="w-full">
                                    <ChevronDown className="h-4 w-4 mr-2" /> More Filters
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SERVICE LISTING (Filtered Results) */}
                <div>
                    <h3 className="text-2xl font-bold mb-4">
                        {selectedSubCat || "Full Service Menu"} Menu ({finalServices.length})
                    </h3>

                    <div className="space-y-4">
                        {finalServices.length === 0 && selectedSubCat ? (
                            <Card><CardContent className="p-6 text-center text-muted-foreground">No services found in this sub-category. Please try a different selection.</CardContent></Card>
                        ) : finalServices.length === 0 && !selectedSubCat ? (
                            // Show initial prompt when no filter is selected
                            <Card><CardContent className="p-6 text-center text-muted-foreground">Please use the dropdowns above to browse the specific services offered by the parlor.</CardContent></Card>
                        ) : (
                            finalServices.map((service: any) => (
                                <ServiceItemCard
                                    key={service.id}
                                    parlorId={parlorId}
                                    service={service}
                                    subCategoryName={selectedSubCat || "Services"}
                                    cart={cart}
                                    onAdd={addToCart}
                                    onRemove={removeFromCart}
                                />
                            ))
                        )}

                        {/* Beautician Add Option at the bottom */}
                        <div className="pt-4 border-t border-dashed border-gray-300">
                            <Button size="sm" variant="outline" className="text-primary hover:bg-primary/10">
                                <Plus className="h-4 w-4 mr-2" /> Add New Service (Beautician View)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Checkout Bar */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div>
                            <p className="font-bold text-lg">{cartItemCount} Items Selected</p>
                            <p className="text-sm text-muted-foreground">Total: ₹{cartTotal}</p>
                        </div>
                        <Button onClick={handleCheckout} size="lg">
                            Proceed to Checkout
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}