import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  Sparkles,
  Check,
  X,
  TrendingUp,
  Percent,
  Utensils,
  Store,
  ArrowUpDown,
  Filter,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  price: string;
  category?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  imageUrl?: string;
  providerId: string;
}

interface RestaurantData {
  id: string;
  businessName: string;
  categorySlug: string;
  categoryName: string;
  profileImageUrl?: string;
  itemCount: number;
  items: MenuItem[];
}

export default function AdminRestaurantPricing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Bulk dialog state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkScope, setBulkScope] = useState<"current_restaurant" | "all_restaurants">("current_restaurant");
  const [bulkMode, setBulkMode] = useState<"percentage" | "fixed">("percentage");
  const [bulkValue, setBulkValue] = useState<number>(10);
  const [roundToNearest, setRoundToNearest] = useState<number>(5);

  const { data: restaurants, isLoading, refetch } = useQuery<RestaurantData[]>({
    queryKey: ["/api/admin/restaurants-pricing"],
    queryFn: () => api.get("/admin/restaurants-pricing").then((r) => r.data),
  });

  // Single price update mutation
  const updateSinglePriceMutation = useMutation({
    mutationFn: async ({
      providerId,
      itemId,
      price,
      categorySlug,
    }: {
      providerId: string;
      itemId: string;
      price: string;
      categorySlug: string;
    }) => {
      return api.patch(`/admin/restaurants/${providerId}/menu/${itemId}/price`, {
        price,
        categorySlug,
      });
    },
    onSuccess: (_, vars) => {
      toast({
        title: "Price Saved! ⚡",
        description: `Price instantly updated to ₹${vars.price}`,
        duration: 2000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants-pricing"] });
    },
    onError: (err: any) => {
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  // Bulk adjustment mutation
  const bulkAdjustMutation = useMutation({
    mutationFn: async () => {
      if (bulkScope === "all_restaurants" || selectedRestaurantId === "all") {
        return api.post("/admin/restaurants/all/bulk-price-adjust", {
          mode: bulkMode,
          value: bulkValue,
          roundToNearest,
        });
      } else {
        return api.post(`/admin/restaurants/${selectedRestaurantId}/bulk-price-adjust`, {
          mode: bulkMode,
          value: bulkValue,
          roundToNearest,
          categoryFilter: selectedCategory,
        });
      }
    },
    onSuccess: (res: any) => {
      toast({
        title: "Bulk Price Update Applied! ⚡",
        description: res.data?.message || "Prices updated successfully",
      });
      setIsBulkOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/restaurants-pricing"] });
    },
    onError: (err: any) => {
      toast({
        title: "Bulk Adjustment Error",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    },
  });

  // Flatten & filter items
  const activeRestaurant = useMemo(() => {
    if (!restaurants || selectedRestaurantId === "all") return null;
    return restaurants.find((r) => r.id === selectedRestaurantId) || null;
  }, [restaurants, selectedRestaurantId]);

  const categoriesList = useMemo(() => {
    if (!restaurants) return [];
    const cats = new Set<string>();
    const targetRestaurants = activeRestaurant ? [activeRestaurant] : restaurants;
    targetRestaurants.forEach((r) => {
      r.items?.forEach((item) => {
        if (item.category) cats.add(item.category.trim());
      });
    });
    return Array.from(cats).sort();
  }, [restaurants, activeRestaurant]);

  const allDisplayItems = useMemo(() => {
    if (!restaurants) return [];
    let items: Array<MenuItem & { providerName: string; categorySlug: string }> = [];

    const targetRestaurants = activeRestaurant ? [activeRestaurant] : restaurants;

    targetRestaurants.forEach((r) => {
      r.items?.forEach((item) => {
        items.push({
          ...item,
          providerId: r.id,
          providerName: r.businessName,
          categorySlug: r.categorySlug,
        });
      });
    });

    if (selectedCategory && selectedCategory !== "all") {
      items = items.filter(
        (i) => (i.category || "").trim().toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.category || "").toLowerCase().includes(q) ||
          i.providerName.toLowerCase().includes(q)
      );
    }

    return items;
  }, [restaurants, activeRestaurant, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── Top Header Card ─────────────────────────────────────── */}
      <Card className="bg-[#111827] border-white/10 text-white">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl font-bold">
                  Quick Restaurant Price Manager
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400 mt-1">
                Instant inline price updates for any restaurant. No edit dialogs, no waiting.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  setBulkScope(selectedRestaurantId === "all" ? "all_restaurants" : "current_restaurant");
                  setIsBulkOpen(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold gap-2 shadow-lg shadow-orange-500/20"
              >
                <TrendingUp className="h-4 w-4" />
                ⚡ Bulk Price Update
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* ─── Filters & Search Bar ──────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Restaurant Selector */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-400 font-semibold uppercase">Restaurant</Label>
              <Select value={selectedRestaurantId} onValueChange={setSelectedRestaurantId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All Restaurants" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-white/10 text-white max-h-72">
                  <SelectItem value="all">🍽️ All Restaurants & Vendors ({restaurants?.length || 0})</SelectItem>
                  {restaurants?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.businessName} ({r.itemCount} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-400 font-semibold uppercase">Category / Course</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-[#1f2937] border-white/10 text-white max-h-72">
                  <SelectItem value="all">All Categories ({categoriesList.length})</SelectItem>
                  {categoriesList.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-400 font-semibold uppercase">Search Dishes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="e.g. Dosa, Biryani, Pizza, Sandwich..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pl-9"
                />
              </div>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span>
                Showing <strong className="text-white">{allDisplayItems.length}</strong> dishes
              </span>
              <span>•</span>
              <span>
                Across <strong className="text-white">{activeRestaurant ? 1 : (restaurants?.length || 0)}</strong> restaurants
              </span>
            </div>
            <div className="text-emerald-400 flex items-center gap-1 font-medium">
              <span>💡 Tip: Click any price or use +10/-10 buttons to update instantly!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Items Table ─────────────────────────────────────────── */}
      <Card className="bg-[#111827] border-white/10 text-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-2" />
              <p>Loading restaurant dishes & prices...</p>
            </div>
          ) : allDisplayItems.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Utensils className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold">No dishes match the selected filters.</p>
              <p className="text-xs mt-1">Try resetting the search query or category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/[0.02] border-b border-white/10">
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-semibold w-[80px]">Image</TableHead>
                    <TableHead className="text-gray-400 font-semibold min-w-[200px]">Dish / Item Name</TableHead>
                    <TableHead className="text-gray-400 font-semibold min-w-[160px]">Restaurant</TableHead>
                    <TableHead className="text-gray-400 font-semibold">Category</TableHead>
                    <TableHead className="text-gray-400 font-semibold min-w-[220px]">
                      Instant Price Update (₹)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allDisplayItems.map((item) => (
                    <AdminPriceRow
                      key={item.id}
                      item={item}
                      onUpdatePrice={(newPrice) =>
                        updateSinglePriceMutation.mutate({
                          providerId: item.providerId,
                          itemId: item.id,
                          price: newPrice,
                          categorySlug: item.categorySlug,
                        })
                      }
                      isUpdating={
                        updateSinglePriceMutation.isPending &&
                        (updateSinglePriceMutation.variables as any)?.itemId === item.id
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Bulk Price Update Dialog ────────────────────────────── */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="bg-[#1f2937] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg text-white">
              ⚡ Bulk Price Adjustment
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Quickly raise or lower prices across restaurants in 1 click.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Scope */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-gray-400">Target Restaurants</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bulkScope === "current_restaurant" ? "default" : "outline"}
                  size="sm"
                  disabled={selectedRestaurantId === "all"}
                  onClick={() => setBulkScope("current_restaurant")}
                  className={
                    bulkScope === "current_restaurant"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white/5 border-white/10 text-gray-300"
                  }
                >
                  {activeRestaurant ? activeRestaurant.businessName : "Selected Restaurant"}
                </Button>
                <Button
                  type="button"
                  variant={bulkScope === "all_restaurants" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkScope("all_restaurants")}
                  className={
                    bulkScope === "all_restaurants"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white/5 border-white/10 text-gray-300"
                  }
                >
                  All Restaurants ({restaurants?.length || 0})
                </Button>
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-gray-400">Adjustment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={bulkMode === "percentage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode("percentage")}
                  className={
                    bulkMode === "percentage"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white/5 border-white/10 text-gray-300"
                  }
                >
                  Percentage (%)
                </Button>
                <Button
                  type="button"
                  variant={bulkMode === "fixed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode("fixed")}
                  className={
                    bulkMode === "fixed"
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white/5 border-white/10 text-gray-300"
                  }
                >
                  Fixed Amount (₹)
                </Button>
              </div>
            </div>

            {/* Value Presets & Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase text-gray-400">
                  {bulkMode === "percentage" ? "Percentage Change" : "Rupee Change"}
                </Label>
                <span
                  className={`text-sm font-bold ${
                    bulkValue >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {bulkValue >= 0 ? `+${bulkValue}` : bulkValue}
                  {bulkMode === "percentage" ? "%" : " ₹"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(bulkMode === "percentage"
                  ? [5, 10, 15, 20, -5, -10]
                  : [5, 10, 20, 50, -10, -20]
                ).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setBulkValue(preset)}
                    className={`text-xs px-2.5 py-1 rounded-md font-bold border transition-colors ${
                      bulkValue === preset
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                    }`}
                  >
                    {preset > 0 ? `+${preset}` : preset}
                    {bulkMode === "percentage" ? "%" : "₹"}
                  </button>
                ))}
              </div>

              <Input
                type="number"
                value={bulkValue}
                onChange={(e) => setBulkValue(parseFloat(e.target.value) || 0)}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="Enter custom value"
              />
            </div>

            {/* Rounding */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase text-gray-400">Price Rounding</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Nearest ₹5", val: 5 },
                  { label: "Nearest ₹10", val: 10 },
                  { label: "Exact ₹1", val: 1 },
                ].map((r) => (
                  <Button
                    key={r.val}
                    type="button"
                    size="sm"
                    variant={roundToNearest === r.val ? "default" : "outline"}
                    onClick={() => setRoundToNearest(r.val)}
                    className={
                      roundToNearest === r.val
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-white/5 border-white/10 text-gray-300"
                    }
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBulkOpen(false)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => bulkAdjustMutation.mutate()}
              disabled={bulkAdjustMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              {bulkAdjustMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                `Apply ${bulkValue >= 0 ? "+" : ""}${bulkValue}${
                  bulkMode === "percentage" ? "%" : "₹"
                } To ${
                  bulkScope === "all_restaurants"
                    ? "All Restaurants"
                    : activeRestaurant?.businessName || "Restaurant"
                }`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Individual Table Row with Instant Inline Price Editor ─────────
function AdminPriceRow({
  item,
  onUpdatePrice,
  isUpdating,
}: {
  item: MenuItem & { providerName: string; categorySlug: string };
  onUpdatePrice: (newPrice: string) => void;
  isUpdating: boolean;
}) {
  const [val, setVal] = useState(item.price?.toString() || "");
  const [isChanged, setIsChanged] = useState(false);

  React.useEffect(() => {
    setVal(item.price?.toString() || "");
    setIsChanged(false);
  }, [item.price]);

  const handleChange = (newVal: string) => {
    setVal(newVal);
    setIsChanged(newVal !== item.price?.toString());
  };

  const handleSave = () => {
    if (!val || isNaN(parseFloat(val))) return;
    onUpdatePrice(val);
    setIsChanged(false);
  };

  const handleAdjust = (delta: number) => {
    const cur = parseFloat(val) || 0;
    const next = Math.max(0, cur + delta);
    setVal(next.toString());
    onUpdatePrice(next.toString());
    setIsChanged(false);
  };

  return (
    <TableRow className="border-white/5 hover:bg-white/[0.02] transition-colors">
      {/* Thumbnail */}
      <TableCell>
        <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden shrink-0 border border-white/10">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
              🍽️
            </div>
          )}
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              item.isVeg !== false ? "bg-green-500" : "bg-red-500"
            }`}
            title={item.isVeg !== false ? "Veg" : "Non-Veg"}
          />
          <span className="font-semibold text-sm text-gray-100">{item.name}</span>
        </div>
      </TableCell>

      {/* Restaurant */}
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-200">{item.providerName}</span>
          <span className="text-[10px] text-gray-400 capitalize">
            {item.categorySlug === "street-food" ? "Street Food" : "Restaurant"}
          </span>
        </div>
      </TableCell>

      {/* Category */}
      <TableCell>
        <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-300 text-xs">
          {item.category || "General"}
        </Badge>
      </TableCell>

      {/* Instant Price Cell */}
      <TableCell>
        <div className="flex items-center gap-1.5">
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-xs font-bold text-gray-400">₹</span>
            <Input
              type="number"
              min="0"
              value={val}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              className={`h-9 w-24 pl-6 text-sm font-bold bg-white/5 border-white/20 text-white transition-all ${
                isChanged ? "border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10" : ""
              }`}
            />
          </div>

          {/* Save Button (shows when changed or loading) */}
          {isChanged && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isUpdating}
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 text-xs"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 stroke-[3]" />}
              Save
            </Button>
          )}

          {/* Quick Nudge Buttons (+10 / -10) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleAdjust(10)}
              disabled={isUpdating}
              className="h-7 px-2 bg-white/5 hover:bg-white/15 text-orange-400 text-xs font-bold rounded border border-white/10 transition-colors"
              title="Add ₹10"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => handleAdjust(-10)}
              disabled={isUpdating || parseFloat(val) <= 10}
              className="h-7 px-2 bg-white/5 hover:bg-white/15 text-gray-400 text-xs font-bold rounded border border-white/10 transition-colors"
              title="Subtract ₹10"
            >
              -10
            </button>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}
