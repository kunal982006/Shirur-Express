import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Briefcase, Check, ChevronRight, Home as HomeIcon, LocateFixed, MapPin, Pencil, Plus, Trash2,
} from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocationPicker } from "@/components/location-picker";
import { useAuth } from "@/hooks/use-auth";
import {
  formatFullAddress,
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
const LABEL_ICONS: Record<AddressLabel, typeof HomeIcon> = { Home: HomeIcon, Work: Briefcase, Other: MapPin };

type Pin = { formattedAddress: string; lat: number; lng: number };

/**
 * Global delivery address sheet.
 * - Opens automatically (and cannot be dismissed) on ordering pages until an address is saved.
 * - Afterwards it opens when the customer taps "change address": they can use their
 *   current location, add a new address or pick one of their saved addresses.
 */
export function AddressSheet() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { address, savedAddresses, isSheetOpen, sheetIntent, saveAddress, selectAddress, removeAddress, closeSheet } = useDeliveryAddress();

  const isRequiredRoute = ADDRESS_REQUIRED_ROUTES.some((route) =>
    route === "/" ? location === "/" : location === route || location.startsWith(`${route}/`)
  );
  const mustChoose = !address && isRequiredRoute && user?.role !== "admin";
  const open = isSheetOpen || mustChoose;

  const [step, setStep] = useState<"choose" | "map">("choose");
  const [autoLocate, setAutoLocate] = useState(false);
  const [editId, setEditId] = useState<string | undefined>();
  const [pin, setPin] = useState<Pin | null>(null);
  const [houseDetails, setHouseDetails] = useState("");
  const [landmark, setLandmark] = useState("");
  const [label, setLabel] = useState<AddressLabel>("Home");

  const startMap = ({ locate = false, startPin = null as Pin | null, id = undefined as string | undefined } = {}) => {
    const existing = id ? savedAddresses.find((item) => item.id === id) : undefined;
    setEditId(existing?.id);
    setAutoLocate(locate);
    setPin(startPin ?? (existing ? { formattedAddress: existing.formattedAddress, lat: existing.lat, lng: existing.lng } : null));
    setHouseDetails(existing?.houseDetails || "");
    setLandmark(existing?.landmark || "");
    setLabel(existing?.label || (savedAddresses.some((item) => item.label === "Home") ? "Other" : "Home"));
    setStep("map");
  };

  // Each opening starts where the caller asked (the list, or straight to the map)
  useEffect(() => {
    if (!open) return;
    if (sheetIntent.step === "map") {
      startMap({ locate: sheetIntent.locate, startPin: sheetIntent.pin ?? null, id: sheetIntent.editId });
    } else {
      setStep(savedAddresses.length === 0 && !mustChoose ? "map" : "choose");
    }
  }, [open, sheetIntent]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncProfile = (fullAddress: string) => {
    // Keep the profile address in sync for logged-in customers (best effort)
    if (user) api.patch("/auth/profile", { address: fullAddress }).catch(() => {});
  };

  const save = () => {
    if (!pin || !houseDetails.trim()) return;
    const saved = saveAddress({
      ...pin,
      id: editId,
      label,
      houseDetails: houseDetails.trim(),
      landmark: landmark.trim() || undefined,
    });
    syncProfile(formatFullAddress(saved));
  };

  const choose = (id: string) => {
    selectAddress(id);
    const chosen = savedAddresses.find((item) => item.id === id);
    if (chosen) syncProfile(formatFullAddress(chosen));
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!next && !mustChoose) closeSheet(); }}>
      <SheetContent
        side="bottom"
        className={`max-h-[92vh] overflow-y-auto rounded-t-3xl border-0 bg-slate-50 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 dark:bg-background ${mustChoose ? "[&>button:last-child]:hidden" : ""}`}
        onInteractOutside={(event) => { if (mustChoose) event.preventDefault(); }}
        onEscapeKeyDown={(event) => { if (mustChoose) event.preventDefault(); }}
      >
        <div className="mx-auto w-full max-w-lg">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/25" />

          {step === "choose" ? (
            <div key="choose">
              {/* Animated hero */}
              <div className="relative -mx-4 mb-4 flex h-32 items-end justify-center overflow-hidden bg-gradient-to-b from-emerald-50 to-slate-50 dark:from-emerald-950/40 dark:to-background">
                <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-6 opacity-40">
                  {[44, 64, 36, 80, 52, 30, 70, 46].map((height, index) => (
                    <div key={index} className="w-7 rounded-t-sm bg-emerald-200 dark:bg-emerald-900" style={{ height }} />
                  ))}
                </div>
                <div className="relative mb-3 flex flex-col items-center">
                  <div className="animate-pin-drop">
                    <MapPin className="h-14 w-14 fill-emerald-600 text-emerald-700 drop-shadow-lg" strokeWidth={1.5} />
                  </div>
                  <span className="relative mt-0.5 flex h-2 w-8 items-center justify-center">
                    <span className="absolute inline-flex h-4 w-12 animate-ping rounded-full bg-emerald-500/30" />
                    <span className="h-2 w-8 rounded-full bg-black/15" />
                  </span>
                </div>
              </div>

              <SheetHeader className="text-center sm:text-center">
                <SheetTitle className="animate-pop-in text-xl font-extrabold">
                  {mustChoose ? "Where should we deliver?" : "Select delivery location"}
                </SheetTitle>
                <SheetDescription className="animate-pop-in [animation-delay:60ms]">
                  Choose a saved address or use your current location.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 animate-pop-in overflow-hidden rounded-2xl border bg-background shadow-sm [animation-delay:120ms]">
                <button
                  type="button"
                  onClick={() => startMap({ locate: true })}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-emerald-50 active:bg-emerald-100 dark:hover:bg-emerald-950/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60">
                    <LocateFixed className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-emerald-700 dark:text-emerald-400">Use my current location</span>
                    <span className="block text-xs text-muted-foreground">Detect using GPS</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                <div className="mx-4 border-t" />
                <button
                  type="button"
                  onClick={() => startMap()}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 active:bg-muted"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Plus className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-emerald-700 dark:text-emerald-400">Add new address</span>
                    <span className="block text-xs text-muted-foreground">Search area or pick on map</span>
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {savedAddresses.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 animate-pop-in text-sm font-semibold text-muted-foreground [animation-delay:180ms]">Your saved addresses</p>
                  <div className="space-y-2.5">
                    {savedAddresses.map((item, index) => {
                      const Icon = LABEL_ICONS[item.label] || MapPin;
                      const selected = item.id === address?.id;
                      return (
                        <div
                          key={item.id}
                          className={`animate-pop-in rounded-2xl border bg-background shadow-sm transition-colors ${selected ? "border-emerald-500 ring-1 ring-emerald-500/40" : ""}`}
                          style={{ animationDelay: `${220 + index * 60}ms` }}
                        >
                          <button type="button" onClick={() => choose(item.id)} className="flex w-full items-start gap-3 p-3.5 text-left">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-amber-50 dark:bg-amber-950/30">
                              <Icon className="h-5 w-5 text-amber-600" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2 font-bold">
                                {item.label}
                                {selected && (
                                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                    <Check className="h-3 w-3" /> Selected
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{formatFullAddress(item)}</span>
                            </span>
                          </button>
                          <div className="flex gap-2 px-3.5 pb-3 pl-[4.25rem]">
                            <button
                              type="button"
                              onClick={() => startMap({ id: item.id })}
                              className="flex h-8 w-8 items-center justify-center rounded-full border text-emerald-700 hover:bg-muted"
                              aria-label={`Edit ${item.label} address`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAddress(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-full border text-destructive hover:bg-destructive/10"
                              aria-label={`Delete ${item.label} address`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div key="map" className="animate-pop-in">
              <SheetHeader className="text-left">
                <div className="flex items-center gap-2">
                  {(savedAddresses.length > 0 || mustChoose) && (
                    <Button variant="ghost" size="icon" className="-ml-2 h-8 w-8" onClick={() => setStep("choose")} aria-label="Back">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <SheetTitle className="text-lg font-extrabold">
                    {editId ? "Edit address" : "Confirm delivery location"}
                  </SheetTitle>
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
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm dark:bg-emerald-950/30">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
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
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
