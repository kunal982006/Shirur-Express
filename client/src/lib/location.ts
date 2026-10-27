
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    // Correction factor of 1.2 for road distance estimation
    return d * 1.2;
}

export function calculateDeliveryFee(distanceInMeters: number): number {
    const distanceInKm = Math.floor((distanceInMeters / 1000) * 10) / 10; // Floor to 1 decimal place

    // Charge: ₹9 per km
    // Updated as per user request "delivery charge should be 9rs per km"
    return Math.ceil(distanceInKm) * 9;
}

// Delivery time = fixed preparation time + travel time per km.
// e.g. a restaurant 2 km away → 15 + 2 × 5 = 25 minutes.
export const PREPARATION_TIME_MINUTES = 15;
export const MINUTES_PER_KM = 5;

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface DeliveryEstimate {
    distanceKm: number;
    minutes: number;
}

type ProviderCoordinates = {
    latitude?: string | number | null;
    longitude?: string | number | null;
};

export function getProviderCoordinates(provider?: ProviderCoordinates | null): Coordinates | null {
    if (!provider || provider.latitude == null || provider.longitude == null) return null;
    const lat = Number(provider.latitude);
    const lng = Number(provider.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
}

export function estimateDelivery(from: Coordinates | null, provider?: ProviderCoordinates | null): DeliveryEstimate | null {
    const to = getProviderCoordinates(provider);
    if (!from || !to) return null;
    const distanceKm = calculateDistance(from.lat, from.lng, to.lat, to.lng) / 1000;
    return {
        distanceKm,
        minutes: Math.round(PREPARATION_TIME_MINUTES + distanceKm * MINUTES_PER_KM),
    };
}

export function formatDistance(distanceKm: number): string {
    if (distanceKm < 1) return `${Math.max(100, Math.round(distanceKm * 10) * 100)} m`;
    return `${distanceKm.toFixed(1).replace(/\.0$/, "")} km`;
}
