import { useEffect, useRef, useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useDeliveryAddress } from "@/hooks/use-delivery-address";
import { getAccuratePosition, reverseGeocode } from "@/lib/google-maps";
import { calculateDistance } from "@/lib/location";

// Ask only when the customer is clearly somewhere else than the selected address.
const FAR_FROM_ADDRESS_METERS = 300;

type Pin = { formattedAddress: string; lat: number; lng: number };

/**
 * At checkout, if location permission is already granted and the customer is away
 * from the selected address, ask whether to deliver to where they are now.
 * Never triggers a permission prompt by itself.
 */
export function CurrentLocationPrompt() {
  const { address, openSheet } = useDeliveryAddress();
  const [here, setHere] = useState<Pin | null>(null);
  const [open, setOpen] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!address || checked.current) return;
    checked.current = true;

    (async () => {
      try {
        const permission = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
        if (permission?.state !== "granted") return;
        const position = await getAccuratePosition(undefined, { targetAccuracy: 50, maxWaitMs: 6000 });
        if (position.coords.accuracy > 150) return; // too rough to compare reliably
        const { latitude: lat, longitude: lng } = position.coords;
        // calculateDistance adds a 1.2 road factor; undo it for a straight-line comparison
        const meters = calculateDistance(lat, lng, address.lat, address.lng) / 1.2;
        if (meters < FAR_FROM_ADDRESS_METERS) return;
        const formattedAddress = await reverseGeocode(lat, lng);
        if (!formattedAddress) return;
        setHere({ formattedAddress, lat, lng });
        setOpen(true);
      } catch {
        // Location is optional here; keep the selected address
      }
    })();
  }, [address]);

  if (!here) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-lg">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/25" />
          <div className="relative -mx-4 mb-3 flex h-28 items-end justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-background dark:from-emerald-950/40">
            <div className="relative mb-2 flex flex-col items-center">
              <div className="animate-pin-drop">
                <MapPin className="h-12 w-12 fill-emerald-600 text-emerald-700 drop-shadow-lg" strokeWidth={1.5} />
              </div>
              <span className="relative mt-0.5 flex h-2 w-8 items-center justify-center">
                <span className="absolute inline-flex h-4 w-12 animate-ping rounded-full bg-emerald-500/30" />
                <span className="h-2 w-7 rounded-full bg-black/15" />
              </span>
            </div>
          </div>

          <SheetHeader className="text-center sm:text-center">
            <SheetTitle className="animate-pop-in text-xl font-extrabold">Do you want this order at your current location?</SheetTitle>
            <SheetDescription className="sr-only">You seem to be away from your selected delivery address.</SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSheet({ step: "map", pin: here });
              }}
              className="flex w-full animate-pop-in items-start gap-3 rounded-2xl border-2 border-emerald-600 p-4 text-left transition-colors [animation-delay:80ms] hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <LocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <span className="min-w-0">
                <span className="block font-bold text-emerald-700 dark:text-emerald-400">Yes, deliver at my current location</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{here.formattedAddress}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openSheet();
              }}
              className="w-full animate-pop-in rounded-2xl border-2 border-emerald-600/40 p-4 font-bold text-emerald-700 transition-colors [animation-delay:140ms] hover:bg-muted/60 dark:text-emerald-400"
            >
              No, at some other location
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
