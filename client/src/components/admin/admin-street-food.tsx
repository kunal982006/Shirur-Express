import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Store, Utensils, ChevronRight, Image as ImageIcon, Loader2, ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type Vendor = {
    id: string;
    businessName: string;
    profileImageUrl?: string;
    galleryImages?: string[];
    createdAt: string;
};

type MenuItem = {
    id: string;
    name: string;
    category: string;
    price: string;
    description: string;
    isVeg: boolean;
    imageUrl: string;
};

export default function AdminStreetFood() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // New Vendor Form
    const [newVendorName, setNewVendorName] = useState("");
    const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);

    const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
        queryKey: ["/api/admin/street-food/vendors"],
        queryFn: () => api.get("/admin/street-food/vendors").then(r => r.data),
    });

    const createVendorM = useMutation({
        mutationFn: (name: string) => api.post("/admin/street-food/vendors", { name }).then(r => r.data),
        onSuccess: (newVendor) => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/street-food/vendors"] });
            toast({ title: "Vendor Created", description: `${newVendor.businessName} has been added.` });
            setIsVendorDialogOpen(false);
            setNewVendorName("");
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const handleCreateVendor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVendorName.trim()) return;
        createVendorM.mutate(newVendorName.trim());
    };

    if (vendorsLoading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
    }

    if (selectedVendorId) {
        const vendor = vendors?.find(v => v.id === selectedVendorId);
        return (
            <VendorMenuManager
                vendor={vendor}
                onBack={() => setSelectedVendorId(null)}
            />
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Store className="h-6 w-6 text-orange-500" />
                        Street Food Vendors
                    </h2>
                    <p className="text-gray-400">Manage all street food profiles and their menus.</p>
                </div>

                <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                            <Plus className="h-4 w-4" /> Add Vendor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create New Vendor Profile</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleCreateVendor} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendorName">Vendor Profile Name</Label>
                                <Input
                                    id="vendorName"
                                    value={newVendorName}
                                    onChange={e => setNewVendorName(e.target.value)}
                                    placeholder="e.g., Chat Junction, Momos Corner..."
                                    className="bg-white/5 border-white/10"
                                    autoFocus
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-orange-500 hover:bg-orange-600"
                                disabled={!newVendorName.trim() || createVendorM.isPending}
                            >
                                {createVendorM.isPending ? "Creating..." : "Create Vendor Instantly"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors?.length === 0 ? (
                    <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                        <Store className="h-10 w-10 text-gray-500 mx-auto mb-3 opacity-50" />
                        <p className="text-gray-400">No street food vendors created yet.</p>
                        <Button variant="link" onClick={() => setIsVendorDialogOpen(true)} className="text-orange-500">
                            Create the first one
                        </Button>
                    </div>
                ) : (
                    vendors?.map(vendor => (
                        <div
                            key={vendor.id}
                            onClick={() => setSelectedVendorId(vendor.id)}
                            className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-orange-500/30 transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                        {vendor.profileImageUrl ? (
                                            <img src={vendor.profileImageUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="h-6 w-6 text-orange-500" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg max-w-[180px] truncate">{vendor.businessName}</h3>
                                        <p className="text-xs text-gray-500">Created {new Date(vendor.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-orange-500 transition-colors mt-2" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Sub-component for managing a specific vendor's menu
function VendorMenuManager({ vendor, onBack }: { vendor: Vendor | undefined, onBack: () => void }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Vendor Edit State
    const [isVendorEditOpen, setIsVendorEditOpen] = useState(false);
    const [vendorNameEdit, setVendorNameEdit] = useState(vendor?.businessName || "");
    const [vendorLogoEdit, setVendorLogoEdit] = useState<File | null>(null);

    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryUploadFile, setGalleryUploadFile] = useState<File | null>(null);

    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Recommended");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [isVeg, setIsVeg] = useState(true);
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    const { data: menu, isLoading } = useQuery<MenuItem[]>({
        queryKey: [`/api/admin/street-food/vendors/${vendor?.id}/menu`],
        queryFn: () => api.get(`/admin/street-food/vendors/${vendor?.id}/menu`).then(r => r.data),
        enabled: !!vendor?.id
    });

    const editVendorM = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("businessName", vendorNameEdit);
            if (vendorLogoEdit) {
                formData.append("image", vendorLogoEdit);
            }
            return api.put(`/admin/street-food/vendors/${vendor?.id}`, formData).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/street-food/vendors"] });
            toast({ title: "Vendor Updated", description: "Profile updated successfully." });
            setIsVendorEditOpen(false);
            setVendorLogoEdit(null);
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const deleteVendorM = useMutation({
        mutationFn: async () => {
            return api.delete(`/admin/street-food/vendors/${vendor?.id}`).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/street-food/vendors"] });
            toast({ title: "Vendor Deleted", description: "Vendor and all their items have been removed." });
            onBack();
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const uploadGalleryM = useMutation({
        mutationFn: async () => {
            if (!galleryUploadFile) return;
            const formData = new FormData();
            formData.append("image", galleryUploadFile);
            return api.post(`/admin/street-food/vendors/${vendor?.id}/gallery`, formData).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/street-food/vendors"] });
            toast({ title: "Image Uploaded", description: "Gallery updated." });
            setGalleryUploadFile(null);
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const deleteGalleryImageM = useMutation({
        mutationFn: async (imageUrl: string) => {
            return api.delete(`/admin/street-food/vendors/${vendor?.id}/gallery`, { data: { imageUrl } }).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/street-food/vendors"] });
            toast({ title: "Image Removed", description: "Gallery updated." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const addItemM = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("category", category);
            formData.append("price", price);
            formData.append("description", description);
            formData.append("isVeg", String(isVeg));
            if (imageFile) {
                formData.append("image", imageFile);
            } else if (imageUrl) {
                formData.append("imageUrl", imageUrl);
            }
            if (editingItemId) {
                return api.put(`/admin/street-food/vendors/${vendor?.id}/menu/${editingItemId}`, formData).then(r => r.data);
            }
            return api.post(`/admin/street-food/vendors/${vendor?.id}/menu`, formData).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/street-food/vendors/${vendor?.id}/menu`] });
            toast({ title: editingItemId ? "Item Updated" : "Item Added", description: `${name} safely saved.` });
            setIsItemDialogOpen(false);
            resetForm();
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const deleteItemM = useMutation({
        mutationFn: async (itemId: string) => {
            return api.delete(`/admin/street-food/vendors/${vendor?.id}/menu/${itemId}`).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/admin/street-food/vendors/${vendor?.id}/menu`] });
            toast({ title: "Item Deleted", description: "The menu item was removed." });
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
        }
    });

    const resetForm = () => {
        setName(""); setCategory("Recommended"); setPrice(""); setDescription("");
        setIsVeg(true); setImageUrl(""); setImageFile(null); setEditingItemId(null);
    };

    const handleEditItem = (item: MenuItem) => {
        setName(item.name);
        setCategory(item.category || "Recommended");
        setPrice(item.price);
        setDescription(item.description || "");
        setIsVeg(item.isVeg);
        setImageUrl(item.imageUrl || "");
        setImageFile(null);
        setEditingItemId(item.id);
        setIsItemDialogOpen(true);
    };

    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return toast({ title: "Incomplete", description: "Name and Price required", variant: "destructive" });
        addItemM.mutate();
    };

    if (!vendor) return <div>Vendor not found</div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-right-8 duration-300 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/5 rounded-full shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            {vendor.businessName} - Menu
                        </h2>
                        <p className="text-gray-400 text-sm">Add and manage menu items and categories.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                                <ImageIcon className="h-4 w-4" /> Gallery
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Manage Photo Gallery</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6 mt-4">
                                <div className="flex items-end gap-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Upload New Image</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setGalleryUploadFile(e.target.files?.[0] || null)}
                                            className="bg-white/5 border-white/10 cursor-pointer text-sm"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => uploadGalleryM.mutate()}
                                        disabled={!galleryUploadFile || uploadGalleryM.isPending}
                                        className="bg-orange-500 hover:bg-orange-600"
                                    >
                                        {uploadGalleryM.isPending ? "Uploading..." : "Upload"}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {vendor.galleryImages?.map((url, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video bg-gray-800 border border-white/10">
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => deleteGalleryImageM.mutate(url)}
                                                    className="h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!vendor.galleryImages || vendor.galleryImages.length === 0) && (
                                        <div className="col-span-full py-8 text-center text-gray-500 text-sm">
                                            No gallery images uploaded yet.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isVendorEditOpen} onOpenChange={setIsVendorEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                                <Edit2 className="h-4 w-4" /> Edit Profile
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Edit Vendor Profile</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>Vendor Logo (Profile Image)</Label>
                                    <div className="flex items-center gap-4">
                                        {vendor.profileImageUrl && !vendorLogoEdit && (
                                            <img src={vendor.profileImageUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover border border-white/10" />
                                        )}
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setVendorLogoEdit(e.target.files?.[0] || null)}
                                            className="bg-white/5 border-white/10 cursor-pointer text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Business Name</Label>
                                    <Input value={vendorNameEdit} onChange={e => setVendorNameEdit(e.target.value)} className="bg-white/5 border-white/10" autoFocus />
                                </div>
                                <Button
                                    onClick={() => editVendorM.mutate()}
                                    className="w-full bg-orange-500 hover:bg-orange-600"
                                    disabled={!vendorNameEdit.trim() || editVendorM.isPending}
                                >
                                    {editVendorM.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                                <Separator className="my-4 bg-white/10" />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" className="w-full gap-2 border border-red-800 bg-red-950/30 hover:bg-red-900/50">
                                            <Trash2 className="h-4 w-4" /> Delete Vendor Completely
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-gray-400">
                                                This action cannot be undone. This will permanently delete the street food vendor <span className="text-white font-bold">{vendor.businessName}</span> and remove all of their menu items from the servers.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="bg-white/5 text-white border-0 hover:bg-white/10 mt-2 sm:mt-0">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteVendorM.mutate()} className="bg-red-600 text-white hover:bg-red-700">Yes, delete vendor</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex justify-between items-center bg-[#111827] p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Utensils className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">{menu?.length || 0} Total Items</span>
                </div>
                <Button onClick={() => { resetForm(); setIsItemDialogOpen(true); }} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                </Button>

                <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
                    setIsItemDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingItemId ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveItem} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label>Item Name *</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} required className="bg-white/5 border-white/10" />
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label>Price (₹) *</Label>
                                    <Input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} required className="bg-white/5 border-white/10" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Momos, Chinese, Drinks" className="bg-white/5 border-white/10" />
                            </div>

                            <div className="space-y-2">
                                <Label>Description / Subcategory</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short description of the dish..." className="bg-white/5 border-white/10 resize-none h-20" />
                            </div>

                            <div className="flex items-center justify-between border border-white/10 p-4 rounded-xl bg-white/5">
                                <div>
                                    <Label className="text-base">Veg / Non-Veg</Label>
                                    <p className="text-xs text-gray-400">Toggle if the item is vegetarian</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm ${isVeg ? 'text-green-500 font-bold' : 'text-gray-500'}`}>Veg</span>
                                    <Switch checked={isVeg} onCheckedChange={setIsVeg} />
                                    <span className={`text-sm ${!isVeg ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Non-Veg</span>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label>Image (Optional)</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">URL</Label>
                                        <Input
                                            value={imageUrl}
                                            onChange={e => { setImageUrl(e.target.value); setImageFile(null); }}
                                            placeholder="https://..."
                                            className="bg-white/5 border-white/10"
                                            disabled={!!imageFile}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-gray-400">Or Upload File</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setImageFile(file);
                                                    setImageUrl("");
                                                }
                                            }}
                                            className="bg-white/5 border-white/10 cursor-pointer text-sm py-1.5"
                                            disabled={!!imageUrl}
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" className="w-full mt-4 bg-orange-500 hover:bg-orange-600" disabled={addItemM.isPending}>
                                {addItemM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingItemId ? "Save Changes" : "Save Item")}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : menu?.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center bg-white/5 border border-white/10 border-dashed rounded-xl">
                    <Utensils className="h-10 w-10 text-gray-500 opacity-50 mb-3" />
                    <p className="text-gray-400 text-sm">No items added to {vendor.businessName} yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {menu?.map(item => (
                        <div key={item.id} className="bg-[#111827] rounded-xl overflow-hidden border border-white/5 relative group hover:border-white/20 transition-all shadow-sm">
                            <div className="h-40 bg-gray-800 relative">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="h-8 w-8 text-gray-600" />
                                    </div>
                                )}
                                {/* Veg/Non-veg indicator */}
                                <div className="absolute top-2 left-2 flex items-center justify-center w-5 h-5 bg-white rounded-sm shadow-sm p-0.5">
                                    <div className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        onClick={() => handleEditItem(item)}
                                        variant="secondary"
                                        size="icon"
                                        className="h-8 w-8 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-md"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="h-8 w-8 rounded-lg shadow-md border border-red-800">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="bg-[#111827] border-white/10 text-white">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Menu Item?</AlertDialogTitle>
                                                <AlertDialogDescription className="text-gray-400">
                                                    Are you sure you want to delete <span className="text-white font-medium">{item.name}</span>? This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="bg-white/5 text-white border-0 hover:bg-white/10 mt-2 sm:mt-0">Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteItemM.mutate(item.id)} className="bg-red-600 text-white hover:bg-red-700">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <h4 className="font-semibold text-[15px] truncate">{item.name}</h4>
                                    <span className="font-bold text-orange-500 shrink-0">₹{item.price}</span>
                                </div>
                                <div className="flex gap-2 mb-2 break-words">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/5 shrink-0">
                                        {item.category || "General"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 min-h-[32px]">
                                    {item.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
