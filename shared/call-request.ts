// A "Request a Call" booking from the electrician / plumber pages: the customer
// only leaves a phone number; the team calls back for the problem and address,
// then assigns a technician from the admin panel.
export const CALL_REQUEST_SLOT = "CALL REQUEST";
export const CALL_REQUEST_ADDRESS = "Confirm address on call";

export function isCallRequest(preferredTimeSlots: unknown): boolean {
  return Array.isArray(preferredTimeSlots) && preferredTimeSlots.includes(CALL_REQUEST_SLOT);
}
