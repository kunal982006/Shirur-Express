import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Briefcase, Home as HomeIcon, LocateFixed, MapPin, Search } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/location-picker";
import { useAuth } from "@/hooks/use-auth";
import {
  formatFullAddress,
  shortAddress,
  useDeliveryAddress,
  type AddressLabel,
} from "@/hooks/use-delivery-address";
import api from "@/lib/api";

// Pages where a customer browses or orders and therefore needs a delivery address.
const ADDRESS_REQUIRED_ROUTES = ["/", "/restaurants", "/street-food", "/cake-shop", "/grocery", "/search", "/checkout"];

const LABELS: { value: AddressLabel; icon: typeof HomeIcon }[] = [
  { value: "Home", icon: HomeIcon },
  { value: "Work", icon: Briefcase },
  { value: "Other", icon: MapPin },
];

type Step = "choose" | "map";

/**
 * Global delivery address sheet.
 * - Opens automatically (and cannot be dismissed) on ordering pages until an address is saved.
 * - Afterwards it opens only when the customer taps "change address".
 */
export function AddressSheet() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { address, isSheetOpen, setAddress, closeSheet } = useDeliveryAddress();

  const isRequiredRoute = ADDRESS_REQUIRED_ROUTES.some((route) =>
    route === "/" ? location === "/" : location === route || location.startsWith(`${route}/`)
  );
  const mustChoose = !address && isRequiredRoute && user?.role !== "admin";
  const open = isSheetOpen || mustChoose;

  const [step, setStep] = useState<Step>("choose");
  const [autoLocate, setAutoLocate] = useState(false);
  const [pin, setPin] = useState<{ formattedAddress: string; lat: number; lng: number } | null>(null);
  const [houseDetails, setHouseDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [label, setLabel] = useState<AddressLabel>("Home");

  // Start every opening from the first step, prefilled with the saved address
  useEffect(() => {
    if (!open) return;
    setStep("choose");
    setPin(address ? { formattedAddress: address.formattedAddress, lat: address.lat, lng: address.lng } : null);
    setHouseDetails(address?.houseDetails || "");
    setLandmark(address?.landmark || "");
    setLabel(address?.label || "Home");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToMap = (locate: boolean) => {
    setAutoLocate(locate);
    setStep("map");
  };

  const save = () => {
    if (!pin || !houseDetails.trim()) return;
    const saved = {
      ...pin,
      label,
      houseDetails: houseDetails.trim(),
      landmark: landmark.trim() || undefined,
    };
    setAddress(saved);
    // Keep the profile address in sync for logged-in customers (best effort)
    if (user) api.patch("/auth/profile", { address: formatFullAddress(saved) }).catch(() => {});
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next && !mustChoose) closeSheet(); }}>
      <SheetContent
        side="bottom"
        className={`max-h-[92vh] overflow-y-auto rounded-t-2xl px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] ${mustChoose ? "[&>button:last-child]:hidden" : ""}`}
        onInteractOutside={(event) => { if (mustChoose) event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (mustChoose) event.preventDefault(); }}
      >
        <div className="mx-auto w-full max-w-lg">
          {step === "choose" ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="text-xl font-extrabold">Where should we deliver?</SheetTitle>
                <SheetDescription>
                  We use your location to show how far each restaurant is and how long delivery will take.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-3">
                <Button className="h-12 w-full justify-start gap-3 text-base font-semibold" onClick={() => goToMap(true)}>
                  <LocateFixed className="h-5 w-5" /> Use my current location
                </Button>
                <Button variant="outline" className="h-12 w-full justify-start gap-3 text-base font-semibold" onClick={() => goToMap(false)}>
                  <Search className="h-5 w-5" /> Search area or pick on map
                </Button>

                {address && (
                  <div className="pt-2">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Saved address</p>
                    <button
                      type="button"
                      onClick={closeSheet}
                      className="flex w-full items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3 text-left"
                    >
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block font-bold">{address.label} · {shortAddress(address)}</span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">{formatFullAddress(address)}</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={() => setStep("choose")} aria-label="Back">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <SheetTitle className="text-lg font-extrabold">Confirm delivery location</SheetTitle>
                </div>
              </SheetHeader>

              <div className="mt-3">
                <LocationPicker
                  autoLocate={autoLocate}
                  initialPosition={!autoLocate && pin ? { lat: pin.lat, lng: pin.lng } : undefined}
                  currentAddress={!autoLocate ? pin?.formattedAddress : undefined}
                  mapHeight={240}
                  onAddressSelect={(formattedAddress, coords) => setPin({ formattedAddress, ...coords })}
                />
              </div>

              {pin && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{pin.formattedAddress}</span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <Input
                  placeholder="House / Flat no., Floor, Building *"
                  value={houseDetails}
                  onChange={(event) => setHouseDetails(event.target.value)}
                />
                <Input
                  placeholder="Nearby landmark (optional)"
                  value={landmark}
                  onChange={(event) => setLandmark(event.target.value)}
                />
                <div className="flex gap-2">
                  {LABELS.map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setLabel(value)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${label === value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {value}
                    </button>
                  ))}
                </div>
                <Button className="h-12 w-full text-base font-bold" disabled={!pin || !houseDetails.trim()} onClick={save}>
                  {!pin ? "Pick a location on the map" : !houseDetails.trim() ? "Enter house / flat details" : "Save address & continue"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
