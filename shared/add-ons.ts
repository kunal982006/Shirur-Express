// Dishes in an "Add-ons" category (e.g. a single idli or wada) can only be
// ordered together with at least one regular dish from the same vendor.
export function isAddOnCategory(category: string | null | undefined): boolean {
  return /^\s*add[\s-]?ons?\b/i.test(category || "");
}

export const ADD_ON_ONLY_MESSAGE = "Add-ons can only be ordered with a main dish. Please add a main dish first.";
