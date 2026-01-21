// client/src/components/offers/OffersManager.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Upload, Calendar, Tag, X, Search } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface ProviderOffer {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
    productType: string;
    productIds?: string[];
    discountedPrices?: Record<string, number>;
    expiryDate: string;
    isActive: boolean;
    createdAt: string;
}

interface Product {
    id: string;
    name: string;
    price: string | number;
    imageUrl?: string;
    category?: string;
}

interface OffersManagerProps {
    providerId: string;
    categorySlug: string;
}

// Debounce hook for search optimization
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

export const OffersManager: React.FC<OffersManagerProps> = ({
    providerId,
    categorySlug,
}) => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<ProviderOffer | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [productType, setProductType] = useState<string>("");
    const [expiryDate, setExpiryDate] = useState("");
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

    // Combo pricing state
    const [comboPrice, setComboPrice] = useState<string>("");

    // Search state (optimized)
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const searchResultsRef = useRef<HTMLDivElement>(null);

    // Debounce search query (300ms delay)
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Get product type from category slug
    const getProductTypeFromCategory = useCallback(() => {
        switch (categorySlug) {
            case "grocery": return "grocery";
            case "restaurant":
            case "restaurants": return "restaurant";
            case "cake-shop": return "cake";
            case "street-food": return "street_food";
            case "beauty-parlor":
            case "beauty_parlor": return "beauty_parlor";
            default: return "";
        }
    }, [categorySlug]);

    // Calculate total individual price (auto-sum)
    const totalIndividualPrice = useMemo(() => {
        return selectedProducts.reduce((sum, product) => {
            const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
            return sum + (isNaN(price) ? 0 : price);
        }, 0);
    }, [selectedProducts]);

    // Combo price validation
    const comboPriceNum = parseFloat(comboPrice) || 0;
    const isComboPriceValid = comboPrice === "" || comboPriceNum < totalIndividualPrice;
    const showComboWarning = comboPrice !== "" && comboPriceNum >= totalIndividualPrice && totalIndividualPrice > 0;

    // Fetch product categories for dropdown
    const { data: productCategories = [] } = useQuery<string[]>({
        queryKey: ["productCategories", productType],
        queryFn: async () => {
            if (!productType) return [];
            const res = await api.get(`/provider/products/categories?productType=${productType}`);
            return res.data;
        },
        enabled: !!productType && isFormOpen,
        staleTime: 60000, // Cache categories for 1 minute
    });

    // Fetch products with search & category filter (optimized - only 10 results)
    const { data: searchResults = [], isLoading: isSearching } = useQuery<Product[]>({
        queryKey: ["productSearch", productType, debouncedSearchQuery, selectedCategory],
        queryFn: async () => {
            if (!productType || !debouncedSearchQuery.trim()) return [];
            const params = new URLSearchParams({
                productType,
                search: debouncedSearchQuery,
                limit: "10",
            });
            if (selectedCategory) {
                params.append("category", selectedCategory);
            }
            const res = await api.get(`/provider/products/search?${params.toString()}`);
            return res.data;
        },
        enabled: !!productType && !!debouncedSearchQuery.trim() && isFormOpen,
        staleTime: 30000, // Cache search results for 30 seconds
    });

    // Filter out already selected products from search results
    const filteredSearchResults = useMemo(() => {
        const selectedIds = new Set(selectedProducts.map(p => p.id));
        return searchResults.filter(p => !selectedIds.has(p.id));
    }, [searchResults, selectedProducts]);

    // Fetch offers
    const { data: offers, isLoading } = useQuery<ProviderOffer[]>({
        queryKey: ["providerOffers"],
        queryFn: async () => {
            const res = await api.get("/provider/offers");
            return res.data;
        },
    });

    // Create/Update mutation
    const saveOfferMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingOffer) {
                return api.put(`/provider/offers/${editingOffer.id}`, data);
            }
            return api.post("/provider/offers", data);
        },
        onSuccess: () => {
            toast({
                title: editingOffer ? "Offer Updated" : "Offer Created",
                description: "Your offer has been saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["providerOffers"] });
            resetForm();
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to save offer.",
                variant: "destructive",
            });
        },
    });

    // Delete mutation
    const deleteOfferMutation = useMutation({
        mutationFn: (offerId: string) => api.delete(`/provider/offers/${offerId}`),
        onSuccess: () => {
            toast({ title: "Offer Deleted", description: "Offer removed successfully." });
            queryClient.invalidateQueries({ queryKey: ["providerOffers"] });
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to delete offer.",
                variant: "destructive",
            });
        },
    });

    // Toggle active status
    const toggleActiveMutation = useMutation({
        mutationFn: ({ offerId, isActive }: { offerId: string; isActive: boolean }) =>
            api.put(`/provider/offers/${offerId}`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["providerOffers"] });
        },
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setImageUrl("");
        setProductType("");
        setExpiryDate("");
        setSelectedProducts([]);
        setSearchQuery("");
        setSelectedCategory("");
        setShowSearchResults(false);
        setComboPrice("");
        setEditingOffer(null);
        setIsFormOpen(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("images", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            if (!res.ok) {
                throw new Error("Upload failed");
            }

            const data = await res.json();
            if (data.urls && data.urls[0]) {
                setImageUrl(data.urls[0]);
                toast({ title: "Image Uploaded", description: "Poster uploaded successfully." });
            } else {
                throw new Error("No URL returned");
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    const handleEdit = (offer: ProviderOffer) => {
        setEditingOffer(offer);
        setTitle(offer.title);
        setDescription(offer.description || "");
        setImageUrl(offer.imageUrl);
        setProductType(offer.productType);
        setExpiryDate(offer.expiryDate.split("T")[0]);
        // For edit mode, we'd need to fetch product details - simplified for now
        setSelectedProducts(offer.productIds?.map(id => ({ id, name: `Product ${id.slice(0, 6)}...`, price: 0 })) || []);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !imageUrl || !productType || !expiryDate) {
            toast({ title: "Missing Fields", description: "Please fill all required fields including poster image.", variant: "destructive" });
            return;
        }

        // Validate combo price if multiple products selected
        if (selectedProducts.length > 1 && comboPrice && !isComboPriceValid) {
            toast({
                title: "Invalid Combo Price",
                description: "Combo price must be less than the total individual price.",
                variant: "destructive"
            });
            return;
        }

        // Build discounted prices object if combo price is set
        const discountedPrices: Record<string, number> = {};
        if (comboPrice && selectedProducts.length > 0) {
            // Distribute discount proportionally across products (for display purposes)
            const discountRatio = comboPriceNum / totalIndividualPrice;
            selectedProducts.forEach(p => {
                const originalPrice = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
                discountedPrices[p.id] = Math.round(originalPrice * discountRatio * 100) / 100;
            });
        }

        saveOfferMutation.mutate({
            title,
            description,
            imageUrl,
            productType,
            productIds: selectedProducts.map(p => p.id),
            discountedPrices: Object.keys(discountedPrices).length > 0 ? discountedPrices : undefined,
            expiryDate,
            isActive: true,
        });
    };

    const addProduct = (product: Product) => {
        if (!selectedProducts.find(p => p.id === product.id)) {
            setSelectedProducts(prev => [...prev, product]);
        }
        setSearchQuery("");
        setShowSearchResults(false);
    };

    const removeProduct = (productId: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    // Auto-set product type when opening form
    const handleOpenForm = () => {
        const autoType = getProductTypeFromCategory();
        if (autoType) setProductType(autoType);
        setIsFormOpen(true);
    };

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                searchResultsRef.current &&
                !searchResultsRef.current.contains(event.target as Node) &&
                searchInputRef.current &&
                !searchInputRef.current.contains(event.target as Node)
            ) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" /> Create Your Own Offers
                    </CardTitle>
                    <CardDescription>
                        Create promotional offers with custom posters to attract more customers
                    </CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={(open) => {
                    if (!open) resetForm();
                    else handleOpenForm();
                }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Offer
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingOffer ? "Edit Offer" : "Create New Offer"}</DialogTitle>
                            <DialogDescription>
                                Create promotional banners to attract customers
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Poster Upload */}
                            <div className="space-y-2">
                                <Label>Offer Poster (Required)</Label>
                                {imageUrl ? (
                                    <div className="relative">
                                        <img src={imageUrl} alt="Poster" className="w-full h-40 object-cover rounded-lg" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2"
                                            onClick={() => setImageUrl("")}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {isUploading ? (
                                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                            ) : (
                                                <>
                                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                                    <p className="text-sm text-muted-foreground">Click to upload poster</p>
                                                    <p className="text-xs text-muted-foreground">Recommended: 16:9 ratio</p>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label>Offer Title (Required)</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Diwali Special - 30% OFF"
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of the offer..."
                                    rows={2}
                                />
                            </div>

                            {/* Product Type */}
                            <div className="space-y-2">
                                <Label>Business Category</Label>
                                <Select value={productType} onValueChange={(val) => {
                                    setProductType(val);
                                    setSelectedProducts([]);
                                    setSelectedCategory("");
                                    setSearchQuery("");
                                    setComboPrice("");
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select business type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="grocery">Grocery</SelectItem>
                                        <SelectItem value="restaurant">Restaurant Menu</SelectItem>
                                        <SelectItem value="cake">Cake Shop</SelectItem>
                                        <SelectItem value="street_food">Street Food</SelectItem>
                                        <SelectItem value="beauty_parlor">Beauty Parlor (Services)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Product Search & Selection (NEW OPTIMIZED UI) */}
                            {productType && (
                                <div className="space-y-3">
                                    <Label className="flex items-center justify-between">
                                        <span>{productType === 'beauty_parlor' ? 'Add Services to Combo' : 'Add Products to Offer'}</span>
                                        <Badge variant="secondary">{selectedProducts.length} selected</Badge>
                                    </Label>

                                    {/* Category Filter Dropdown */}
                                    {productCategories.length > 0 && (
                                        <Select
                                            value={selectedCategory || "__all__"}
                                            onValueChange={(val) => setSelectedCategory(val === "__all__" ? "" : val)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Filter by category (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__all__">All Categories</SelectItem>
                                                {productCategories.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {/* Search Input */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            ref={searchInputRef}
                                            value={searchQuery}
                                            onChange={(e) => {
                                                setSearchQuery(e.target.value);
                                                setShowSearchResults(true);
                                            }}
                                            onFocus={() => searchQuery && setShowSearchResults(true)}
                                            placeholder="Search products by name..."
                                            className="pl-10"
                                        />

                                        {/* Search Results Dropdown */}
                                        {showSearchResults && searchQuery && (
                                            <div
                                                ref={searchResultsRef}
                                                className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-[200px] overflow-y-auto"
                                            >
                                                {isSearching ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    </div>
                                                ) : filteredSearchResults.length === 0 ? (
                                                    <div className="text-sm text-muted-foreground py-4 text-center">
                                                        {debouncedSearchQuery ? "No products found" : "Type to search..."}
                                                    </div>
                                                ) : (
                                                    filteredSearchResults.map((product) => (
                                                        <div
                                                            key={product.id}
                                                            className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors border-b last:border-b-0"
                                                            onClick={() => addProduct(product)}
                                                        >
                                                            {product.imageUrl && (
                                                                <img
                                                                    src={product.imageUrl}
                                                                    alt={product.name}
                                                                    className="w-10 h-10 object-cover rounded"
                                                                />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">{product.name}</p>
                                                                <p className="text-xs text-muted-foreground">₹{product.price}</p>
                                                            </div>
                                                            <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Products Chips */}
                                    {selectedProducts.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                                            {selectedProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                                                >
                                                    <span className="max-w-[150px] truncate">{product.name}</span>
                                                    <span className="text-xs opacity-70">₹{product.price}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeProduct(product.id)}
                                                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Combo Pricing Section - shows when 2+ items selected */}
                                    {selectedProducts.length >= 2 && (
                                        <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                                    📦 Combo Pricing ({selectedProducts.length} items)
                                                </span>
                                            </div>

                                            {/* Original Total Display */}
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Original Total:</span>
                                                <span className="font-bold text-lg line-through text-red-500">
                                                    ₹{totalIndividualPrice.toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Combo Price Input */}
                                            <div className="space-y-1">
                                                <Label className="text-sm font-medium">
                                                    Discounted Combo Price (Required)
                                                </Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="1"
                                                        value={comboPrice}
                                                        onChange={(e) => setComboPrice(e.target.value)}
                                                        placeholder={`e.g., ${Math.floor(totalIndividualPrice * 0.8)}`}
                                                        className={`pl-7 ${showComboWarning ? 'border-red-500 focus-visible:ring-red-500' : 'border-green-300'}`}
                                                    />
                                                </div>
                                            </div>

                                            {/* Savings Display */}
                                            {comboPrice && isComboPriceValid && (
                                                <div className="flex items-center justify-between text-sm bg-green-100 dark:bg-green-900/40 p-2 rounded">
                                                    <span className="text-green-700 dark:text-green-300 font-medium">
                                                        🎉 Customer Saves:
                                                    </span>
                                                    <span className="font-bold text-green-600 dark:text-green-400">
                                                        ₹{(totalIndividualPrice - comboPriceNum).toFixed(2)} ({Math.round((1 - comboPriceNum / totalIndividualPrice) * 100)}% OFF)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Warning */}
                                            {showComboWarning && (
                                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                                                    <span>⚠️</span>
                                                    <span>To be an effective offer, the combo price must be less than the individual total.</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Expiry Date */}
                            <div className="space-y-2 relative z-10">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Expiry Date (Required)
                                </Label>
                                <Input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    className="cursor-pointer"
                                    onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                                />
                            </div>

                            <div className="flex gap-2 justify-end pt-4">
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saveOfferMutation.isPending}>
                                    {saveOfferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingOffer ? "Update Offer" : "Create Offer"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : !offers || offers.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold">No Offers Yet</h3>
                        <p className="text-muted-foreground mt-2">
                            Create your first promotional offer to attract customers!
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Poster</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Expiry</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {offers.map((offer) => (
                                <TableRow key={offer.id}>
                                    <TableCell>
                                        <img
                                            src={offer.imageUrl}
                                            alt={offer.title}
                                            className="w-20 h-12 object-cover rounded"
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{offer.title}</TableCell>
                                    <TableCell>
                                        {new Date(offer.expiryDate).toLocaleDateString("en-IN")}
                                    </TableCell>
                                    <TableCell>
                                        {isExpired(offer.expiryDate) ? (
                                            <Badge variant="destructive">Expired</Badge>
                                        ) : (
                                            <Badge variant="secondary">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Switch
                                            checked={offer.isActive}
                                            onCheckedChange={(checked) =>
                                                toggleActiveMutation.mutate({ offerId: offer.id, isActive: checked })
                                            }
                                            disabled={isExpired(offer.expiryDate)}
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(offer)}>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => {
                                                if (confirm("Delete this offer?")) {
                                                    deleteOfferMutation.mutate(offer.id);
                                                }
                                            }}
                                            disabled={deleteOfferMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default OffersManager;
