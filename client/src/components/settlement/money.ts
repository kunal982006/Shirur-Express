// Rupee amounts for the settlement screens: whole rupees, paise only when present.
export function rupees(value: number | null | undefined): string {
  const n = Math.round((value || 0) * 100) / 100;
  return `₹${Number.isInteger(n) ? n.toLocaleString("en-IN") : n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "Give Shirur Express ₹X" / "Shirur Express pays you ₹X" style wording. */
export function settleLine(partnerOwes: number, who: "partner" | "admin", name = "partner") {
  const amount = rupees(Math.abs(partnerOwes));
  if (Math.abs(partnerOwes) < 0.005) return { text: "Nothing to settle", tone: "even" as const };
  if (partnerOwes > 0) {
    return { text: who === "partner" ? `Give Shirur Express ${amount}` : `${name} gives you ${amount}`, tone: "partnerPays" as const };
  }
  return { text: who === "partner" ? `Shirur Express pays you ${amount}` : `Pay ${name} ${amount}`, tone: "shirurPays" as const };
}
