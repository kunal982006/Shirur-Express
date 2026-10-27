import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/location-picker";
import { useToast } from "@/hooks/use-toast";
import { getProviderCoordinates } from "@/lib/location";
import api from "@/lib/api";

interface ProviderLocationDialogProps {
    provider: { id: string; businessName: string; latitude?: string | null; longitude?: string | null };
}

// Lets admins pin a provider on the map so customers see distance & delivery time.
export function ProviderLocationDialog({ provider }: ProviderLocationDialogProps) {
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const current = getProviderCoordinates(provider);

    const saveLocation = useMutation({
        mutationFn: (coords: { lat: number; lng: number }) =>
            api.patch(`/admin/providers/${provider.id}/location`, { latitude: coords.lat, longitude: coords.lng }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/providers"] });
            toast({ title: "Location saved", description: `${provider.businessName} is now pinned on the map.` });
            setOpen(false);
        },
        onError: (error: any) => {
            toast({ title: "Failed to save location", description: error.response?.data?.message || error.message, variant: "destructive" });
        },
    });

    return (
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (next) setPin(null); }}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${current ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border-amber-500/30"}`}
                >
                    <MapPin className="h-2.5 w-2.5" /> {current ? "Location set" : "Set location"}
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Pin location · {provider.businessName}</DialogTitle>
                </DialogHeader>
                <LocationPicker
                    initialPosition={current || undefined}
                    mapHeight={280}
                    onAddressSelect={(_address, coords) => setPin(coords)}
                />
                <Button
                    disabled={!pin || saveLocation.isPending}
                    onClick={() => pin && saveLocation.mutate(pin)}
                >
                    {saveLocation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {pin ? `Save (${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)})` : "Click the map or search to drop a pin"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
