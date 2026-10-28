import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface ProviderPhoneDialogProps {
    provider: { id: string; businessName: string; phone?: string | null };
}

// Lets admins change a provider's (e.g. restaurant's) phone number.
export function ProviderPhoneDialog({ provider }: ProviderPhoneDialogProps) {
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const savePhone = useMutation({
        mutationFn: (value: string) => api.patch(`/admin/providers/${provider.id}/phone`, { phone: value }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
            toast({ title: "Phone number saved", description: `${provider.businessName} → ${phone}` });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Failed to save phone number", description: error.response?.data?.message || error.message, variant: "destructive" });
        },
    });

    const isValid = /^\d{10}$/.test(phone) && phone !== provider.phone;

    return (
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setPhone(provider.phone || ""); }}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${provider.phone ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}
                >
                    <Phone className="h-2.5 w-2.5" /> {provider.phone || "Set phone"}
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Phone number · {provider.businessName}</DialogTitle>
                    <DialogDescription>
                        This is also the owner's login phone — they will log in with the new number.
                    </DialogDescription>
                </DialogHeader>
                <form
                    className="space-y-3"
                    onSubmit={(e) => { e.preventDefault(); if (isValid) savePhone.mutate(phone); }}
                >
                    <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        autoFocus
                    />
                    <Button type="submit" className="w-full" disabled={!isValid || savePhone.isPending}>
                        {savePhone.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save phone number
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
