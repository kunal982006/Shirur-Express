// client/src/pages/provider-dashboard.tsx
// (POORA REBUILT CODE - BLUEPRINT KE HISAB SE)

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ServiceProvider,
  ServiceCategory,
  ServiceProblem,
  Booking,
  Invoice,
  User as UserType,
  ServiceTemplate,
  ServiceOffering,
  RestaurantOrder,
  RentalProperty,
  GroceryOrder,
  StreetFoodOrder,
  QrOrder,
} from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Loader2,
  Save,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Play,
  ClipboardCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Home,
  Trash2,
  ArrowLeft,
  User,
  Phone,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import MenuItemForm from "@/components/forms/MenuItemForm";
import { QuickImageUpload } from "@/components/forms/QuickImageUpload";
import { OffersManager } from "@/components/offers/OffersManager";
import PermissionBanner from "@/components/PermissionBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link, Redirect } from "wouter";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";

// --- TYPES ---

// Provider profile API se jaisa aayega
type ProviderProfileWithCategory = ServiceProvider & {
  category: ServiceCategory;
  profileImageUrl?: string | null;
  galleryImages?: string[] | null;
  beautyServices?: ServiceOffering[]; // NAYA: Include beautyServices
};

// Booking API se jaisi aayegi (user aur invoice ke saath)
type FullBooking = Booking & {
  user: Pick<UserType, "id" | "username" | "phone">;
  invoice: Invoice | null;
  problem: { id: string; name: string; categoryId: string } | null;
  serviceOffering: { id: string; name: string; imageUrl?: string | null; template: { name: string } | null } | null;
};

// Bill/Invoice create karne ka Zod schema
const billFormSchema = z.object({
  serviceCharge: z.preprocess(
    (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))),
    z.number().min(0, "Service charge is required")
  ),
  spareParts: z.array(
    z.object({
      part: z.string().min(1, "Part name is required"),
      cost: z.preprocess(
        (val) => (val === "" ? 0 : parseFloat(z.string().parse(val))),
        z.number().min(0, "Price must be positive")
      ),
    })
  ).optional(),
  // notes: z.string().optional(), // Notes abhi form mein nahi hain, baad mein add kar sakte hain
});

type BillFormData = z.infer<typeof billFormSchema>;

// --- COMPONENT 1: MENU MANAGER (Yeh waise ka waisa hai) ---
// --- COMPONENT 1: MENU MANAGER (REFACTORED FOR CATEGORIES & SEARCH) ---
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

const MenuItemsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const providerCategorySlug = providerProfile.category?.slug;
  const isGrocery = providerCategorySlug === "grocery";

  // --- For NON-GROCERY: load all items at once (small data) ---
  const {
    data: menuItems,
    isLoading: isLoadingMenuItems,
    refetch: refetchMenuItems,
  } = useQuery<any[]>({
    queryKey: ["providerMenuItems", providerCategorySlug],
    queryFn: async () => {
      if (!providerCategorySlug) return [];
      const res = await api.get(
        `/provider/menu-items/${providerCategorySlug}`
      );
      return res.data;
    },
    enabled: !!providerCategorySlug && !isGrocery,
  });

  // --- For GROCERY: lightweight categories endpoint (fast!) ---
  const {
    data: groceryCategories,
    isLoading: isLoadingGroceryCategories,
  } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["providerGroceryCategories"],
    queryFn: async () => {
      const res = await api.get("/provider/grocery-categories");
      return res.data;
    },
    enabled: isGrocery,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search for server-side grocery search
  useEffect(() => {
    if (!isGrocery) return;
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, isGrocery]);

  // --- For GROCERY: lazy-load items for selected category ---
  const {
    data: groceryCategoryItems,
    isLoading: isLoadingCategoryItems,
  } = useQuery<any[]>({
    queryKey: ["groceryCategoryItems", selectedCategory],
    queryFn: async () => {
      const res = await api.get(
        `/provider/menu-items/grocery?category=${encodeURIComponent(selectedCategory!)}`
      );
      return res.data;
    },
    enabled: isGrocery && !!selectedCategory,
  });

  // --- For GROCERY: server-side search ---
  const {
    data: grocerySearchResults,
    isLoading: isSearching,
  } = useQuery<any[]>({
    queryKey: ["grocerySearch", debouncedSearch],
    queryFn: async () => {
      const res = await api.get(
        `/provider/menu-items/grocery?search=${encodeURIComponent(debouncedSearch)}&limit=20`
      );
      return res.data;
    },
    enabled: isGrocery && debouncedSearch.length >= 2,
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/provider/menu-items/${providerCategorySlug}/${itemId}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Menu item deleted." });
      // Invalidate relevant queries
      if (isGrocery) {
        queryClient.invalidateQueries({ queryKey: ["providerGroceryCategories"] });
        queryClient.invalidateQueries({ queryKey: ["groceryCategoryItems", selectedCategory] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["providerMenuItems", providerCategorySlug] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete.",
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) =>
      api.patch(`/provider/menu-items/${providerCategorySlug}/${itemId}`, { isAvailable }),
    onSuccess: () => {
      toast({ title: "Updated", description: "Item availability updated." });
      if (isGrocery) {
        queryClient.invalidateQueries({ queryKey: ["providerGroceryCategories"] });
        queryClient.invalidateQueries({ queryKey: ["groceryCategoryItems", selectedCategory] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["providerMenuItems", providerCategorySlug] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    if (isGrocery) {
      queryClient.invalidateQueries({ queryKey: ["providerGroceryCategories"] });
      queryClient.invalidateQueries({ queryKey: ["groceryCategoryItems", selectedCategory] });
    } else {
      refetchMenuItems();
    }
  };

  // --- For NON-GROCERY: client-side search ---
  const searchResults = React.useMemo(() => {
    if (isGrocery) return []; // Grocery uses server-side search
    if (!searchQuery || searchQuery.length < 1 || !Array.isArray(menuItems)) return [];
    const query = searchQuery.toLowerCase();
    const matches = menuItems.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.category || "").toLowerCase().includes(query)
    );
    return matches.slice(0, 20);
  }, [menuItems, searchQuery, isGrocery]);

  // --- For NON-GROCERY: derive categories from loaded items ---
  const categories = React.useMemo(() => {
    if (isGrocery) return []; // Grocery uses groceryCategories from API
    if (!Array.isArray(menuItems)) return [];
    const catMap = new Map<string, number>();
    menuItems.forEach(item => {
      const cat = item.category || "Uncategorized";
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems, isGrocery]);

  // Items to display in the selected category view
  const filteredItems = React.useMemo(() => {
    if (!selectedCategory) return [];
    if (isGrocery) return groceryCategoryItems || [];
    if (!Array.isArray(menuItems)) return [];
    return menuItems.filter(item => (item.category || "Uncategorized") === selectedCategory);
  }, [menuItems, selectedCategory, isGrocery, groceryCategoryItems]);

  // Choose which categories list to show
  const displayCategories = isGrocery ? (groceryCategories || []) : categories;
  const isLoadingCategories = isGrocery ? isLoadingGroceryCategories : isLoadingMenuItems;
  const hasItems = isGrocery ? (groceryCategories && groceryCategories.length > 0) : (Array.isArray(menuItems) && menuItems.length > 0);

  // Search results to display
  const displaySearchResults = isGrocery ? (grocerySearchResults || []) : searchResults;

  // Main UI Render
  return (
    <Card>
      <CardHeader className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Menu Items</CardTitle>
            <CardDescription>
              Manage the items for your '
              {providerProfile.category ? providerProfile.category.name : "service"}
              ' service.
            </CardDescription>
          </div>
          <Dialog
            open={isFormOpen}
            onOpenChange={(isOpen) => {
              setIsFormOpen(isOpen);
              if (!isOpen) setEditingItem(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditingItem(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Item" : "Add New Item"}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details for your service or product.
                </DialogDescription>
              </DialogHeader>
              <MenuItemForm
                providerId={providerProfile.id}
                categorySlug={providerCategorySlug}
                initialData={editingItem}
                onSuccess={handleFormSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* --- Search Bar with Autocomplete --- */}
        <div className="relative border rounded-md">
          <Command className="rounded-lg border shadow-md">
            <CommandInput
              placeholder="Search for any product across all categories..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            {/* Show list only when items exist and not empty */}
            {searchQuery.length > 0 && (
              <CommandList className="max-h-[300px] overflow-y-auto">
                {isGrocery && isSearching ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : displaySearchResults.length === 0 ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <CommandGroup heading="Suggestions">
                    {displaySearchResults.map(item => (
                      <CommandItem key={item.id} onSelect={() => {
                        setSelectedCategory(item.category || "Uncategorized");
                        setSearchQuery(""); // Clear search after selection
                      }}>
                        <div className="flex items-center gap-2 w-full cursor-pointer">
                          {item.imageUrl && (
                            <img src={item.imageUrl} className="w-8 h-8 rounded-sm object-cover" />
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground">{item.category}</span>
                          </div>
                          <span className="ml-auto font-bold text-sm">₹{item.price}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            )}
          </Command>
        </div>
      </CardHeader>

      <CardContent>
        {isLoadingCategories ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading menu...
          </div>
        ) : !hasItems ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Your Menu is Empty</h3>
          </div>
        ) : !selectedCategory ? (
          // --- CATEGORIES GRID VIEW ---
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCategories.map((cat) => (
              <Card
                key={cat.name}
                className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-primary"
                onClick={() => setSelectedCategory(cat.name)}
              >
                <CardHeader className="p-4">
                  <CardTitle className="text-lg truncate" title={cat.name}>{cat.name}</CardTitle>
                  <CardDescription>{cat.count} Items</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          // --- SELECTED CATEGORY ITEM LIST ---
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Categories
              </Button>
              <h3 className="text-xl font-bold ml-2">{selectedCategory}</h3>
              <Badge variant="secondary" className="ml-2">{filteredItems.length} Items</Badge>
            </div>

            {isGrocery && isLoadingCategoryItems ? (
              <div className="flex justify-center py-10">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading items...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <QuickImageUpload 
                          itemId={item.id} 
                          categorySlug={providerCategorySlug || ''} 
                          currentImage={item.imageUrl} 
                          onUploadSuccess={() => {
                            if (isGrocery) {
                              queryClient.invalidateQueries({ queryKey: ["providerGroceryCategories"] });
                              queryClient.invalidateQueries({ queryKey: ["groceryCategoryItems", selectedCategory] });
                            } else {
                              refetchMenuItems();
                            }
                          }} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div>{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                      </TableCell>
                      <TableCell className="font-bold">₹{item.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1" title={item.isAvailable === false ? 'Sold Out' : 'Available'}>
                            <span className={`text-xs font-medium ${item.isAvailable === false ? 'text-red-500' : 'text-green-600'}`}>
                              {item.isAvailable === false ? 'Off' : 'On'}
                            </span>
                            <Switch
                              checked={item.isAvailable !== false}
                              onCheckedChange={(checked) => toggleAvailabilityMutation.mutate({ itemId: item.id, isAvailable: checked })}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={
                              deleteMenuItemMutation.isPending &&
                              deleteMenuItemMutation.variables === item.id
                            }
                          >
                            {deleteMenuItemMutation.isPending &&
                              deleteMenuItemMutation.variables === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 2: BOOKING MANAGER (POORA NAYA BANA HAI) ---
const BookingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Bookings Fetch karne ka logic
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<
    FullBooking[]
  >({
    queryKey: ["providerBookings"],
    queryFn: async () => {
      const res = await api.get("/provider/my-bookings");
      return res.data;
    },
    // Har 30 second mein refresh karo (urgent bookings ke liye)
    refetchInterval: 30000,
  });

  // Grocery Orders Fetch karne ka logic
  const { data: groceryOrders, isLoading: isLoadingOrders } = useQuery<GroceryOrder[]>({
    queryKey: ["providerGroceryOrders"],
    queryFn: async () => {
      const res = await api.get("/provider/grocery-orders");
      return res.data;
    },
  });

  // Restaurant / Cake Orders Fetch
  const { data: restaurantOrders, isLoading: isLoadingRestaurantOrders } = useQuery<RestaurantOrder[]>({
    queryKey: ["providerRestaurantOrders"],
    queryFn: async () => {
      const res = await api.get("/provider/restaurant-orders");
      return res.data;
    },
  });

  // Action mutations (Accept / Start Job)
  const updateBookingStatusMutation = useMutation({
    mutationFn: ({
      bookingId,
      action,
    }: {
      bookingId: string;
      action: "accept" | "start-job";
    }) => api.patch(`/bookings/${bookingId}/${action}`),
    onSuccess: (data) => {
      toast({
        title: `Booking ${data.data.status}`,
        description: `Booking ID ${data.data.id} has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update booking.",
        variant: "destructive",
      });
    },
  });

  // Restaurant/Cake Order status update mutation
  const updateRestaurantOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/restaurant-orders/${orderId}/status`, { status }),
    onSuccess: () => {
      toast({ title: "Order Updated", description: "Order status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["providerRestaurantOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  // Grocery Order status update mutation
  const updateGroceryOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/grocery-orders/${orderId}/status`, { status }),
    onSuccess: () => {
      toast({ title: "Order Updated", description: "Order status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["providerGroceryOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  // Helper: get next status action for order
  const getOrderAction = (status: string | null) => {
    switch (status) {
      case 'paid':
      case 'pending':
        return { label: '✅ Accept Order', nextStatus: 'accepted', color: 'bg-blue-600 hover:bg-blue-700' };
      case 'accepted':
        return { label: '👨‍🍳 Start Preparing', nextStatus: 'preparing', color: 'bg-yellow-600 hover:bg-yellow-700' };
      case 'preparing':
        return { label: '📦 Ready for Pickup', nextStatus: 'ready_for_pickup', color: 'bg-green-600 hover:bg-green-700' };
      default:
        return null; // No action for delivered/completed/cancelled
    }
  };

  const getBadgeColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "pending": return "default"; // Blue
      case "accepted": return "secondary"; // Gray
      case "in_progress": return "secondary"; // Gray
      case "awaiting_otp": return "secondary"; // Gray
      case "awaiting_billing": return "secondary"; // Gray
      case "pending_payment": return "secondary"; // Gray
      case "completed": return "default"; // Green (custom style se)
      case "cancelled": return "destructive"; // Red
      default: return "outline";
    }
  };

  const filterBookings = (statusList: string[]) => {
    if (!Array.isArray(bookings)) return [];
    return bookings.filter(b => statusList.includes(b.status || 'pending'));
  }

  const newBookings = filterBookings(['pending']);
  const activeBookings = filterBookings(['accepted', 'in_progress', 'awaiting_otp', 'awaiting_billing', 'pending_payment']);
  const completedBookings = filterBookings(['completed', 'cancelled']);

  // Determine default tab based on category
  const defaultTab = (providerProfile.category?.slug === 'cake-shop' || providerProfile.category?.slug === 'grocery' || providerProfile.category?.slug === 'restaurants')
    ? "orders"
    : "new";

  if (isLoadingBookings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            View and manage your upcoming bookings for '
            {providerProfile.category ? providerProfile.category.name : 'your service'}
            '.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading
            bookings...
          </div>
        </CardContent>
      </Card>
    );
  }

  // BUG FIX: Ab !Array.isArray check kar rahe hain
  if (!Array.isArray(bookings)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold text-destructive">Error Loading Bookings</h3>
            <p className="text-muted-foreground mt-2">
              Could not fetch bookings. Please try refreshing.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="new">
          New ({newBookings.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Active ({activeBookings.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Completed ({completedBookings.length})
        </TabsTrigger>
        <TabsTrigger value="orders">
          Orders ({(groceryOrders?.length || 0) + (restaurantOrders?.length || 0)})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="new" className="mt-6">
        <BookingList
          bookings={newBookings}
          emptyMessage="You have no new booking requests."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="active" className="mt-6">
        <BookingList
          bookings={activeBookings}
          emptyMessage="You have no active jobs."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="completed" className="mt-6">
        <BookingList
          bookings={completedBookings}
          emptyMessage="You have no completed jobs."
          mutations={{ updateBookingStatusMutation }}
        />
      </TabsContent>

      <TabsContent value="orders" className="mt-6">
        {(!Array.isArray(groceryOrders) || groceryOrders.length === 0) && (!Array.isArray(restaurantOrders) || restaurantOrders.length === 0) ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Orders Yet</h3>
            <p className="text-muted-foreground mt-2">
              You haven't received any orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Restaurant / Cake Orders */}
            {Array.isArray(restaurantOrders) && restaurantOrders.map((order) => (
              <Card key={order.id} className="shadow-md border-l-4 border-orange-500">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>🎂 Order #{order.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      {order.paymentMethod === 'cod' && <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/30">COD</Badge>}
                      {order.paymentMethod === 'online' && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/30">PAID Online</Badge>}
                      <Badge className="bg-orange-600">
                        {order.status?.toUpperCase() || "PENDING"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.createdAt || new Date()).toLocaleString("en-IN")}
                    {/* Delivery Time Slot */}
                    {order.deliveryMode === 'scheduled' && order.scheduledDeliveryTime ? (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-700">
                        📅 Deliver at {order.scheduledDeliveryTime}
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-300 dark:border-green-700">
                        ⚡ Deliver Now
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2 text-sm">Items:</h4>
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span>₹{order.totalAmount}</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </p>
                  {/* Order Action Buttons */}
                  {(() => {
                    const action = getOrderAction(order.status);
                    if (!action) return (
                      <Badge variant="outline" className="mt-2">
                        {order.status === 'ready_for_pickup' ? '✅ Ready for Pickup' : order.status === 'delivered' ? '🎉 Delivered' : ''}
                      </Badge>
                    );
                    return (
                      <Button
                        className={`w-full mt-3 text-white font-bold ${action.color}`}
                        onClick={() => updateRestaurantOrderMutation.mutate({ orderId: order.id, status: action.nextStatus })}
                        disabled={updateRestaurantOrderMutation.isPending}
                      >
                        {updateRestaurantOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {action.label}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
            {/* Grocery Orders */}
            {Array.isArray(groceryOrders) && groceryOrders.map((order) => (
              <Card key={order.id} className="shadow-md border-l-4 border-green-500">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Order #{order.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      {order.paymentMethod === 'cod' && <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/30">COD</Badge>}
                      {order.paymentMethod === 'online' && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/30">PAID Online</Badge>}
                      <Badge className="bg-green-600">
                        {order.status?.toUpperCase() || "CONFIRMED"}
                      </Badge>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Placed on {new Date(order.createdAt || new Date()).toLocaleString("en-IN")}
                    {/* Delivery Time Slot */}
                    {order.deliveryMode === 'scheduled' && order.scheduledDeliveryTime ? (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-700">
                        📅 Deliver at {order.scheduledDeliveryTime}
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-300 dark:border-green-700">
                        ⚡ Deliver Now
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="bg-muted p-3 rounded-md">
                    <h4 className="font-medium mb-2 text-sm">Items:</h4>
                    {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>Delivery Address:</strong> {order.deliveryAddress}
                  </p>
                  {/* Grocery Order Action Buttons */}
                  {(() => {
                    const action = getOrderAction(order.status);
                    if (!action) return (
                      <Badge variant="outline" className="mt-2">
                        {order.status === 'ready_for_pickup' ? '✅ Ready for Pickup' : order.status === 'delivered' ? '🎉 Delivered' : ''}
                      </Badge>
                    );
                    return (
                      <Button
                        className={`w-full mt-3 text-white font-bold ${action.color}`}
                        onClick={() => updateGroceryOrderMutation.mutate({ orderId: order.id, status: action.nextStatus })}
                        disabled={updateGroceryOrderMutation.isPending}
                      >
                        {updateGroceryOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {action.label}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

// Helper function for badge colors
const getBadgeColor = (status: string) => {
  switch (status) {
    case "pending":
      return "secondary";
    case "accepted":
    case "in_progress":
      return "default";
    case "awaiting_otp":
    case "awaiting_billing":
      return "outline";
    case "pending_payment":
      return "outline";
    case "declined":
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

// --- NAYA HELPER COMPONENT: BOOKING LIST ---
const BookingList: React.FC<{
  bookings: FullBooking[];
  emptyMessage: string;
  mutations: {
    updateBookingStatusMutation: any;
  }
}> = ({ bookings, emptyMessage, mutations }) => {

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">{emptyMessage}</h3>
        <p className="text-muted-foreground mt-2">
          This tab will update automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="shadow-md">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{booking.problem?.name || booking.serviceOffering?.name || booking.serviceOffering?.template?.name || booking.notes || booking.serviceType?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()) + " Service" || "Service Request"}</span>
              <div className="flex items-center gap-2">
                {booking.paymentMethod === 'cod' && <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50 dark:bg-orange-950/30">COD</Badge>}
                {booking.paymentMethod === 'online' && <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-950/30">PAID Online</Badge>}
                <Badge
                  variant={booking.status === 'completed' ? 'default' : getBadgeColor(booking.status || 'pending')}
                  className={booking.status === 'completed' ? 'bg-green-600' : ''}
                >
                  {booking.status?.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Customer: {booking.user.username} | Phone: {booking.user.phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {booking.serviceOffering?.imageUrl && (
                <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 border bg-muted">
                  <img
                    src={booking.serviceOffering.imageUrl}
                    alt={booking.serviceOffering.name || "Service"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Booking ID: {booking.id.slice(-8)}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <p className="text-sm">
                    <strong>Service:</strong> {booking.serviceOffering?.name || booking.problem?.name || booking.serviceOffering?.template?.name || "Service Request"}
                  </p>
                  <p className="text-sm">
                    <strong>Type:</strong> {booking.serviceType?.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </p>
                </div>
                <p className="text-sm">
                  <strong>Customer:</strong> {booking.user.username} ({booking.user.phone})
                </p>
                <p className="text-sm">
                  <strong>Address:</strong> {booking.userAddress}
                </p>
                {booking.isUrgent && <Badge variant="destructive" className="mt-1">URGENT</Badge>}
                {booking.notes && (
                  <p className="pt-2 text-sm italic border-t mt-2">
                    <strong>Notes:</strong> {booking.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <ProviderBookingActions
              booking={booking}
              mutations={mutations}
            />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

// --- NAYA HELPER COMPONENT: BOOKING ACTIONS (SAARA LOGIC YAHAN HAI) ---
const ProviderBookingActions: React.FC<{
  booking: FullBooking;
  mutations: { updateBookingStatusMutation: any; };
}> = ({ booking, mutations }) => {
  const { updateBookingStatusMutation } = mutations;
  const [otp, setOtp] = useState("");
  const [isBillOpen, setIsBillOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --- Saare mutations (API calls) ---
  const generateOtpMutation = useMutation({
    mutationFn: (bookingId: string) =>
      api.post(`/bookings/${bookingId}/generate-otp`),
    onSuccess: () => {
      toast({
        title: "OTP Sent",
        description: "OTP has been sent to the customer's phone.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "OTP Error",
        description: error.response?.data?.message || "Failed to send OTP.",
        variant: "destructive",
      });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: { bookingId: string, otp: string }) =>
      api.post(`/bookings/${data.bookingId}/verify-otp`, { otp: data.otp }),
    onSuccess: () => {
      toast({
        title: "OTP Verified!",
        description: "Please create the final bill for the customer.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(true); // OTP Sahi hone par bill modal kholo
    },
    onError: (error: any) => {
      toast({
        title: "Invalid OTP",
        description: error.response?.data?.message || "That OTP is incorrect.",
        variant: "destructive",
      });
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: BillFormData) =>
      api.post(`/bookings/${booking.id}/create-invoice`, data),
    onSuccess: () => {
      toast({
        title: "Bill Created!",
        description: "Waiting for customer to complete payment.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
      setIsBillOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Billing Error",
        description:
          error.response?.data?.message || "Failed to create bill.",
        variant: "destructive",
      });
    },
  });
  // --- Mutations khatam ---

  // --- Action Handlers ---
  const handleStartJob = () => {
    updateBookingStatusMutation.mutate({ bookingId: booking.id, action: "start-job" });
  };
  const handleJobDone = () => {
    generateOtpMutation.mutate(booking.id);
  };
  const handleVerifyOtp = () => {
    if (otp.length === 6) {
      verifyOtpMutation.mutate({ bookingId: booking.id, otp });
    }
  };
  const handleBillSubmit = (data: BillFormData) => {
    createInvoiceMutation.mutate(data);
  };
  // --- Handlers khatam ---


  // Cancel booking mutation (for provider - before job starts)
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      api.patch(`/bookings/${bookingId}/provider-cancel`),
    onSuccess: () => {
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["providerBookings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Cancel Failed",
        description: error.response?.data?.message || "Failed to cancel booking.",
        variant: "destructive",
      });
    },
  });

  const handleCancelBooking = () => {
    if (confirm("Are you sure you want to cancel this booking? The customer will be notified.")) {
      cancelBookingMutation.mutate(booking.id);
    }
  };

  // --- Logic ke hisaab se button dikhao ---
  if (booking.status === "pending" || booking.status === "accepted") {
    return (
      <div className="flex gap-2 flex-wrap">
        <Button
          onClick={handleStartJob}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={updateBookingStatusMutation.isPending}
        >
          <Play className="mr-2 h-4 w-4" /> Start Job
        </Button>
        <Button
          variant="destructive"
          onClick={handleCancelBooking}
          disabled={cancelBookingMutation.isPending}
        >
          {cancelBookingMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          Cancel Booking
        </Button>
      </div>
    );
  }

  if (booking.status === "in_progress") {
    return (
      <Button
        onClick={handleJobDone}
        className="bg-green-600 hover:bg-green-700"
        disabled={generateOtpMutation.isPending}
      >
        {generateOtpMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-2 h-4 w-4" />}
        Job Done (Get OTP)
      </Button>
    );
  }

  if (booking.status === "awaiting_otp") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Verify OTP
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Service OTP</DialogTitle>
            <DialogDescription>
              Please ask the customer ({booking.user.username}) for the 6-digit
              OTP sent to their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <DialogFooter>
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify
            </Button>
          </DialogFooter>
          <div className="flex justify-center pb-4">
            <Button
              variant="link"
              size="sm"
              onClick={() => generateOtpMutation.mutate(booking.id)}
              disabled={generateOtpMutation.isPending}
              className="text-muted-foreground"
            >
              {generateOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Sending...
                </>
              ) : (
                "Resend OTP"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (booking.status === "awaiting_billing") {
    return (
      <>
        <Button
          onClick={() => setIsBillOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <FileText className="mr-2 h-4 w-4" /> Create Final Bill
        </Button>
        <CreateBillDialog
          isOpen={isBillOpen}
          onOpenChange={setIsBillOpen}
          onSubmit={handleBillSubmit}
          isLoading={createInvoiceMutation.isPending}
        />
      </>
    );
  }

  if (booking.status === "pending_payment") {
    return (
      <Badge variant="secondary" className="p-2 text-base">
        <DollarSign className="mr-2 h-4 w-4" />
        Waiting for Customer Payment
      </Badge>
    )
  }

  if (booking.status === "completed") {
    // TODO: "View Invoice" ka button bana sakte hain
    return null;
  }

  if (booking.status === "cancelled") {
    return null; // Koi action nahi
  }

  return null; // Fallback
};

// --- NAYA HELPER COMPONENT: CREATE BILL DIALOG (with form) ---
const CreateBillDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BillFormData) => void;
  isLoading: boolean;
}> = ({ isOpen, onOpenChange, onSubmit, isLoading }) => {
  const form = useForm<BillFormData>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      spareParts: [],
      serviceCharge: undefined, // 0 ki jagah undefined
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "spareParts"
  });

  const watchSpareParts = form.watch("spareParts");
  const watchServiceCharge = form.watch("serviceCharge");

  const total =
    (watchSpareParts?.reduce((acc, part) => acc + (Number(part.cost) || 0), 0) || 0) +
    (Number(watchServiceCharge) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Final Bill</DialogTitle>
          <DialogDescription>
            Enter service charges and any spare parts used for this job.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 max-h-[60vh] overflow-y-auto p-1"
          >
            <FormField
              control={form.control}
              name="serviceCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Charge (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 350" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Spare Parts Used (Optional)</Label>
              <div className="space-y-2 mt-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.part`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="Part Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`spareParts.${index}.cost`}
                      render={({ field }) => (
                        <FormItem className="w-[120px]">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Price (₹)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => append({ part: "", cost: 0 })}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Part
              </Button>
            </div>

            <div className="text-xl font-bold text-right pt-4">
              Total Bill: ₹{total.toFixed(2)}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Bill & Request Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT 3: SPECIALIZATIONS MANAGER (Waise ka waisa) ---
const SpecializationsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(
    () => providerProfile.specializations || []
  );

  const { data: allProblems, isLoading: isLoadingProblems } = useQuery<
    ServiceProblem[]
  >({
    queryKey: ["serviceProblems", providerProfile.category.slug],
    queryFn: async () => {
      const res = await api.get(
        `/service-problems?category=${providerProfile.category.slug}`
      );
      return res.data;
    },
    enabled: !!providerProfile.category.slug,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (specializations: string[]) =>
      api.patch("/provider/profile", { specializations }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your specializations have been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ["providerProfile", providerProfile.userId],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update.",
        variant: "destructive",
      });
    },
  });

  const handleCheckedChange = (
    checked: boolean | "indeterminate",
    specName: string
  ) => {
    setSelectedSpecs((prev) =>
      checked ? [...prev, specName] : prev.filter((s) => s !== specName)
    );
  };

  const handleSave = () => {
    updateProfileMutation.mutate(selectedSpecs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Specializations</CardTitle>
        <CardDescription>
          Select the devices and services you are an expert in. This will be
          shown to customers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingProblems ? (
          <div className="flex justify-center py-10">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading options...
          </div>
        ) : !allProblems || allProblems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Service Problems Found</h3>
            <p className="text-muted-foreground mt-2">
              (Admin needs to add problems for '{providerProfile.category.name}'
              category)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center space-x-2 p-3 border rounded-md"
                >
                  <Checkbox
                    id={problem.id}
                    checked={selectedSpecs.includes(problem.name)}
                    onCheckedChange={(checked) =>
                      handleCheckedChange(checked, problem.name)
                    }
                  />
                  <Label
                    htmlFor={problem.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {problem.name}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Specializations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- CANONICAL SECTION MAPPING (Prevents duplicate categories) ---
const CANONICAL_SECTIONS = ["Hair", "Skin Care", "Makeover"] as const;
type CanonicalSection = typeof CANONICAL_SECTIONS[number];

const SECTION_ALIASES: Record<string, CanonicalSection> = {
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
};

const SECTION_ICONS: Record<string, string> = {
  "Hair": "💇‍♀️",
  "Skin Care": "✨",
  "Makeover": "💄",
  "All": "📋",
};

const normalizeSection = (raw: string | null | undefined): CanonicalSection => {
  if (!raw) return "Hair";
  const key = raw.toLowerCase().trim();
  return SECTION_ALIASES[key] || (CANONICAL_SECTIONS.includes(raw as CanonicalSection) ? raw as CanonicalSection : "Hair");
};

const SUBCAT_SUGGESTIONS: Record<CanonicalSection, string[]> = {
  "Hair": ["Haircut", "Hairstyles", "Hair Treatment", "Hair Coloring", "Hair Spa"],
  "Skin Care": ["Facials", "Hair Removal", "Waxing", "Threading", "Bleach", "Cleanup"],
  "Makeover": ["Makeup", "Nail Art", "Bridal Packages", "Mehendi", "Saree Draping"],
};

// --- COMPONENT 4: BEAUTY SERVICE SELECTOR (Excel-like Spreadsheet) ---
const BeautyServiceSelector: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const categorySlug = providerProfile.category.slug;

  // Filter state
  const [activeFilter, setActiveFilter] = useState<"All" | CanonicalSection>("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddingRow, setIsAddingRow] = useState(false);

  // New row state
  const [newRow, setNewRow] = useState({
    section: "Hair" as CanonicalSection,
    subCategory: "",
    name: "",
    price: "",
    duration: "30",
  });

  // Fetch Master Templates
  const { data: templates } = useQuery<ServiceTemplate[]>({
    queryKey: ["serviceTemplates", categorySlug],
    queryFn: async () => {
      const res = await api.get(`/service-templates/${categorySlug}`);
      return res.data;
    },
  });

  const existingServices = providerProfile.beautyServices || [];
  const [servicesList, setServicesList] = useState<ServiceOffering[]>([]);

  // Normalize existing services on load
  React.useEffect(() => {
    if (existingServices.length > 0) {
      const normalized = existingServices.map(s => ({
        ...s,
        section: normalizeSection(s.section || s.subCategory),
        subCategory: s.subCategory || "General",
      }));
      setServicesList(normalized);
    } else if (templates && templates.length > 0) {
      const prefilled = templates.map(t => ({
        id: `temp-${t.id}`,
        providerId: providerProfile.id,
        templateId: t.id,
        name: t.name,
        section: normalizeSection(t.categorySlug === 'beauty' ? 'Hair' : 'Other'),
        subCategory: t.subCategory || "General",
        price: t.defaultPrice,
        duration: 30,
        imageUrl: t.imageUrl,
        isActive: false,
        description: null,
        categorySlug: null,
        createdAt: null,
        updatedAt: null,
      }));
      setServicesList(prefilled);
    }
  }, [existingServices]);

  // Filtered list based on active tab
  const filteredServices = React.useMemo(() => {
    if (activeFilter === "All") return servicesList;
    return servicesList.filter(s => normalizeSection(s.section) === activeFilter);
  }, [servicesList, activeFilter]);

  // Section counts for filter tabs
  const sectionCounts = React.useMemo(() => {
    const counts: Record<string, number> = { "All": servicesList.length };
    CANONICAL_SECTIONS.forEach(sec => { counts[sec] = 0; });
    servicesList.forEach(s => {
      const norm = normalizeSection(s.section);
      counts[norm] = (counts[norm] || 0) + 1;
    });
    return counts;
  }, [servicesList]);

  // Handlers
  const handleUpdateService = (id: string, field: keyof ServiceOffering, value: any) => {
    setServicesList(prev => prev.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleDeleteService = (id: string) => {
    setServicesList(prev => prev.filter(s => s.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected service(s)?`)) return;
    setServicesList(prev => prev.filter(s => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
    toast({ title: "Deleted", description: `${selectedIds.size} services removed. Don't forget to Save.` });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map(s => s.id)));
    }
  };

  const handleAddRow = () => {
    if (!newRow.name || !newRow.price) {
      toast({ title: "Incomplete", description: "Name and Price are required.", variant: "destructive" });
      return;
    }
    const newItem: any = {
      id: `new-${Date.now()}`,
      providerId: providerProfile.id,
      templateId: null,
      section: newRow.section,
      subCategory: newRow.subCategory || "General",
      name: newRow.name,
      price: newRow.price,
      duration: Number(newRow.duration) || 30,
      imageUrl: null,
      isActive: true,
    };
    setServicesList(prev => [...prev, newItem]);
    setNewRow({ section: newRow.section, subCategory: "", name: "", price: "", duration: "30" });
    setIsAddingRow(false);
    toast({ title: "✅ Added", description: `"${newRow.name}" added. Save to apply changes.` });
  };

  // Image upload
  const [isUploading, setIsUploading] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("images", file);
    try {
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const url = res.data.urls[0];
      if (activeUploadId) handleUpdateService(activeUploadId, "imageUrl", url);
      toast({ title: "Image Uploaded" });
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Could not upload.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerUpload = (id: string) => {
    setActiveUploadId(id);
    fileInputRef.current?.click();
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = servicesList.map(s => ({
        providerId: providerProfile.id,
        templateId: s.templateId || undefined,
        name: s.name || "Unnamed Service",
        section: normalizeSection(s.section),
        subCategory: s.subCategory || "General",
        price: String(s.price),
        duration: s.duration || 30,
        imageUrl: s.imageUrl || undefined,
        isActive: true,
      }));
      return api.post("/provider/beauty-services/bulk", { services: payload });
    },
    onSuccess: () => {
      toast({ title: "✅ Saved", description: "Your service menu has been updated." });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", providerProfile.userId] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  return (
    <Card className="w-full">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-xl">📋 My Services</CardTitle>
            <CardDescription>Manage your services like a spreadsheet. Edit inline, bulk-delete, and save.</CardDescription>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete ({selectedIds.size})
              </Button>
            )}
            <Button size="sm" onClick={() => setIsAddingRow(true)} disabled={isAddingRow}>
              <PlusCircle className="mr-1 h-3.5 w-3.5" /> Add Row
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {(["All", ...CANONICAL_SECTIONS] as const).map(sec => (
            <button
              key={sec}
              onClick={() => setActiveFilter(sec as any)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeFilter === sec
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border"
              }`}
            >
              {SECTION_ICONS[sec] || ""} {sec} ({sectionCounts[sec] || 0})
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        {servicesList.length === 0 && !isAddingRow ? (
          <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl mx-4 sm:mx-0">
            <p className="text-lg font-medium mb-1">No services added yet</p>
            <p className="text-sm">Click "Add Row" to start building your service menu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              {/* Sticky Header */}
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="w-10 px-2 py-2.5 text-center">
                    <Checkbox
                      checked={filteredServices.length > 0 && selectedIds.size === filteredServices.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="px-2 py-2.5 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider">Image</th>
                  <th className="px-2 py-2.5 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[160px]">Service Name</th>
                  <th className="px-2 py-2.5 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[110px]">Section</th>
                  <th className="px-2 py-2.5 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wider min-w-[110px]">Sub-Category</th>
                  <th className="px-2 py-2.5 text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider w-[90px]">Price (₹)</th>
                  <th className="px-2 py-2.5 text-right font-semibold text-xs text-muted-foreground uppercase tracking-wider w-[80px]">Mins</th>
                  <th className="px-2 py-2.5 text-center font-semibold text-xs text-muted-foreground uppercase tracking-wider w-[50px]">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredServices.map((service, idx) => (
                  <tr
                    key={service.id}
                    className={`group transition-colors ${
                      selectedIds.has(service.id)
                        ? "bg-primary/5"
                        : idx % 2 === 0
                          ? "bg-background"
                          : "bg-muted/20"
                    } hover:bg-primary/10`}
                  >
                    {/* Checkbox */}
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        checked={selectedIds.has(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                        aria-label={`Select ${service.name}`}
                      />
                    </td>
                    {/* Image thumbnail */}
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => triggerUpload(service.id)}
                        className="relative w-9 h-9 rounded-md border border-dashed border-border overflow-hidden flex items-center justify-center bg-muted/30 hover:border-primary hover:bg-primary/5 transition-colors group/img"
                        title="Click to upload image"
                      >
                        {isUploading && activeUploadId === service.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        ) : service.imageUrl ? (
                          <>
                            <img src={service.imageUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="h-3 w-3 text-white" />
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                    {/* Name */}
                    <td className="px-2 py-1.5">
                      <Input
                        value={service.name || ""}
                        onChange={(e) => handleUpdateService(service.id, "name", e.target.value)}
                        className="h-8 text-sm font-medium border-transparent bg-transparent hover:border-border focus:border-primary focus:bg-background px-1.5"
                        placeholder="Service name"
                      />
                    </td>
                    {/* Section */}
                    <td className="px-2 py-1.5">
                      <select
                        value={normalizeSection(service.section)}
                        onChange={(e) => handleUpdateService(service.id, "section", e.target.value)}
                        className="h-8 w-full rounded-md text-xs border-transparent bg-transparent hover:border-border focus:border-primary focus:bg-background px-1 cursor-pointer"
                      >
                        {CANONICAL_SECTIONS.map(s => (
                          <option key={s} value={s}>{SECTION_ICONS[s]} {s}</option>
                        ))}
                      </select>
                    </td>
                    {/* SubCategory */}
                    <td className="px-2 py-1.5">
                      <Input
                        value={service.subCategory || ""}
                        onChange={(e) => handleUpdateService(service.id, "subCategory", e.target.value)}
                        className="h-8 text-xs border-transparent bg-transparent hover:border-border focus:border-primary focus:bg-background px-1.5"
                        placeholder="Sub-category"
                        list={`subcat-${service.id}`}
                      />
                      <datalist id={`subcat-${service.id}`}>
                        {(SUBCAT_SUGGESTIONS[normalizeSection(service.section)] || []).map(sc => (
                          <option key={sc} value={sc} />
                        ))}
                      </datalist>
                    </td>
                    {/* Price */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={service.price || ""}
                        onChange={(e) => handleUpdateService(service.id, "price", e.target.value)}
                        className="h-8 text-sm text-right font-semibold border-transparent bg-transparent hover:border-border focus:border-primary focus:bg-background px-1.5 w-full"
                        placeholder="0"
                      />
                    </td>
                    {/* Duration */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={service.duration || ""}
                        onChange={(e) => handleUpdateService(service.id, "duration", Number(e.target.value))}
                        className="h-8 text-sm text-right border-transparent bg-transparent hover:border-border focus:border-primary focus:bg-background px-1.5 w-full"
                        placeholder="30"
                      />
                    </td>
                    {/* Delete */}
                    <td className="px-2 py-1.5 text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteService(service.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {/* Add New Row (inline) */}
                {isAddingRow && (
                  <tr className="bg-green-50/50 dark:bg-green-950/20 border-t-2 border-green-300 dark:border-green-800">
                    <td className="px-2 py-2 text-center">
                      <span className="text-green-600 text-xs font-bold">NEW</span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="w-9 h-9 rounded-md border border-dashed border-green-400 flex items-center justify-center bg-green-50 dark:bg-green-950/30">
                        <PlusCircle className="h-3.5 w-3.5 text-green-500" />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={newRow.name}
                        onChange={(e) => setNewRow({ ...newRow, name: e.target.value })}
                        className="h-8 text-sm border-green-300 dark:border-green-700 focus:border-green-500 bg-white dark:bg-green-950/30 px-1.5"
                        placeholder="Service name *"
                        autoFocus
                      />
                    </td>
                    <td className="px-2 py-2">
                      <select
                        value={newRow.section}
                        onChange={(e) => setNewRow({ ...newRow, section: e.target.value as CanonicalSection })}
                        className="h-8 w-full rounded-md text-xs border border-green-300 dark:border-green-700 bg-white dark:bg-green-950/30 px-1 cursor-pointer"
                      >
                        {CANONICAL_SECTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={newRow.subCategory}
                        onChange={(e) => setNewRow({ ...newRow, subCategory: e.target.value })}
                        className="h-8 text-xs border-green-300 dark:border-green-700 bg-white dark:bg-green-950/30 px-1.5"
                        placeholder="Sub-category"
                        list="new-subcat-suggestions"
                      />
                      <datalist id="new-subcat-suggestions">
                        {(SUBCAT_SUGGESTIONS[newRow.section] || []).map(sc => (
                          <option key={sc} value={sc} />
                        ))}
                      </datalist>
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        value={newRow.price}
                        onChange={(e) => setNewRow({ ...newRow, price: e.target.value })}
                        className="h-8 text-sm text-right font-semibold border-green-300 dark:border-green-700 bg-white dark:bg-green-950/30 px-1.5 w-full"
                        placeholder="₹ *"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        type="number"
                        value={newRow.duration}
                        onChange={(e) => setNewRow({ ...newRow, duration: e.target.value })}
                        className="h-8 text-sm text-right border-green-300 dark:border-green-700 bg-white dark:bg-green-950/30 px-1.5 w-full"
                        placeholder="30"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={handleAddRow}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setIsAddingRow(false)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Sticky Save Footer */}
      <CardFooter className="sticky bottom-0 bg-background/95 backdrop-blur py-3 border-t z-10 shadow-lg flex items-center justify-between px-4 sm:px-6">
        <p className="text-xs text-muted-foreground">
          {servicesList.length} service{servicesList.length !== 1 ? "s" : ""} total
          {activeFilter !== "All" && ` • ${filteredServices.length} shown`}
        </p>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="default">
          {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save All Changes
        </Button>
      </CardFooter>
    </Card>
  );
};

// --- COMPONENT: GROCERY ORDERS MANAGER (For Grocery and Cake Shop providers) ---
const GroceryOrdersManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Grocery Orders (Polling every 10 seconds)
  const { data: orders, isLoading } = useQuery<GroceryOrder[]>({
    queryKey: ["providerGroceryOrders", providerProfile.id],
    queryFn: async () => {
      const res = await api.get("/provider/grocery-orders");
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/grocery-orders/${orderId}/status`, { status }),
    onSuccess: (data) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${data.data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["providerGroceryOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading orders...
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No Orders Yet</h3>
        <p className="text-muted-foreground mt-2">
          New orders will appear here automatically.
        </p>
      </div>
    );
  }

  // Filter orders by status
  const pendingOrders = orders.filter((o) => ["pending", "paid"].includes(o.status || ""));
  const activeOrders = orders.filter((o) => ["accepted", "preparing", "ready_for_pickup"].includes(o.status || ""));
  const pastOrders = orders.filter((o) => ["picked_up", "delivered", "cancelled", "out_for_delivery"].includes(o.status || ""));

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6 space-y-4">
        {pendingOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No pending orders.</p>
        ) : (
          pendingOrders.map((order) => (
            <GroceryOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isPending={true}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="active" className="mt-6 space-y-4">
        {activeOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active orders.</p>
        ) : (
          activeOrders.map((order) => (
            <GroceryOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6 space-y-4">
        {pastOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No order history.</p>
        ) : (
          pastOrders.map((order) => (
            <GroceryOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isHistory={true}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

const GroceryOrderCard: React.FC<{
  order: GroceryOrder & { user?: any };
  onStatusChange: (id: string, status: string) => void;
  isPending?: boolean;
  isHistory?: boolean;
}> = ({ order, onStatusChange, isPending, isHistory }) => {
  return (
    <Card className={`shadow-md ${isPending ? "border-l-4 border-green-500 animate-in fade-in slide-in-from-bottom-2" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Order #{order.id.slice(0, 8)}
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(order.createdAt || new Date()).toLocaleTimeString()}
              </span>
              {/* Delivery Time Slot */}
              {order.deliveryMode === 'scheduled' && order.scheduledDeliveryTime ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-700">
                  📅 {order.scheduledDeliveryTime}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold border border-green-300 dark:border-green-700">
                  ⚡ Now
                </span>
              )}
            </CardTitle>
            <div className="flex flex-col text-sm text-foreground/80">
               <span className="font-semibold flex items-center gap-1">
                 <User className="h-3 w-3" /> {order.user?.username || "Customer"}
               </span>
               <span className="flex items-center gap-1 text-muted-foreground">
                 <Phone className="h-3 w-3" /> {order.user?.phone || "No phone"}
               </span>
            </div>
          </div>
          <Badge variant={isPending ? "destructive" : "outline"}>
            {(order.status || 'pending').toUpperCase().replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/30 border rounded-lg overflow-hidden mb-3">
          <div className="px-3 py-2 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Items
          </div>
          <div className="divide-y">
            {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 rounded-md bg-white border flex-shrink-0 overflow-hidden shadow-sm">
                   {item.imageUrl ? (
                     <img src={item.imageUrl} alt={item.name} className="h-full w-full object-contain" />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                       <ShoppingBag className="h-6 w-6 opacity-20" />
                     </div>
                   )}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-medium text-sm truncate">{item.name || item.productId}</p>
                   <p className="text-xs text-muted-foreground">₹{item.price} per unit</p>
                </div>
                <div className="text-right flex-shrink-0">
                   <p className="text-sm font-bold">x{item.quantity}</p>
                   <p className="text-xs font-semibold text-primary">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-muted/20 border-t flex justify-between items-center font-bold text-lg">
            <span className="text-sm text-muted-foreground">Order Total</span>
            <span className="text-primary">₹{order.total}</span>
          </div>
        </div>
        <div className="text-sm space-y-1 bg-blue-50/50 p-3 rounded-md border border-blue-100/50">
          <p className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-blue-500 mt-0.5" />
            <span><strong>Delivery Address:</strong> {order.deliveryAddress}</span>
          </p>
        </div>
      </CardContent>
      {!isHistory && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          {isPending ? (
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
              Start Preparing
            </Button>
          ) : (
            <>
              {(order.status === "accepted") && (
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
                  Start Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => onStatusChange(order.id, "ready_for_pickup")}>
                  Ready for Pickup
                </Button>
              )}
              {order.status === "ready_for_pickup" && (
                <span className="text-sm text-muted-foreground italic">Waiting for delivery partner...</span>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};
// --- COMPONENT: QR WALK-IN ORDERS MANAGER (OFFLINE CUSTOMERS) ---
const QrOrdersManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch QR orders (poll every 8 seconds)
  const { data: qrOrders, isLoading } = useQuery<QrOrder[]>({
    queryKey: ["providerQrOrders", providerProfile.id],
    queryFn: async () => {
      const res = await api.get("/provider/qr-orders");
      return res.data;
    },
    refetchInterval: 8000,
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/qr-orders/${orderId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerQrOrders"] });
      toast({ title: "Order status updated!" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const allOrders = qrOrders || [];
  const pendingOrders = allOrders.filter(o => o.status === "pending");
  const activeOrders = allOrders.filter(o => ["preparing", "ready"].includes(o.status || ""));
  const historyOrders = allOrders.filter(o => ["completed", "cancelled"].includes(o.status || ""));

  // Today's orders only
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = allOrders.filter(o => new Date(o.createdAt || "") >= today);
  const todayPending = todayOrders.filter(o => o.status === "pending");
  const todayActive = todayOrders.filter(o => ["preparing", "ready"].includes(o.status || ""));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getNextAction = (status: string) => {
    switch (status) {
      case "pending": return { label: "Start Preparing", nextStatus: "preparing", color: "bg-blue-600 hover:bg-blue-700" };
      case "preparing": return { label: "Mark Ready", nextStatus: "ready", color: "bg-orange-500 hover:bg-orange-600" };
      case "ready": return { label: "Complete", nextStatus: "completed", color: "bg-green-600 hover:bg-green-700" };
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-amber-800">{todayPending.length}</p>
            <p className="text-xs text-amber-600 font-medium">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-blue-800">{todayActive.length}</p>
            <p className="text-xs text-blue-600 font-medium">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-green-800">{todayOrders.length}</p>
            <p className="text-xs text-green-600 font-medium">Today Total</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingOrders.length})
          </TabsTrigger>
          <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-3">
          {pendingOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 opacity-20 mx-auto mb-3" />
              <p className="font-medium">No pending walk-in orders</p>
              <p className="text-sm">New QR scan orders will appear here</p>
            </div>
          ) : (
            pendingOrders.map(order => (
              <QrOrderCard
                key={order.id}
                order={order}
                action={getNextAction(order.status || "pending")}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ orderId: id, status })}
                isPending={updateStatusMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4 space-y-3">
          {activeOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">No active orders</p>
            </div>
          ) : (
            activeOrders.map(order => (
              <QrOrderCard
                key={order.id}
                order={order}
                action={getNextAction(order.status || "")}
                onStatusChange={(id, status) => updateStatusMutation.mutate({ orderId: id, status })}
                isPending={updateStatusMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-3">
          {historyOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="font-medium">No order history yet</p>
            </div>
          ) : (
            historyOrders.slice(0, 50).map(order => (
              <QrOrderCard key={order.id} order={order} isHistory />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- QR ORDER CARD ---
const QrOrderCard: React.FC<{
  order: QrOrder;
  action?: { label: string; nextStatus: string; color: string } | null;
  onStatusChange?: (id: string, status: string) => void;
  isPending?: boolean;
  isHistory?: boolean;
}> = ({ order, action, onStatusChange, isPending, isHistory }) => {
  const tokenStr = String(order.tokenNumber).padStart(3, '0');
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    preparing: "bg-blue-100 text-blue-800",
    ready: "bg-green-100 text-green-800 animate-pulse",
    completed: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <Card className={`shadow-md ${order.status === 'pending' ? 'border-l-4 border-amber-500' : order.status === 'ready' ? 'border-l-4 border-green-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-800 font-black text-lg px-3 py-1 rounded-lg">
              #{tokenStr}
            </div>
            <div>
              <CardTitle className="text-base">
                {order.customerName || "Walk-in Customer"}
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date(order.createdAt || new Date()).toLocaleTimeString()}
                {order.tableNumber && ` • Table ${order.tableNumber}`}
                {order.customerPhone && ` • ${order.customerPhone}`}
              </CardDescription>
            </div>
          </div>
          <Badge className={statusColors[order.status || "pending"] || statusColors.pending}>
            {(order.status || "pending").toUpperCase().replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/50 p-3 rounded-md mb-2">
          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span>{item.quantity} x {item.name}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
        {order.notes && (
          <p className="text-xs text-muted-foreground italic bg-yellow-50 p-2 rounded">
            📝 {order.notes}
          </p>
        )}
      </CardContent>
      {!isHistory && action && onStatusChange && (
        <CardFooter className="flex justify-between items-center pt-2">
          {order.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onStatusChange(order.id, "cancelled")}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            className={`${action.color} text-white`}
            size="sm"
            onClick={() => onStatusChange(order.id, action.nextStatus)}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {action.label}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// --- COMPONENT 5: RESTAURANT ORDERS MANAGER (NEW) ---
const RestaurantOrdersManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Live Orders (Polling every 10 seconds)
  const { data: orders, isLoading } = useQuery<RestaurantOrder[]>({
    queryKey: ["providerRestaurantOrders", providerProfile.id],
    queryFn: async () => {
      const res = await api.get("/provider/restaurant-orders");
      return res.data;
    },
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/restaurant-orders/${orderId}/status`, { status }),
    onSuccess: (data) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${data.data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["providerRestaurantOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading live orders...
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No Active Orders</h3>
        <p className="text-muted-foreground mt-2">
          New orders will appear here automatically.
        </p>
      </div>
    );
  }

  // Filter orders by status
  // Note: "paid" status means payment completed — provider sees "Start Preparing" directly
  const pendingOrders = orders.filter((o) => ["pending", "paid"].includes(o.status || ""));
  const activeOrders = orders.filter((o) => ["accepted", "preparing", "ready_for_pickup"].includes(o.status || ""));
  const pastOrders = orders.filter((o) => ["picked_up", "delivered", "cancelled", "out_for_delivery"].includes(o.status || ""));

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6 space-y-4">
        {pendingOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No pending orders.</p>
        ) : (
          pendingOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isPending={true}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="active" className="mt-6 space-y-4">
        {activeOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active orders.</p>
        ) : (
          activeOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6 space-y-4">
        {pastOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No order history.</p>
        ) : (
          pastOrders.map((order) => (
            <RestaurantOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isHistory={true}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

const RestaurantOrderCard: React.FC<{
  order: RestaurantOrder & { user?: any; rider?: any };
  onStatusChange: (id: string, status: string) => void;
  isPending?: boolean;
  isHistory?: boolean;
}> = ({ order, onStatusChange, isPending, isHistory }) => {
  return (
    <Card className={`shadow-md ${isPending ? "border-l-4 border-orange-500 animate-in fade-in slide-in-from-bottom-2" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription>
              {new Date(order.createdAt || new Date()).toLocaleTimeString()} - {order.user?.username || "Guest"}
            </CardDescription>
          </div>
          <Badge variant={isPending ? "destructive" : "outline"}>
            {order.status?.toUpperCase().replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/50 p-3 rounded-md mb-3">
          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span>{item.quantity} x {item.name}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p><strong>Address:</strong> {order.deliveryAddress}</p>
          {order.rider && (
            <p className="text-blue-600"><strong>Rider:</strong> {order.rider.username} ({order.rider.phone})</p>
          )}
        </div>
      </CardContent>
      {!isHistory && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          {isPending ? (
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
              Start Preparing
            </Button>
          ) : (
            <>
              {(order.status === "accepted") && (
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
                  Start Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => onStatusChange(order.id, "ready_for_pickup")}>
                  Ready for Pickup
                </Button>
              )}
              {order.status === "ready_for_pickup" && (
                <span className="text-sm text-muted-foreground italic">Waiting for rider...</span>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

// --- COMPONENT 6: RENTAL MANAGER (NEW) ---
const RentalManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
}> = ({ providerProfile }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery<RentalProperty[]>({
    queryKey: ["providerProperties", providerProfile.userId],
    queryFn: async () => {
      const res = await api.get("/provider/rental-properties");
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/rental-properties/${id}`),
    onSuccess: () => {
      toast({ title: "Property Deleted", description: "Listing removed successfully." });
      queryClient.invalidateQueries({ queryKey: ["providerProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/rental-properties/${id}`, { status }),
    onSuccess: () => {
      toast({ title: "Status Updated", description: "Property status changed." });
      queryClient.invalidateQueries({ queryKey: ["providerProperties"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  if (isLoading) return <div><Loader2 className="animate-spin" /> Loading properties...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>My Rental Listings</CardTitle>
          <CardDescription>Manage your property listings.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/list-property">
            <PlusCircle className="mr-2 h-4 w-4" /> List New Property
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!properties || properties.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">No Properties Listed</h3>
            <p className="text-muted-foreground mt-2">List your first property to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(property => (
              <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {property.images && property.images[0] ? (
                    <img src={property.images[0]} alt={property.title} className="w-16 h-16 object-cover rounded" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center"><Home className="h-6 w-6 opacity-20" /></div>
                  )}
                  <div>
                    <h4 className="font-semibold">{property.title}</h4>
                    <div className="text-sm text-muted-foreground">
                      ₹{property.rent}/mo • {property.locality}
                    </div>
                    <Badge variant={property.status === 'available' ? 'default' : 'secondary'} className="mt-1">
                      {property.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/properties/${property.id}`}>View</Link>
                  </Button>
                  {property.status === 'available' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'rented' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Mark Rented
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({ id: property.id, status: 'available' })}
                      disabled={toggleStatusMutation.isPending}
                    >
                      Mark Available
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      if (confirm('Delete this listing?')) deleteMutation.mutate(property.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- COMPONENT 4: PROFILE SETTINGS (PREMIUM REDESIGN) ---
const ProfileSettingsManager: React.FC<{
  providerProfile: ProviderProfileWithCategory;
  userId: string;
}> = ({ providerProfile, userId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  // Profile Pic Upload Mutation
  const profilePicMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return api.patch("/provider/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (response) => {
      const updated = response.data.profile;
      queryClient.setQueryData(["providerProfile", userId], (old: any) => {
        if (!old) return old;
        return { ...old, profileImageUrl: updated.profileImageUrl };
      });
      toast({ title: "Success", description: "Profile banner/logo updated." });
      setProfileFile(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  // Gallery Images Upload Mutation
  const galleryUploadMutation = useMutation({
    mutationFn: (files: FileList) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      return api.post("/provider/profile/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: (response) => {
      const updated = response.data.profile;
      queryClient.setQueryData(["providerProfile", userId], (old: any) => {
        if (!old) return old;
        return { ...old, galleryImages: updated.galleryImages };
      });
      toast({ title: "Success", description: "Gallery images have been added." });
      setGalleryFiles(null);
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.response?.data?.message || "Failed to upload.",
        variant: "destructive",
      });
    },
  });

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileFile(e.target.files[0]);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setGalleryFiles(e.target.files);
    }
  };

  // Delete Profile Pic Mutation
  const deleteProfilePicMutation = useMutation({
    mutationFn: () => api.post("/provider/profile/image/delete"),
    onSuccess: (response) => {
      const updated = response.data.profile;
      queryClient.setQueryData(["providerProfile", userId], (old: any) => {
        if (!old) return old;
        return { ...old, profileImageUrl: updated.profileImageUrl };
      });
      toast({ title: "Removed", description: "Profile banner has been removed." });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to remove image.",
        variant: "destructive",
      });
    },
  });

  // Delete Gallery Image Mutation
  const deleteGalleryImageMutation = useMutation({
    mutationFn: ({ imageUrl, index }: { imageUrl: string, index?: number }) => 
      api.post("/provider/profile/gallery/delete", { imageUrl, index }),
    onSuccess: (response) => {
      const updated = response.data.profile;
      queryClient.setQueryData(["providerProfile", userId], (old: any) => {
        if (!old) return old;
        return { ...old, galleryImages: updated.galleryImages };
      });
      toast({ title: "Removed", description: "Gallery image removed." });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.message || "Failed to remove image.",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpload = () => {
    if (profileFile) profilePicMutation.mutate(profileFile);
  };

  const handleGalleryUpload = () => {
    if (galleryFiles) galleryUploadMutation.mutate(galleryFiles);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Picture / Banner Upload */}
      <Card className="border-none shadow-md overflow-hidden bg-card">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b pb-6">
          <CardTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Main Display Image (Banner/Logo)
          </CardTitle>
          <CardDescription>
            This image acts as the primary visual associated with your restaurant or service everywhere in the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Image Preview */}
            <div className="w-full md:w-1/2">
              <div className="relative group rounded-xl overflow-hidden aspect-[16/9] md:aspect-square md:max-w-xs shadow-inner bg-muted transition-all duration-300">
                {profileFile ? (
                  <img src={URL.createObjectURL(profileFile)} alt="Preview" className="w-full h-full object-cover" />
                ) : providerProfile.profileImageUrl ? (
                  <img src={providerProfile.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                    <span className="text-sm font-medium">No Image Set</span>
                  </div>
                )}
                
                {/* Hover overlay instruction */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="text-white font-medium drop-shadow-md">Select a new image below</span>
                </div>
              </div>
            </div>

            {/* Upload Controls */}
            <div className="w-full md:w-1/2 flex flex-col space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-upload" className="text-sm font-semibold text-foreground">
                  Select a High-Resolution Photo
                </Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileFileChange}
                      disabled={profilePicMutation.isPending}
                      className="cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold hover:file:bg-primary/20 transition-all font-medium h-12 pt-3"
                    />
                  </div>
                </div>
                {profileFile && (
                  <p className="text-xs text-green-600 font-medium">✨ Ready to upload: {profileFile.name}</p>
                )}
              </div>

              <Button
                onClick={handleProfileUpload}
                disabled={!profileFile || profilePicMutation.isPending}
                className="w-full sm:w-auto self-start mt-2 shadow-sm"
                size="lg"
              >
                {profilePicMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-5 w-5" />
                )}
                {profilePicMutation.isPending ? "Uploading Banner..." : "Save Banner Image"}
              </Button>

              {providerProfile.profileImageUrl && !profileFile && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 mt-2"
                  onClick={() => {
                    if (confirm("Remove this banner image?")) deleteProfilePicMutation.mutate();
                  }}
                  disabled={deleteProfilePicMutation.isPending}
                >
                  {deleteProfilePicMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove Current Banner
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Upload */}
      <Card className="border-none shadow-md overflow-hidden bg-card">
        <CardHeader className="border-b pb-6">
          <CardTitle className="text-xl flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            Photo Gallery
          </CardTitle>
          <CardDescription>
            Upload supplementary photos here (like shop interior, previous work, or specific generic items). 
            <br/><span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">Note: Your display banner above is always prioritized over these gallery photos.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          {/* Upload Input */}
          <div className="p-6 mb-6 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 transition-colors hover:bg-primary/10 duration-200">
            <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
               <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="gallery-upload" className="text-sm font-semibold flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Add Multiple Photos (Max 5)
                  </Label>
                  <Input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFileChange}
                    disabled={galleryUploadMutation.isPending}
                    className="cursor-pointer file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-1 file:font-semibold hover:file:bg-primary/90 transition-all h-12 pt-3"
                  />
                  {galleryFiles && (
                    <p className="text-xs text-green-600 font-medium">{galleryFiles.length} file(s) selected for upload</p>
                  )}
               </div>
               <Button
                  onClick={handleGalleryUpload}
                  disabled={!galleryFiles || galleryUploadMutation.isPending}
                  size="lg"
                  className="w-full md:w-auto shadow-md"
                >
                  {galleryUploadMutation.isPending ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-5 w-5" />
                  )}
                  Upload to Gallery
                </Button>
            </div>
          </div>

          {/* Gallery Grid */}
          <div>
            <h3 className="text-sm font-bold mb-4 text-foreground/80 flex items-center justify-between">
              <span>Current Gallery ({providerProfile.galleryImages?.length || 0})</span>
              {providerProfile.galleryImages && providerProfile.galleryImages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                  onClick={() => {
                    if (confirm("Clear your entire photo gallery?")) deleteGalleryImageMutation.mutate({ imageUrl: "" });
                  }}
                  disabled={deleteGalleryImageMutation.isPending}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  CLEAR ALL PHOTOS
                </Button>
              )}
            </h3>
            {providerProfile.galleryImages && providerProfile.galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 auto-rows-fr">
                {providerProfile.galleryImages.map((url, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square bg-muted rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all"
                  >
                    <img
                      src={url}
                      alt={`Gallery item ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      Photo {index + 1}
                    </div>
                    
                    <button
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                      onClick={() => {
                        if (confirm("Delete this gallery image?")) {
                          deleteGalleryImageMutation.mutate({ imageUrl: url, index });
                        }
                      }}
                      disabled={deleteGalleryImageMutation.isPending}
                    >
                      {deleteGalleryImageMutation.isPending ? (
                         <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl bg-muted/30">
                <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
                <p>Your gallery is currently empty.</p>
                <p className="text-sm opacity-70">Upload photos above to showcase your business.</p>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

// --- COMPONENT 6: STREET FOOD ORDERS MANAGER (ADMIN PIPELINE) ---
const StreetFoodOrdersManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch Live Orders (Polling every 10 seconds)
  const { data: orders, isLoading } = useQuery<StreetFoodOrder[]>({
    queryKey: ["adminStreetFoodOrders"],
    queryFn: async () => {
      const res = await api.get("/provider/street-food-orders");
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      api.patch(`/provider/street-food-orders/${orderId}/status`, { status }),
    onSuccess: (data) => {
      toast({
        title: "Order Updated",
        description: `Order status changed to ${data.data.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["adminStreetFoodOrders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update order.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading live orders...
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <h3 className="text-xl font-semibold">No Active Orders</h3>
        <p className="text-muted-foreground mt-2">
          New street food orders will appear here automatically.
        </p>
      </div>
    );
  }

  // Same status flow mostly
  const pendingOrders = orders.filter((o) => ["pending", "paid"].includes(o.status || ""));
  const activeOrders = orders.filter((o) => ["accepted", "preparing", "ready_for_pickup"].includes(o.status || ""));
  const pastOrders = orders.filter((o) => ["picked_up", "delivered", "cancelled", "out_for_delivery"].includes(o.status || ""));

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="pending" className="relative">
          Pending
          {pendingOrders.length > 0 && (
            <Badge variant="destructive" className="ml-2 absolute -top-2 -right-2 px-1.5 py-0.5 text-xs rounded-full">
              {pendingOrders.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="active">Active ({activeOrders.length})</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="mt-6 space-y-4">
        {pendingOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No pending orders.</p>
        ) : (
          pendingOrders.map((order) => (
            <StreetFoodOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isPending={true}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="active" className="mt-6 space-y-4">
        {activeOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active orders.</p>
        ) : (
          activeOrders.map((order) => (
            <StreetFoodOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="history" className="mt-6 space-y-4">
        {pastOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No order history.</p>
        ) : (
          pastOrders.map((order) => (
            <StreetFoodOrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              isHistory={true}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  );
};

const StreetFoodOrderCard: React.FC<{
  order: StreetFoodOrder & { user?: any; provider?: any; rider?: any };
  onStatusChange: (id: string, status: string) => void;
  isPending?: boolean;
  isHistory?: boolean;
}> = ({ order, onStatusChange, isPending, isHistory }) => {
  return (
    <Card className={`shadow-md ${isPending ? "border-l-4 border-orange-500 animate-in fade-in slide-in-from-bottom-2" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{new Date(order.createdAt || new Date()).toLocaleTimeString()}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{order.user?.username || "Guest"}</span>
              <span>•</span>
               <Badge variant="secondary">{order.provider?.businessName || "Vendor"}</Badge>
            </CardDescription>
          </div>
          <Badge variant={isPending ? "destructive" : "outline"}>
            {order.status?.toUpperCase().replace(/_/g, " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="bg-muted/50 p-3 rounded-md mb-3">
          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-sm mb-1">
              <span>{item.quantity} x {item.name}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between font-bold">
            <span>Total</span>
            <span>₹{order.totalAmount}</span>
          </div>
        </div>
        <div className="text-sm space-y-1">
          <p><strong>Address:</strong> {order.deliveryAddress}</p>
          {order.rider && (
            <p className="text-blue-600"><strong>Rider:</strong> {order.rider.username} ({order.rider.phone})</p>
          )}
        </div>
      </CardContent>
      {!isHistory && (
        <CardFooter className="flex justify-end gap-2 pt-2">
          {isPending ? (
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
              Mark as Preparing
            </Button>
          ) : (
            <>
              {(order.status === "accepted") && (
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm" onClick={() => onStatusChange(order.id, "preparing")}>
                  Mark as Preparing
                </Button>
              )}
              {order.status === "preparing" && (
                <Button className="bg-orange-500 hover:bg-orange-600" size="sm" onClick={() => onStatusChange(order.id, "ready_for_pickup")}>
                  Ready for Pickup
                </Button>
              )}
              {order.status === "ready_for_pickup" && (
                <span className="text-sm text-muted-foreground italic">Waiting for rider...</span>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

// --- Category Lists ---
const menuBasedCategories = [
  "beauty",
  "cake-shop",
  "street-food",
  "grocery",
];
const bookingBasedCategories = ["electrician", "plumber"];
const restaurantCategory = "restaurants";

// --- MAIN DASHBOARD COMPONENT (Ab yeh smart hai) ---
const ProviderDashboard: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: providerProfile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
  } = useQuery<ProviderProfileWithCategory>({
    queryKey: ["providerProfile", user?.id],
    queryFn: async () => {
      const res = await api.get("/provider/profile");
      return res.data;
    },
    enabled: !!user?.id && user.role === 'provider',
    retry: false,
  });

  // --- FCM TOKEN SYNC FROM ANDROID APP ---
  useEffect(() => {
    const syncFcmToken = async () => {
      // Check if running inside Android native app
      if (typeof window !== 'undefined' && (window as any).AndroidApp) {
        try {
          const token = (window as any).AndroidApp.getFcmToken();

          if (token && token.length > 0) {
            console.log('[FCM] Token from Android:', token.substring(0, 20) + '...');

            // Send token to server
            const response = await api.post('/users/fcm-token', { token });
            console.log('[FCM] Token synced to server successfully:', response.data);

            // Show native toast confirmation (optional)
            if ((window as any).AndroidApp.showToast) {
              (window as any).AndroidApp.showToast('Notifications enabled!');
            }
          } else {
            console.log('[FCM] No token available from Android app');
          }
        } catch (error) {
          console.error('[FCM] Error syncing token:', error);
        }
      } else {
        console.log('[FCM] Not running in Android app (WebView detection failed)');
      }
    };

    // Only sync when user is logged in
    if (user?.id) {
      syncFcmToken();
    }
  }, [user?.id]);
  // --- FCM TOKEN SYNC END ---

  // --- SHOP AVAILABILITY TOGGLE MUTATION (Moved here to fix React hooks order) ---
  const availabilityMutation = useMutation({
    mutationFn: (isAvailable: boolean) =>
      api.patch("/provider/availability", { isAvailable }),
    onSuccess: (data) => {
      toast({
        title: data.data.isAvailable ? "🟢 Shop is OPEN" : "🔴 Shop is CLOSED",
        description: data.data.message,
        duration: 4000,
      });
      queryClient.invalidateQueries({ queryKey: ["providerProfile", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });
  // --- SHOP AVAILABILITY TOGGLE END ---

  // --- LOADING/ERROR STATES ---
  if (isAuthLoading || (!!user && isLoadingProfile)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading your
        profile...
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // **STREET FOOD ADMIN OVERRIDE**: Render ONLY the street food orders manager
  if (user.username === "streetfood_admin") {
    return (
      <div className="container mx-auto pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2">Street Food Dashboard</h1>
        <p className="text-muted-foreground mb-6">Manage all vendor incoming orders from customers here. You will receive push notifications when orders are paid.</p>
        <StreetFoodOrdersManager />
      </div>
    );
  }

  if (user.role !== "provider") {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">Access Denied</h2>
        <p className="mt-2">You must be a provider to view this page.</p>
        <Button asChild className="mt-4">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  if (isErrorProfile || !providerProfile) {
    return (
      <div className="container mx-auto py-10 text-center text-muted-foreground">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-semibold text-foreground mt-4">
          Provider Profile Not Found
        </h2>
        <p className="mt-2">
          It seems you haven't completed your provider onboarding yet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/provider-onboarding">Complete Your Profile</Link>
        </Button>
      </div>
    );
  }
  // --- LOADING/ERROR STATES KHATAM ---

  const providerType = () => {
    if (!providerProfile || !providerProfile.category) {
      return 'unknown';
    }
    const slug = providerProfile.category.slug;
    if (menuBasedCategories.includes(slug)) return "menu";
    if (bookingBasedCategories.includes(slug)) return "booking";
    if (slug === restaurantCategory) return "restaurant";
    if (slug === "rental") return "rental"; // NAYA
    return "unknown";
  };

  const type = providerType();

  const getTabs = () => {
    // Basic tabs
    const tabs = [
      { value: "profile", label: "Profile Settings" },
    ];

    // Kaam ke hisaab se tabs add karo
    if (type === "menu") {
      tabs.unshift({ value: "menu", label: "Menu / Services" });
      tabs.unshift({ value: "bookings", label: "Bookings" }); // Menu waalon ko bhi booking aa sakti hai

      // Cake Shop providers get orders tab
      const slug = providerProfile.category?.slug;
      if (slug === "cake-shop") {
        tabs.unshift({ value: "grocery-orders", label: "Live Orders" });
      }
    }
    // Beauty Parlor Logic
    if (type === "menu" && providerProfile.category.slug === "beauty") {
      // Replace "menu" with "services" for beauty
      const menuIndex = tabs.findIndex(t => t.value === "menu");
      if (menuIndex !== -1) {
        tabs[menuIndex] = { value: "beauty-services", label: "My Services" };
      }
    }

    if (type === "booking") {
      tabs.push({ value: "specializations", label: "My Specializations" });
      tabs.unshift({ value: "bookings", label: "Bookings" });
    }

    if (type === "restaurant") {
      tabs.unshift({ value: "menu", label: "Menu Management" });
      tabs.unshift({ value: "offline-customers", label: "Offline Customers" });
      tabs.unshift({ value: "live-orders", label: "Live Orders" });
    }

    if (type === "rental") {
      tabs.unshift({ value: "rental-listings", label: "My Properties" });
    }

    // Add Offers tab for all providers except rental
    if (type !== "rental" && type !== "booking") {
      tabs.push({ value: "offers", label: "Offers" });
    }

    return tabs;
  };

  const tabs = getTabs();
  const defaultTab = type === "restaurant" ? "live-orders" : (type === "rental" ? "rental-listings" : "bookings"); // Sabse important tab

  // Handler for availability toggle (uses mutation defined above)
  const handleToggleAvailability = () => {
    const newStatus = !providerProfile.isAvailable;
    availabilityMutation.mutate(newStatus);
  };

  return (
    <div className="container mx-auto pt-20 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Permission Banner for Android App */}
      <PermissionBanner />

      {/* Shop Availability Toggle Banner */}
      <div
        className={`mb-6 p-4 rounded-xl border-2 transition-all duration-300 ${providerProfile.isAvailable
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700'
          : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-300 dark:from-red-900/20 dark:to-orange-900/20 dark:border-red-700'
          }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full animate-pulse ${providerProfile.isAvailable ? 'bg-green-500' : 'bg-red-500'
                }`}
            />
            <div>
              <h2 className={`text-lg font-bold ${providerProfile.isAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                }`}>
                {providerProfile.isAvailable ? '🟢 Your Shop is OPEN' : '🔴 Your Shop is CLOSED'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {providerProfile.isAvailable
                  ? 'Customers can place orders now'
                  : 'Customers cannot place orders. Toggle to open when ready.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {providerProfile.isAvailable ? 'Accepting Orders' : 'Not Accepting'}
            </span>
            <Switch
              id="shop-availability"
              checked={providerProfile.isAvailable ?? true}
              onCheckedChange={handleToggleAvailability}
              disabled={availabilityMutation.isPending}
              className={`${providerProfile.isAvailable ? 'data-[state=checked]:bg-green-600' : 'data-[state=unchecked]:bg-red-500'}`}
            />
            {availabilityMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-6">
        Welcome, {providerProfile.businessName}!
      </h1>

      <Tabs defaultValue={defaultTab} className="w-full">
        {/* Scrollable tabs container for mobile */}
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-max md:w-full md:grid gap-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="whitespace-nowrap px-4 py-2 text-xs sm:text-sm flex-shrink-0">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="bookings" className="mt-6">
          <BookingsManager providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="menu" className="mt-6">
          {type === "menu" || type === "restaurant" ? (
            <MenuItemsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="live-orders" className="mt-6">
          {type === "restaurant" ? (
            <RestaurantOrdersManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="offline-customers" className="mt-6">
          {type === "restaurant" ? (
            <QrOrdersManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="grocery-orders" className="mt-6">
          <GroceryOrdersManager providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="beauty-services" className="mt-6">
          <BeautyServiceSelector providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="rental-listings" className="mt-6">
          <RentalManager providerProfile={providerProfile} />
        </TabsContent>

        <TabsContent value="offers" className="mt-6">
          <OffersManager providerId={providerProfile.id} categorySlug={providerProfile.category?.slug || ''} />
        </TabsContent>



        <TabsContent value="specializations" className="mt-6">
          {type === "booking" ? (
            <SpecializationsManager providerProfile={providerProfile} />
          ) : null}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettingsManager
            providerProfile={providerProfile}
            userId={user!.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderDashboard;