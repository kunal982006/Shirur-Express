import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Store, ShoppingCart, Loader2, Tag, ShoppingBag, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
                <div className="flex items-center gap-3 p-4 max-w-4xl mx-auto">
                    <Link href="/">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    </Link>
                    <h1 className="font-bold text-lg truncate">{offer.title}</h1>
                </div>
            </header>

            {/* Hero Banner */}
            <div className="relative w-full aspect-video md:aspect-[21/9] max-w-4xl mx-auto">
                <img
                    src={offer.imageUrl}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Expiry Badge */}
                <div className="absolute top-4 right-4">
                    <Badge
                        variant={isExpired ? "destructive" : "secondary"}
                        className={`${isExpired ? 'bg-red-500' : 'bg-green-500'} text-white text-sm px-3 py-1`}
                    >
                        <Clock className="h-3 w-3 mr-1" />
                        {getTimeRemaining()}
                    </Badge>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="text-white font-bold text-xl md:text-2xl">{offer.title}</h2>
                    {offer.description && (
                        <p className="text-white/80 text-sm mt-1">{offer.description}</p>
                    )}
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

            {/* Products Grid */}
            <div className="max-w-4xl mx-auto p-4 pb-28">
                <div className="flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5 text-primary" />
                    <h3 className="font-bold text-lg">Products in this offer</h3>
                </div>

                {offer.products && offer.products.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {offer.products.map((product) => {
                            const originalPrice = getOriginalPrice(product);
                            const discountedPrice = getDiscountedPrice(product.id, product);
                            const hasDiscount = discountedPrice !== null && discountedPrice < originalPrice;
                            const cartQuantity = getCartQuantity(product.id);

                            return (
                                <Card key={product.id} className="overflow-hidden">
                                    <div className="aspect-square bg-gray-100 relative">
                                        {product.imageUrl ? (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}
                                        {hasDiscount && (
                                            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
                                                {Math.round(((originalPrice - discountedPrice) / originalPrice) * 100)}% OFF
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-3">
                                        <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                                            {product.name}
                                        </h4>
                                        <div className="mt-2 flex items-center gap-2">
                                            {hasDiscount ? (
                                                <>
                                                    <span className="font-bold text-primary">₹{discountedPrice}</span>
                                                    <span className="text-gray-400 text-sm line-through">₹{originalPrice}</span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-primary">₹{originalPrice}</span>
                                            )}
                                        </div>

                                        {/* Quantity Controls or Add Button */}
                                        {cartQuantity > 0 ? (
                                            <div className="flex items-center justify-between mt-3 h-8 bg-primary rounded-md">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/90"
                                                    onClick={() => handleDecreaseQuantity(product.id)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </Button>
                                                <span className="font-bold text-primary-foreground">{cartQuantity}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/90"
                                                    onClick={() => handleIncreaseQuantity(product.id)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                className="w-full mt-3 h-8 text-sm"
                                                size="sm"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={isExpired}
                                            >
                                                <ShoppingCart className="h-3 w-3 mr-1" />
                                                Add
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
        </div>
    );
}
