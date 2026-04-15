import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Plus, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminPromotions() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    // Form states
    const [title, setTitle] = useState("");
    const [redirectUrl, setRedirectUrl] = useState("");
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [popupFile, setPopupFile] = useState<File | null>(null);
    const [isActive, setIsActive] = useState(true);

    const { data: promotions, isLoading } = useQuery({
        queryKey: ["/api/admin/promotions"],
        queryFn: () => api.get("/admin/promotions").then(r => r.data),
    });

    const createPromoMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("redirectUrl", redirectUrl);
            formData.append("isActive", isActive.toString());
            if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
            if (popupFile) formData.append("popup", popupFile);

            return api.post("/admin/promotions", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            }).then(r => r.data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/offers/active"] });
            toast({ title: "Success", description: "Promotional offer created!" });
            setIsDialogOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to create promo", variant: "destructive" });
        }
    });

    const deletePromoMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/admin/promotions/${id}`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/promotions"] });
            queryClient.invalidateQueries({ queryKey: ["/api/offers/active"] });
            toast({ title: "Success", description: "Promotional offer deleted!" });
        },
        onError: (error: any) => {
            toast({ title: "Error", description: error.response?.data?.message || "Failed to delete promo", variant: "destructive" });
        }
    });

    const resetForm = () => {
        setTitle("");
        setRedirectUrl("");
        setThumbnailFile(null);
        setPopupFile(null);
        setIsActive(true);
    };

    const handleCreate = () => {
        if (!title || !redirectUrl || !thumbnailFile || !popupFile) {
            toast({ title: "Validation Error", description: "Please fill all fields and upload both images.", variant: "destructive" });
            return;
        }
        createPromoMutation.mutate();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">Admin Promotional Offers</h3>
                    <p className="text-sm text-gray-500">Manage pop-up promotions for the homepage carousel</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                            <Plus className="h-4 w-4" /> Add Promotion
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111827] border-white/10 text-white sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Promotion</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Title (Internal)</Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Diwali Special" className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Redirect URL</Label>
                                <Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://..." className="bg-white/5 border-white/10" />
                            </div>
                            <div className="space-y-2">
                                <Label>Thumbnail Image (16:9)</Label>
                                <Input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="bg-white/5 border-white/10 text-gray-400" />
                                <p className="text-[10px] text-gray-500">Appears in the horizontal carousel</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Pop-up Image</Label>
                                <Input type="file" accept="image/*" onChange={(e) => setPopupFile(e.target.files?.[0] || null)} className="bg-white/5 border-white/10 text-gray-400" />
                                <p className="text-[10px] text-gray-500">Appears in the modal when thumbnail is clicked</p>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                                <Label>Active</Label>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                            <Button 
                                onClick={handleCreate} 
                                disabled={createPromoMutation.isPending} 
                                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                            >
                                {createPromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save Promotion
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
            ) : promotions?.length === 0 ? (
                <div className="text-center py-12 bg-[#111827] rounded-2xl border border-white/5 text-gray-400">
                    No promotional offers added yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promotions?.map((promo: any) => (
                        <div key={promo.id} className="bg-[#111827] rounded-2xl border border-white/5 p-4 flex gap-4 group">
                            <div className="w-24 h-16 rounded-lg bg-gray-800 overflow-hidden shrink-0">
                                <img src={promo.thumbnailImageUrl} alt={promo.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-sm truncate pr-2">{promo.title}</h4>
                                    <Badge variant="outline" className={promo.isActive ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-gray-500/10 text-gray-400"}>
                                        {promo.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-xs text-blue-400 hover:underline cursor-pointer truncate" onClick={() => window.open(promo.redirectUrl, "_blank")}>
                                    <LinkIcon className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{promo.redirectUrl}</span>
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => {
                                            if(confirm('Are you sure you want to delete this promotion?')) {
                                                deletePromoMutation.mutate(promo.id);
                                            }
                                        }}
                                        className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
