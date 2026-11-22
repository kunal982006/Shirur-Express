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
  // Without a pin, add the town: a bare "Sai Nagar, near temple" otherwise lands in another city.
  const textTarget = address && !/shirur/i.test(address) ? `${address}, Shirur` : address;
  const target = encodeURIComponent(pin ? `${pin.lat},${pin.lng}` : textTarget);
  return mode === "directions"
    ? `https://www.google.com/maps/dir/?api=1&destination=${target}`
    : `https://www.google.com/maps/search/?api=1&query=${target}`;
}

// Directions to the customer, or null when the order has neither a pin nor an address.
export function deliveryDirectionsUrl(text: string | null | undefined): string | null {
  const { address, pin } = parseDeliveryAddress(text);
  if (!pin && !address.trim()) return null;
  return deliveryMapsUrl(text, "directions");
}
