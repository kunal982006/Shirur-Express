// client/src/pages/provider-dashboard.tsx

import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { ServiceProvider } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import MenuItemForm from "@/components/forms/MenuItemForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const providerProfile = useQuery<ServiceProvider>({
    queryKey: ['providerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await api.get(`/api/providers/${user.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const providerCategorySlug = providerProfile.data?.category?.slug;

  const { data: menuItems, isLoading: isLoadingMenuItems, isError: isErrorMenuItems, refetch: refetchMenuItems } = useQuery<any[]>({
    queryKey: ['providerMenuItems', providerCategorySlug],
    queryFn: async () => {
      if (!providerCategorySlug) return [];
      const res = await api.get(`/api/provider/menu?category=${providerCategorySlug}`);
      return res.data;
    },
    enabled: !!providerCategorySlug,
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!providerCategorySlug) throw new Error("Provider category not found.");
      await api.delete(`/api/menu-items/${itemId}`, { data: { categorySlug: providerCategorySlug } });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Menu item deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ['providerMenuItems', providerCategorySlug] }); // Invalidate specific query
    },
    onError: (error: any) => {
      console.error("Error deleting menu item:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete menu item.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = (itemId: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteMenuItemMutation.mutate(itemId);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingItem(null);
    refetchMenuItems(); // Menu items ko refetch karo changes ke baad
  };

  if (providerProfile.isLoading) return <div className="flex justify-center items-center h-screen"><Loader2 className="mr-2 h-8 w-8 animate-spin" /> Loading provider profile...</div>;
  if (providerProfile.isError) return <div className="text-red-500 text-center mt-10">Error loading provider profile.</div>;
  if (!providerProfile.data) return <div className="text-center mt-10 text-muted-foreground">No provider profile found. Please complete your <a href="/provider-onboarding" className="text-blue-500 underline">onboarding</a>.</div>;

  if (!providerCategorySlug) return <div className="text-center mt-10 text-muted-foreground">Provider category not determined.</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Provider Dashboard</h1>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Menu Items ({providerCategorySlug.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})</h2> {/* Category slug ko user-friendly banaya */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            </DialogHeader>
            <MenuItemForm
              providerId={user.id}
              categorySlug={providerCategorySlug}
              initialData={editingItem}
              onSuccess={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingMenuItems && <div className="flex justify-center items-center"><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Loading menu items...</div>}
      {isErrorMenuItems && <div className="text-red-500 text-center mt-4">Error loading menu items.</div>}

      {menuItems?.length === 0 && !isLoadingMenuItems && <p className="col-span-full text-center text-muted-foreground mt-4">No menu items found for this category.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.map((item) => (
          <div key={item.id} className="border p-4 rounded-lg shadow-sm">
            {item.imageUrl && (
              <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover rounded-md mb-3" />
            )}
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            <p className="text-sm font-medium">Price: ₹{item.price}</p>
            {item.category && <p className="text-xs">Category: {item.category.replace(/_/g, ' ')}</p>} {/* Category slug ko user-friendly banaya */}
            {item.subCategory && <p className="text-xs">Sub-Category: {item.subCategory.replace(/_/g, ' ')}</p>} {/* Sub-Category slug ko user-friendly banaya */}
            {item.duration_minutes && <p className="text-xs">Duration: {item.duration_minutes} mins</p>}
            {item.isVeg !== undefined && <p className="text-xs">{item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}</p>}
            {item.spicyLevel && <p className="text-xs">Spicy Level: {item.spicyLevel}</p>}
            {item.cuisine && <p className="text-xs">Cuisine: {item.cuisine}</p>}

            <div className="flex space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)} disabled={deleteMenuItemMutation.isPending}>
                {deleteMenuItemMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderDashboard;