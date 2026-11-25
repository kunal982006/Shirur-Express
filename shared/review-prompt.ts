// When to ask a customer to rate Shirur Express on the Play Store.
// Food orders: only when delivered fast (placed to delivered in under 26 minutes).
// Bookings (electrician, plumber, beauty parlour, …): every finished booking.
export const FAST_DELIVERY_MINUTES = 26;
export const FINISHED_BOOKING_STATUSES = ["completed", "awaiting_billing", "pending_payment"];

export interface ReviewPromptCandidate {
  kind: "order" | "booking";
  id: string;
}
