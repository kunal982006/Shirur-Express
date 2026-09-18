import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Store, ShoppingCart, Loader2, Tag, ShoppingBag, Plus, Minus, X, Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCartStore } from "@/hooks/use-cart-store";

interface Product {
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
    description?: string;
}

interface OfferDetails {
    id: string;
    providerId: string;
    title: string;
    description?: string;
    imageUrl: string;
    productType: string;
    productIds?: string[];
    discountedPrices?: Record<string, number>;
    comboDetails?: Array<{
        name: string;
        originalPrice: number;
        discountedPrice: number;
        productIds: string[];
    }>;
    expiryDate: string;
    isActive: boolean;
    provider?: {
        id: string;
        businessName: string;
        profileImageUrl?: string;
        address?: string;
    };
    products?: Product[];
}

export default function OfferDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isVegOnly, setIsVegOnly] = useState(false);
    const { items, addItem, updateQuantity, getTotalPrice } = useCartStore();

    const { data: offer, isLoading, error } = useQuery<OfferDetails>({
        queryKey: [`/api/offers/${id}`],
        enabled: !!id,
    });

    // Check if offer is expired
    const isExpired = offer ? new Date(offer.expiryDate) < new Date() : false;

    // Get the correct shop URL based on product type
    const getShopUrl = (): string | null => {
        if (!offer?.provider?.id || !offer.productType) return null;

        switch (offer.productType) {
            case 'grocery':
                return '/grocery';
            case 'restaurant':
                return `/restaurants/${offer.provider.id}`;
            case 'cake':
                return '/cake-shop';
            case 'street_food':
                return `/street-food/${offer.provider.id}`;
            case 'beauty_parlor':
                return `/beauty/${offer.provider.id}`;
            default:
                return null;
        }
    };

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (!offer) return "";
        const now = new Date();
        const expiry = new Date(offer.expiryDate);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) return "Expired";

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h left`;

        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m left`;
    };

    const getOriginalPrice = (product: Product) => {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        return price;
    };

    const getDiscountedPrice = (productId: string, product: Product) => {
        if (offer?.discountedPrices && offer.discountedPrices[productId]) {
            return offer.discountedPrices[productId];
        }
        return null;
    };

    // Map product type to cart item type
    const getItemType = (): 'grocery' | 'street_food' | 'service' | 'restaurant' | 'cake' => {
        if (!offer) return 'grocery';
        switch (offer.productType) {
            case 'grocery': return 'grocery';
            case 'restaurant': return 'restaurant';
            case 'cake': return 'cake';
            case 'street_food': return 'street_food';
            case 'beauty_parlor': return 'service';
            default: return 'grocery';
        }
    };

    // Get quantity of item in cart
    const getCartQuantity = (productId: string): number => {
        const item = items.find(i => i.id === productId);
        return item?.quantity || 0;
    };

    const handleAddToCart = (product: Product) => {
        if (isExpired) return;

        const discountedPrice = offer?.discountedPrices?.[product.id];
        const priceToUse = discountedPrice ?? getOriginalPrice(product);

        const existingItem = items.find(item => item.id === product.id);
        if (existingItem) {
            updateQuantity(product.id, 1);
            toast({
                title: "➕ Quantity Updated!",
                description: `${product.name} quantity increased to ${existingItem.quantity + 1}.`,
            });
        } else {
            addItem({
                id: product.id,
                name: product.name,
                price: priceToUse,
                imageUrl: product.imageUrl || undefined,
                providerId: offer?.providerId,
                itemType: getItemType(),
            });
            toast({
                title: "✅ Added to Cart!",
                description: `${product.name} has been added to your cart.`,
            });
        }
    };

    const handleIncreaseQuantity = (productId: string) => {
        updateQuantity(productId, 1);
    };

    const handleDecreaseQuantity = (productId: string) => {
        updateQuantity(productId, -1);
    };

    const handleAddComboToCart = (combo: any, offerData: OfferDetails) => {
        if (isExpired) return;
        
        const comboId = `combo_${offerData.id}_${combo.name.replace(/\s+/g, '_')}`;
        const existingItem = items.find(item => item.id === comboId);
        
        if (existingItem) {
            updateQuantity(comboId, 1);
            toast({
                title: "➕ Quantity Updated!",
                description: `${combo.name} quantity increased to ${existingItem.quantity + 1}.`,
            });
        } else {
            addItem({
                id: comboId,
                name: combo.name, // Already has "Combo" in the title from OffersManager
                price: combo.discountedPrice,
                imageUrl: offerData.imageUrl || undefined,
                providerId: offerData.providerId,
                itemType: getItemType(),
            });
            toast({
                title: "✅ Added to Cart!",
                description: `${combo.name} has been added to your cart.`,
            });
        }
    };

    const filteredProducts = offer?.products?.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesVeg = !isVegOnly || (product as any).isVeg === true; // Assuming some might have isVeg property, else this won't filter out things unless strictly set to false
        // For now since we don't have strict veg data on all products, if isVegOnly is true and property is missing, we can either hide or show. Let's assume we show if we don't know, or better yet, just return matchesSearch for safety. 
        // We will include it loosely so it filters if explicitly not veg, but keep if missing.
        const isNonVeg = (product as any).isVeg === false || (product as any).type === 'non-veg';
        return matchesSearch && (!isVegOnly || !isNonVeg);
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <p className="text-gray-600">Offer not found</p>
                <Link href="/">
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Go Home
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            {/* Dark Top Background Section spanning behind Header and Banner */}
            <div className="absolute top-0 left-0 right-0 h-64 bg-[#0c2f1d] z-0 rounded-b-[2.5rem]" />

            {/* Header & Search Section */}
            <div className="relative z-40 pt-safe pt-2 pb-4">
                <header className="flex items-center gap-3 p-4 max-w-4xl mx-auto text-white">
                    <Link href="/">
                        <button className="p-2 rounded-full bg-black/10 hover:bg-black/20 backdrop-blur-sm transition-colors">
                            <ArrowLeft className="h-5 w-5 text-white" />
                        </button>
                    </Link>
                    <div className="flex flex-col min-w-0">
                        <h1 className="font-bold text-lg truncate flex items-center gap-2">
                            {offer.title} <span className="text-[10px] uppercase font-extrabold bg-white text-[#0c2f1d] px-1.5 py-0.5 rounded-full tracking-wide">Offer</span>
                        </h1>
                        {offer.provider && (
                            <p className="text-xs text-white/80 truncate opacity-90">{offer.provider.businessName}, {offer.provider.address}</p>
                        )}
                    </div>
                </header>

                {/* Floating Search Bar */}
                <div className="px-4 max-w-4xl mx-auto flex items-center gap-2 mt-1">
                    <div className="relative flex-1 bg-white rounded-full flex items-center shadow-lg border-2 border-white focus-within:border-green-400 transition-all overflow-hidden h-14">
                        <Search className="h-5 w-5 text-gray-400 ml-4 shrink-0" />
                        <Input 
                            type="text" 
                            placeholder={`Search in '${offer.title}'...`}
                            className="border-none shadow-none focus-visible:ring-0 text-base h-full bg-transparent pl-3 flex-1 text-gray-800 placeholder:text-gray-400 font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    
                    {/* VEG Toggle Button mimicking the toing image */}
                    <button 
                        className={`shrink-0 bg-white rounded-[1.25rem] px-3.5 h-14 flex flex-col items-center justify-center shadow-lg border-2 transition-colors ${isVegOnly ? 'border-green-500' : 'border-white'}`}
                        onClick={() => setIsVegOnly(!isVegOnly)}
                    >
                        <span className={`text-[9px] font-extrabold tracking-wider mb-1 ${isVegOnly ? 'text-green-700' : 'text-gray-500'}`}>VEG</span>
                        <div className={`w-7 h-3.5 rounded-full flex items-center p-0.5 transition-colors ${isVegOnly ? 'bg-green-100' : 'bg-gray-200'}`}>
                            <div className={`w-2.5 h-2.5 rounded-full shadow-sm transition-transform ${isVegOnly ? 'bg-green-600 translate-x-[14px]' : 'bg-gray-400'}`} />
                        </div>
                    </button>
                </div>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full aspect-video md:aspect-[21/9] max-w-4xl mx-auto px-4 z-10 mt-1">
                <div className="w-full h-full rounded-2xl overflow-hidden shadow-xl relative border-4 border-white/10">
                    <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Expiry Badge */}
                    <div className="absolute top-3 right-3">
                        <Badge
                            variant={isExpired ? "destructive" : "secondary"}
                            className={`${isExpired ? 'bg-red-500/90' : 'bg-green-600/90'} backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 shadow-md rounded-full border border-white/20`}
                        >
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            {getTimeRemaining()}
                        </Badge>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h2 className="text-white font-extrabold text-2xl md:text-3xl tracking-tight leading-tight drop-shadow-lg">{offer.title}</h2>
                        {offer.description && (
                            <p className="text-white/90 text-sm mt-1.5 font-medium drop-shadow-md line-clamp-2 max-w-[90%]">{offer.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Provider Info */}
            {offer.provider && (
                <div className="bg-white border-b">
                    <div className="max-w-4xl mx-auto p-4 flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {offer.provider.profileImageUrl ? (
                                <img
                                    src={offer.provider.profileImageUrl}
                                    alt={offer.provider.businessName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Store className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{offer.provider.businessName}</p>
                            {offer.provider.address && (
                                <p className="text-sm text-gray-500 truncate">{offer.provider.address}</p>
                            )}
                        </div>
                        {getShopUrl() && (
                            <Link href={getShopUrl()!}>
                                <Button variant="outline" size="sm">View Shop</Button>
                            </Link>
                        )}
                    </div>
                </div>
            )}

            {/* Expired Notice */}
            {isExpired && (
                <div className="bg-red-50 border-b border-red-100">
                    <div className="max-w-4xl mx-auto p-4">
                        <p className="text-red-600 text-center font-medium">
                            This offer has expired. Products may no longer be available at these prices.
                        </p>
                    </div>
                </div>
            )}

            {/* Special Combos */}
            {offer.comboDetails && offer.comboDetails.length > 0 && (
                <div className="max-w-4xl mx-auto p-4 border-b">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="h-6 w-6 text-green-600" />
                        <h3 className="font-bold text-xl text-green-700">Special Combos</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {offer.comboDetails.map((combo, idx) => {
                            const comboId = `combo_${offer.id}_${combo.name.replace(/\s+/g, '_')}`;
                            const cartQuantity = getCartQuantity(comboId);
                            
                            return (
                                <Card key={idx} className="overflow-hidden border-green-200 bg-green-50 shadow-sm relative transition-all hover:shadow-md">
                                    <Badge className="absolute top-3 right-3 bg-green-600 text-white z-10 border-none shadow-sm px-2 py-0.5 text-xs font-bold">
                                        Save ₹{(combo.originalPrice - combo.discountedPrice).toFixed(0)}!
                                    </Badge>
                                    <div className="flex items-start p-4 h-full">
                                        <div className="h-16 w-16 shrink-0 rounded-lg bg-white mr-4 flex items-center justify-center border border-green-100 shadow-sm">
                                            <Package className="h-8 w-8 text-green-500" />
                                        </div>
                                        <div className="flex flex-col flex-1 h-full min-w-0">
                                            <h4 className="font-bold text-lg text-green-900 leading-tight mb-1 pr-16 truncate">{combo.name}</h4>
                                            {/* Show included items */}
                                            {offer.products && (
                                                <p className="text-sm text-green-700/80 mb-4 line-clamp-2 leading-snug">
                                                    Includes: <span className="font-medium text-green-800">{offer.products.filter(p => combo.productIds.includes(p.id)).map(p => p.name).join(', ')}</span>
                                                </p>
                                            )}
                                            
                                            <div className="mt-auto flex items-end justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-2xl text-green-700 tracking-tight">₹{combo.discountedPrice}</span>
                                                        <span className="text-sm text-green-600/60 line-through font-medium">₹{combo.originalPrice}</span>
                                                    </div>
                                                </div>
                                                
                                                {cartQuantity > 0 ? (
                                                    <div className="flex items-center h-10 bg-green-600 rounded-md shadow-sm shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 text-white hover:bg-green-700 hover:text-white rounded-l-md rounded-r-none"
                                                            onClick={() => handleDecreaseQuantity(comboId)}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>
                                                        <span className="font-bold text-white w-8 text-center">{cartQuantity}</span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-10 w-10 p-0 text-white hover:bg-green-700 hover:text-white rounded-r-md rounded-l-none"
                                                            onClick={() => handleIncreaseQuantity(comboId)}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-medium h-10 px-5 shrink-0"
                                                        onClick={() => handleAddComboToCart(combo, offer)}
                                                        disabled={isExpired}
                                                    >
                                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="max-w-4xl mx-auto p-4 pb-28">
                <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Products in this offer</h3>
                </div>

                {filteredProducts && filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => {
                            const originalPrice = getOriginalPrice(product);
                            const discountedPrice = getDiscountedPrice(product.id, product);
                            const hasDiscount = discountedPrice !== null && discountedPrice < originalPrice;
                            const cartQuantity = getCartQuantity(product.id);

                            return (
                                <Card key={product.id} className="overflow-hidden">
                                    <div className="aspect-square bg-gray-100 relative">
                                            <div 
                                                className="w-full h-full cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => product.imageUrl && setSelectedImage(product.imageUrl)}
                                            >
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        {hasDiscount && (
                                            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                                                {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
                                            </Badge>
                                        )}
                                        {/* Optional Veg/Non-Veg icon rendering on the product image */}
                                        {(product as any).isVeg !== undefined && (
                                            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm p-1 rounded-sm shadow-sm border border-gray-200">
                                                <div className={`h-2 w-2 rounded-full ${(product as any).isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-3 flex flex-col justify-between h-[120px]">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm line-clamp-2 min-h-[2.5rem] leading-tight">
                                                {product.name}
                                            </h4>
                                            <div className="mt-1 flex items-center gap-2">
                                                {hasDiscount ? (
                                                    <>
                                                        <span className="font-extrabold text-primary">₹{discountedPrice}</span>
                                                        <span className="text-gray-400 text-xs font-medium line-through">₹{originalPrice}</span>
                                                    </>
                                                ) : (
                                                    <span className="font-extrabold text-primary">₹{originalPrice}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity Controls or Add Button */}
                                        {cartQuantity > 0 ? (
                                            <div className="flex items-center justify-between mt-auto h-8 bg-primary rounded-lg shadow-sm border-b-2 border-primary-foreground/20">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-l-lg rounded-r-none"
                                                    onClick={() => handleDecreaseQuantity(product.id)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold text-white text-sm">{cartQuantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-r-lg rounded-l-none"
                                                    onClick={() => handleIncreaseQuantity(product.id)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full mt-auto h-8 text-sm font-bold shadow-sm rounded-lg"
                                                size="sm"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={isExpired}
                                            >
                                                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                                                ADD
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border">
                        <p className="text-gray-500">No products found in this offer</p>
                    </div>
                )}
            </div>

            {/* Floating Cart Bar */}
            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t z-50 animate-slide-up-fast">
                    <div className="max-w-4xl mx-auto flex justify-between items-center">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {items.reduce((total, item) => total + item.quantity, 0)} Items
                            </p>
                            <p className="text-xl font-bold">₹{getTotalPrice().toFixed(2)}</p>
                        </div>
                        <Button onClick={() => setLocation("/checkout")} size="lg">
                            Proceed to Checkout
                            <ShoppingBag className="ml-2 h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}
            {/* Full-Screen Image Modal */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl w-full h-full p-4 flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full h-12 w-12 z-50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                        >
                            <X className="h-8 w-8" />
                        </Button>
                        <img 
                            src={selectedImage} 
                            alt="Product details full screen" 
                            className="max-h-[85vh] max-w-[95vw] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
