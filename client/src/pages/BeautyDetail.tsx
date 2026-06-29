import { useState, useMemo, useEffect } from "react";
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


// --- SECTION NORMALIZATION (Prevents duplicate categories like "Skincare" vs "Skin Care") ---
const SECTION_CANONICAL_MAP: Record<string, string> = {
    "hair": "Hair",
    "hair services": "Hair",
    "skin care": "Skin Care",
    "skincare": "Skin Care",
    "skincare services": "Skin Care",
    "skin": "Skin Care",
    "makeover": "Makeover",
    "makeup": "Makeover",
    "make over": "Makeover",
    "nail": "Makeover",
    "bridal": "Makeover",
    "other": "Other Services",
    "other services": "Other Services",
};

const normalizeSectionName = (raw: string): string => {
    if (!raw) return "Other Services";
    const key = raw.toLowerCase().trim();
    return SECTION_CANONICAL_MAP[key] || raw;
};


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
        <Card className="flex items-center p-3 gap-3 hover:shadow-md transition-shadow">
            {/* Service Image */}
            {service.imageUrl ? (
                <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
            ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center shrink-0">
                    <span className="text-xl">✨</span>
                </div>
            )}
            {/* Service Details */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-primary truncate">{service.name}</p>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {service.duration || 'Varies'} {service.duration !== 'Multi-day' && service.duration !== 'Full Day' && 'mins'}
                    {isWomenOnly && <Badge variant="destructive" className="ml-2 h-4 px-1">Women Only</Badge>}
                </p>
            </div>
            {/* Price & Action */}
            <div className="flex items-center space-x-3 shrink-0">
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
    const [isDescExpanded, setIsDescExpanded] = useState(false); // For Read More/Less

    // 1. Fetch Parlor Details (REAL API CALL)
    const { data: parlorDetail, isLoading: parlorLoading, isError, error } = useQuery({
        queryKey: ["parlor-detail", parlorId],
        queryFn: async () => {
            console.log("[BeautyDetail] Fetching parlor:", parlorId);
            const res = await api.get(`/service-providers/${parlorId}`);
            const data = res.data;
            console.log("[BeautyDetail] API Response:", data);

            if (!data) {
                console.error("[BeautyDetail] No data received from API");
                throw new Error("Parlor not found");
            }

            // Transform beautyServices into nested category format
            const menuData: any = {};

            if (data.beautyServices && Array.isArray(data.beautyServices)) {
                console.log("[BeautyDetail] Processing", data.beautyServices.length, "beauty services");
                data.beautyServices.forEach((service: any) => {
                    // Show all services - isActive defaults to true in schema
                    // Only skip if explicitly set to false
                    if (service.isActive === false) return;

                    // Prioritize service-level fields, fall back to template
                    const template = service.template || {};

                    // New Hierarchy: Section -> SubCategory -> Service
                    // Normalize section names to prevent duplicates (e.g. "Skincare" vs "Skin Care")
                    const mainCat = normalizeSectionName(service.section || "Other Services");
                    const subCat = (service.subCategory || "General Services").trim();
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
                        description: description,
                        imageUrl: service.imageUrl || template.imageUrl || null
                    });
                });
            }

            const result = {
                ...data,
                name: data.businessName || "Unnamed Parlor", // Map fields for UI compatibility
                image: data.profileImageUrl || "",
                address: data.address || "Address not available",
                rating: data.rating || 0,
                reviews: data.reviewCount || 0,
                distance: "2.5 km", // Mock distance for now
                menuData,
                description: data.description || ""
            };
            console.log("[BeautyDetail] Transformed result:", result);
            return result;
        },
        enabled: !!parlorId,
        retry: 1, // Only retry once
    });

    // Debug logging
    console.log("[BeautyDetail] State - parlorId:", parlorId, "isLoading:", parlorLoading, "isError:", isError, "error:", error);

    const parlorMenu = parlorDetail?.menuData || {};
    const mainCategories = Object.keys(parlorMenu);

    // Auto-select first category when data loads
    useEffect(() => {
        // Derive menu data fresh inside the effect to avoid stale closures
        const menu = parlorDetail?.menuData || {};
        const categories = Object.keys(menu);

        if (categories.length > 0 && !selectedMainCat) {
            const firstCat = categories[0];
            setSelectedMainCat(firstCat);
            const subCats = menu[firstCat];
            if (subCats && subCats.length > 0) {
                setSelectedSubCat(subCats[0].name);
            }
        }
    }, [parlorDetail, selectedMainCat]);

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
    if ((!parlorDetail && !parlorLoading) || isError) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[BeautyDetail] Rendering error state:", errorMessage);
        return (
            <div className="text-center py-20 px-4">
                <p className="text-red-500 font-semibold text-xl">
                    Parlor not found or an error occurred. 😞
                </p>
                <p className="text-muted-foreground mt-2">
                    {errorMessage !== "Unknown error" ? `Error: ${errorMessage}` : "Check the URL or return to the listing page."}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    Parlor ID: {parlorId || "Not provided"}
                </p>
                <Button onClick={() => setLocation("/")} className="mt-4">
                    Go Back to Home
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

    // Final safety check - this should never happen but just in case
    if (!parlorDetail) {
        console.error("[BeautyDetail] parlorDetail is null after all checks");
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Something went wrong. Please try again.</p>
                <Button onClick={() => setLocation("/")} className="mt-4">
                    Go Back to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="py-8 md:py-12 bg-gray-50 min-h-screen pb-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header and Back Button */}
                <Button
                    variant="ghost"
                    className="mb-6 flex items-center space-x-2"
                    onClick={() => setLocation("/")}
                    data-testid="button-back"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Home</span>
                </Button>

                {/* Removed Parlor Banner as requested */}

                {/* FILTERING SECTION (Zepto/Flipkart Style Tabs) */}
                {mainCategories.length === 0 ? (
                    <Card className="mb-8 bg-amber-50 border-amber-200">
                        <CardContent className="p-8 text-center">
                            <div className="text-amber-600 mb-3">
                                <Clock className="h-12 w-12 mx-auto mb-3 opacity-70" />
                            </div>
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">No Services Available Yet</h3>
                            <p className="text-amber-700 text-sm">
                                This parlor hasn't added their service menu yet. Please check back later or contact them directly for available services.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4">Book a Service</h3>
                        
                        {/* 1. Main Categories (Scrollable row) */}
                        <div className="flex overflow-x-auto pb-2 mb-4 gap-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {mainCategories.map((catName) => (
                                <button
                                    key={catName}
                                    onClick={() => handleMainCatChange(catName)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm border ${
                                        selectedMainCat === catName 
                                            ? "bg-primary text-primary-foreground border-primary scale-105" 
                                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                    }`}
                                >
                                    {catName}
                                </button>
                            ))}
                        </div>

                        {/* 2. Sub Categories (Scrollable row) */}
                        {subCategories.length > 0 && (
                            <div className="flex overflow-x-auto pb-2 gap-4 border-b border-gray-200 mb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {subCategories.map((subCat: any) => (
                                    <button
                                        key={subCat.name}
                                        onClick={() => handleSubCatChange(subCat.name)}
                                        className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors border-b-2 ${
                                            selectedSubCat === subCat.name 
                                                ? "border-primary text-primary" 
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        {subCat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

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