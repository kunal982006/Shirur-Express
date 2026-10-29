// Orders store the delivery address as plain text. The exact map pin the customer
// confirmed is appended as " | Pin: lat,lng" so admins and riders can open that
// precise spot in Google Maps. Searching the text instead (which contains the
// customer's own house / building name) returns wrong or multiple places.

const PIN_PATTERN = /\s*\|\s*Pin:\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

export interface DeliveryPin {
  lat: number;
  lng: number;
}

export function withDeliveryPin(address: string, pin: DeliveryPin): string {
  return `${address} | Pin: ${pin.lat.toFixed(6)},${pin.lng.toFixed(6)}`;
}

export function parseDeliveryAddress(text: string | null | undefined): { address: string; pin: DeliveryPin | null } {
  const value = text || "";
  const match = value.match(PIN_PATTERN);
  if (!match) return { address: value, pin: null };
  return {
    address: value.slice(0, match.index).trim(),
    pin: { lat: Number(match[1]), lng: Number(match[2]) },
  };
}

// The address without the pin suffix, for display.
export function displayDeliveryAddress(text: string | null | undefined): string {
  return parseDeliveryAddress(text).address;
}

// Google Maps link to the exact pin; older orders without a pin fall back to a text search.
export function deliveryMapsUrl(text: string | null | undefined, mode: "search" | "directions" = "search"): string {
  const { address, pin } = parseDeliveryAddress(text);
  const target = encodeURIComponent(pin ? `${pin.lat},${pin.lng}` : address);
  return mode === "directions"
    ? `https://www.google.com/maps/dir/?api=1&destination=${target}`
    : `https://www.google.com/maps/search/?api=1&query=${target}`;
}
