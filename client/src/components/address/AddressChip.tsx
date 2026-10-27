import { ChevronDown, MapPin } from "lucide-react";
import { shortAddress, useDeliveryAddress } from "@/hooks/use-delivery-address";

interface AddressChipProps {
  variant?: "light" | "dark"; // light = white text on dark backgrounds
  className?: string;
}

// "Home ▾ Baburao Nagar, Shirur" — tap to change the delivery address.
export function AddressChip({ variant = "dark", className = "" }: AddressChipProps) {
  const { address, openSheet } = useDeliveryAddress();
  const isLight = variant === "light";

  return (
    <button
      type="button"
      onClick={openSheet}
      className={`flex min-w-0 items-center gap-1 text-left ${className}`}
      aria-label="Change delivery address"
    >
      <MapPin className={`h-3.5 w-3.5 shrink-0 ${isLight ? "text-white/80" : "text-primary"}`} />
      <span className={`shrink-0 text-xs font-bold ${isLight ? "text-white" : "text-foreground"}`}>
        {address ? address.label : "Select location"}
      </span>
      {address && (
        <span className={`truncate text-xs ${isLight ? "text-white/70" : "text-muted-foreground"}`}>
          · {shortAddress(address)}
        </span>
      )}
      <ChevronDown className={`h-3.5 w-3.5 shrink-0 ${isLight ? "text-white/80" : "text-muted-foreground"}`} />
    </button>
  );
}
