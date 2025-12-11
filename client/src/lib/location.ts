
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

    // Base Charge: ₹18 (Fixed for the first km or start)
    // Variable Charge: ₹9 per km
    // Formula: Total_Fee = 18 + (Distance_in_KM * 9)

    // Note: The prompt says "Fixed for the first km or start". 
    // Usually this means if distance < 1km, fee is 18. 
    // But the formula `18 + (Distance_in_KM * 9)` implies 18 is base and we add 9 * dist.
    // If dist is 0.5km, fee = 18 + 0.5*9 = 22.5.
    // If dist is 1.5km, fee = 18 + 1.5*9 = 31.5.
    // This seems consistent with "Base Charge + Variable Charge".

    return 18 + (distanceInKm * 9);
}
