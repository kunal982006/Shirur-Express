// Keeps the public catalogue (home feed, restaurant lists, menus) on the phone
// between visits. On the next open those screens draw at once from the saved
// copy and are then refreshed from the server in the background, so prices and
// availability still update.
//
// Only data that is the same for every visitor is saved. Anything personal
// (account, orders, bookings, addresses, dashboards) is never written here.

import { dehydrate, hydrate, type QueryClient, type QueryKey } from "@tanstack/react-query";

const STORAGE_KEY = "se_catalogue_cache_v1";
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;
const MAX_BYTES = 1_500_000; // localStorage holds about 5MB in total
const SAVE_DELAY_MS = 1500;

const PUBLIC_KEYS = [
  "/api/homepage/popular",
  "/api/food-collections",
  "/api/food-insights",
  "/api/dish-highlights",
  "/api/offers/active",
  "/api/service-categories",
  "/api/service-providers",
  "/api/cakes",
  "restaurants",
  "restaurant",
  "restaurantMenu",
  "service-providers",
  "service-provider-detail",
  "service-problems",
  "streetFoodVendors",
  "street-food-vendors",
  "streetFoodMenu",
  "streetFoodItems",
  "vendor",
  "gmartProvider",
  "groceryMetadata",
];

function isPublic(queryKey: QueryKey): boolean {
  const first = queryKey[0];
  if (typeof first !== "string") return false;
  return PUBLIC_KEYS.some((key) => first === key || first.startsWith(`${key}?`) || first.startsWith(`${key}/`));
}

export function restoreQueryCache(client: QueryClient) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (!saved?.state || Date.now() - Number(saved.savedAt) > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    hydrate(client, saved.state);
    // Saved data is shown straight away but counts as out of date, so each
    // screen fetches a fresh copy as soon as it opens.
    void client.invalidateQueries({ refetchType: "none" });
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  }
}

function save(client: QueryClient) {
  try {
    const state = dehydrate(client, {
      shouldDehydrateQuery: (query) => query.state.status === "success" && isPublic(query.queryKey),
    });
    // Newest first, and stop when the budget is used up.
    const queries = [...state.queries].sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt);
    const kept: typeof queries = [];
    let bytes = 0;
    for (const query of queries) {
      const size = JSON.stringify(query).length;
      if (bytes + size > MAX_BYTES) continue;
      bytes += size;
      kept.push(query);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), state: { mutations: [], queries: kept } }));
  } catch {
    // Storage full or blocked: the app simply loads from the network as before.
  }
}

export function persistQueryCache(client: QueryClient) {
  let timer: number | undefined;
  const flush = () => {
    if (timer === undefined) return;
    window.clearTimeout(timer);
    timer = undefined;
    save(client);
  };

  client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || event.action.type !== "success" || !isPublic(event.query.queryKey)) return;
    if (timer === undefined) timer = window.setTimeout(flush, SAVE_DELAY_MS);
  });

  // Don't lose the last update when the app is sent to the background.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}
