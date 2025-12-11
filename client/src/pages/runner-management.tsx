import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Edit, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

// Types
interface Vendor {
    id: string;
    businessName: string;
    description: string;
    address: string;
    imageUrl?: string;
    isAvailable: boolean;
}

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    isVeg: boolean;
    isAvailable: boolean;
    providerId: string;
}

export default function RunnerManagement() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // --- VENDORS ---
    const { data: vendors, isLoading: loadingVendors } = useQuery<Vendor[]>({
        queryKey: ["streetFoodVendors"],
        queryFn: async () => (await api.get("/street-food-vendors")).data,
    });

    const createVendorMutation = useMutation({
        mutationFn: (newVendor: any) => api.post("/admin/street-food-vendors", newVendor),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["streetFoodVendors"] });
            toast({ title: "Success", description: "Vendor created successfully" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const deleteVendorMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/street-food-vendors/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["streetFoodVendors"] });
            toast({ title: "Success", description: "Vendor deleted" });
            if (selectedVendorId) setSelectedVendorId(null);
        },
    });

    // --- MENU ITEMS ---
    const { data: menuItems, isLoading: loadingMenu } = useQuery<MenuItem[]>({
        queryKey: ["streetFoodItems", selectedVendorId],
        queryFn: async () => {
            if (!selectedVendorId) return [];
            return (await api.get(`/street-food/${selectedVendorId}`)).data.items;
        },
        enabled: !!selectedVendorId,
    });

    const createItemMutation = useMutation({
        mutationFn: (newItem: any) => api.post("/admin/street-food-items", newItem),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["streetFoodItems", selectedVendorId] });
            toast({ title: "Success", description: "Menu item added" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const deleteItemMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/street-food-items/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["streetFoodItems", selectedVendorId] });
            toast({ title: "Success", description: "Menu item deleted" });
        },
    });

    const updateItemMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: any }) => api.patch(`/admin/street-food-items/${id}`, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["streetFoodItems", selectedVendorId] });
            toast({ title: "Success", description: "Menu item updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Runner Management</h1>
                        <p className="text-gray-500">Manage Street Food Vendors & Menus</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* LEFT: Vendors List */}
                    <Card className="md:col-span-1 h-fit">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">Vendors</CardTitle>
                            <AddVendorDialog onSubmit={(data) => createVendorMutation.mutate(data)} />
                        </CardHeader>
                        <CardContent>
                            {loadingVendors ? (
                                <Loader2 className="animate-spin mx-auto" />
                            ) : (
                                <div className="space-y-2">
                                    {vendors?.map((vendor) => (
                                        <div
                                            key={vendor.id}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedVendorId === vendor.id ? "bg-primary/10 border-primary" : "hover:bg-gray-100"
                                                }`}
                                            onClick={() => setSelectedVendorId(vendor.id)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold">{vendor.businessName}</h3>
                                                    <p className="text-xs text-muted-foreground truncate w-40">{vendor.address}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("Delete this vendor?")) deleteVendorMutation.mutate(vendor.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {vendors?.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No vendors found.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* RIGHT: Menu Items */}
                    <Card className="md:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-xl font-bold">Menu Items</CardTitle>
                                <CardDescription>
                                    {selectedVendorId
                                        ? `Managing menu for: ${vendors?.find((v) => v.id === selectedVendorId)?.businessName}`
                                        : "Select a vendor to manage items"}
                                </CardDescription>
                            </div>
                            {selectedVendorId && (
                                <AddItemDialog
                                    providerId={selectedVendorId}
                                    onSubmit={(data) => createItemMutation.mutate({ ...data, providerId: selectedVendorId })}
                                />
                            )}
                        </CardHeader>
                        <CardContent>
                            {!selectedVendorId ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Select a vendor from the left to view their menu.</p>
                                </div>
                            ) : loadingMenu ? (
                                <Loader2 className="animate-spin mx-auto" />
                            ) : (
                                <div className="space-y-4">
                                    {menuItems?.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold">{item.name}</h4>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.isVeg ? "border-green-500 text-green-600" : "border-red-500 text-red-600"}`}>
                                                        {item.isVeg ? "VEG" : "NON-VEG"}
                                                    </span>
                                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{item.category}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                                <p className="font-bold mt-1">₹{item.price}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <EditItemDialog
                                                    item={item}
                                                    onSubmit={(updates) => updateItemMutation.mutate({ id: item.id, updates })}
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        if (confirm("Delete this item?")) deleteItemMutation.mutate(item.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {menuItems?.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No items in this menu yet.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- DIALOGS ---

function AddVendorDialog({ onSubmit }: { onSubmit: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit({
            businessName: formData.get("businessName"),
            description: formData.get("description"),
            address: formData.get("address"),
            isAvailable: true,
            // Default values for required fields
            categoryId: "dummy-category-id", // Backend should handle or we fetch
            experience: 0,
            rating: "0",
            reviewCount: 0,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Vendor</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Vendor</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>Business Name</Label><Input name="businessName" required /></div>
                    <div><Label>Description</Label><Textarea name="description" required /></div>
                    <div><Label>Address</Label><Input name="address" required /></div>
                    <Button type="submit" className="w-full">Create Vendor</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddItemDialog({ providerId, onSubmit }: { providerId: string; onSubmit: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit({
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"), // String in schema?
            category: formData.get("category"),
            isVeg: formData.get("isVeg") === "on",
            isAvailable: true,
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>Item Name</Label><Input name="name" required /></div>
                    <div><Label>Description</Label><Input name="description" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Price (₹)</Label><Input name="price" type="number" required /></div>
                        <div><Label>Category</Label><Input name="category" placeholder="e.g. Chaat" required /></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="isVeg" name="isVeg" />
                        <Label htmlFor="isVeg">Is Vegetarian?</Label>
                    </div>
                    <Button type="submit" className="w-full">Add Item</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditItemDialog({ item, onSubmit }: { item: MenuItem; onSubmit: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit({
            name: formData.get("name"),
            description: formData.get("description"),
            price: formData.get("price"),
            category: formData.get("category"),
            isVeg: formData.get("isVeg") === "on",
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                    <Edit className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Menu Item</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><Label>Item Name</Label><Input name="name" defaultValue={item.name} required /></div>
                    <div><Label>Description</Label><Input name="description" defaultValue={item.description} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Price (₹)</Label><Input name="price" type="number" defaultValue={item.price} required /></div>
                        <div><Label>Category</Label><Input name="category" defaultValue={item.category} required /></div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="edit-isVeg" name="isVeg" defaultChecked={item.isVeg} />
                        <Label htmlFor="edit-isVeg">Is Vegetarian?</Label>
                    </div>
                    <Button type="submit" className="w-full">Update Item</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
