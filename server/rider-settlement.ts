// Restaurant bills, partner earnings and daily settlement for restaurant and
// street food orders. The money rules live in @shared/rider-settlement.
//
// Restaurant prices sit in their own table (never on menus or orders), so
// customers never receive them.

import type { Express, Response, NextFunction } from "express";
import { and, asc, desc, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { menuItemRestaurantPrices, restaurantMenuItems, restaurantOrders, serviceProviders, streetFoodItems, streetFoodOrders } from "@shared/schema";
import { addUpSettlements, istToday, settleOrder, type OrderSettlement } from "@shared/rider-settlement";

type Middleware = (req: any, res: Response, next: NextFunction) => unknown;

/** Order types the partner pays for at the counter. */
const SETTLED_TYPES = new Set(["restaurant", "street_food"]);
/** Once picked up, the partner has paid the restaurant. */
const PICKED_UP_STATUSES = ["picked_up", "out_for_delivery", "delivered"];

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
};

const itemIdOf = (item: any): string | undefined => item?.menuItemId || item?.productId || undefined;

type PriceHistory = Array<{ at: number; price: number }>;

/** Every restaurant price entered for these dishes, oldest first, by menu item id. */
async function loadPriceHistory(ids: string[]): Promise<Map<string, PriceHistory>> {
  const history = new Map<string, PriceHistory>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return history;
  const rows = await db.select().from(menuItemRestaurantPrices)
    .where(inArray(menuItemRestaurantPrices.itemId, unique))
    .orderBy(asc(menuItemRestaurantPrices.effectiveFrom), asc(menuItemRestaurantPrices.id));
  for (const row of rows) {
    const price = toNumber(row.restaurantPrice);
    if (price === null) continue;
    if (!history.has(row.itemId)) history.set(row.itemId, []);
    history.get(row.itemId)!.push({ at: new Date(row.effectiveFrom).getTime(), price });
  }
  return history;
}

/**
 * The price that applied when the order was placed. Orders from before a dish's
 * first price was entered use that first price.
 */
function priceAt(history: PriceHistory | undefined, at: number): number | null {
  if (!history || history.length === 0) return null;
  let price = history[0].price;
  for (const entry of history) {
    if (entry.at > at) break;
    price = entry.price;
  }
  return price;
}

function orderTotal(order: any): number {
  return toNumber(order.totalAmount ?? order.total) ?? 0;
}

/** Adds `settlement` to each restaurant and street food order (others are returned unchanged). */
export async function attachSettlements<T extends Record<string, any>>(orders: T[]): Promise<Array<T & { settlement?: OrderSettlement }>> {
  const relevant = orders.filter((o) => SETTLED_TYPES.has(o.orderType));
  const ids = relevant.flatMap((o) => (Array.isArray(o.items) ? o.items : []).map(itemIdOf)).filter(Boolean) as string[];
  const history = await loadPriceHistory(ids);

  return orders.map((order) => {
    if (!SETTLED_TYPES.has(order.orderType)) return order;
    const placedAt = new Date(order.createdAt || Date.now()).getTime();
    let restaurantBill = 0;
    let missingPrices = 0;
    for (const item of Array.isArray(order.items) ? order.items : []) {
      const quantity = toNumber(item?.quantity) ?? 1;
      const price = priceAt(history.get(itemIdOf(item) || ""), placedAt);
      if (price === null) missingPrices += 1;
      else restaurantBill += price * quantity;
    }
    const settlement = settleOrder({
      customerTotal: orderTotal(order),
      isCod: order.paymentMethod === "cod",
      restaurantBill: Math.round(restaurantBill * 100) / 100,
      missingPrices,
      restaurantName: order.provider?.businessName,
    });
    return { ...order, settlement };
  });
}

/** Start and end (UTC) of a day in India, given as YYYY-MM-DD. */
function istDayRange(date: string): { from: Date; to: Date } {
  const [y, m, d] = date.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, d) - 5.5 * 60 * 60 * 1000);
  return { from, to: new Date(from.getTime() + 24 * 60 * 60 * 1000) };
}

const orderRelations = {
  provider: { columns: { id: true, businessName: true } },
  rider: { columns: { id: true, username: true, phone: true } },
  user: { columns: { id: true, username: true } },
} as const;

/** Restaurant and street food orders picked up by a partner on this day (India time). */
async function pickedUpOrdersOn(date: string, riderId?: string) {
  const { from, to } = istDayRange(date);
  const whereFor = (table: typeof restaurantOrders | typeof streetFoodOrders) => {
    const when = sql`coalesce(${table.pickedUpAt}, ${table.deliveredAt}, ${table.createdAt})`;
    return and(
      riderId ? eq(table.riderId, riderId) : isNotNull(table.riderId),
      inArray(table.status, PICKED_UP_STATUSES),
      gte(when, from),
      lt(when, to),
    );
  };
  const [restaurant, streetFood] = await Promise.all([
    db.query.restaurantOrders.findMany({ where: whereFor(restaurantOrders), with: orderRelations }),
    db.query.streetFoodOrders.findMany({ where: whereFor(streetFoodOrders), with: orderRelations }),
  ]);
  const combined = [
    ...restaurant.map((o) => ({ ...o, orderType: "restaurant" })),
    ...streetFood.map((o) => ({ ...o, orderType: "street_food" })),
  ];
  const at = (o: any) => new Date(o.pickedUpAt || o.deliveredAt || o.createdAt || 0).getTime();
  combined.sort((a, b) => at(a) - at(b));
  return attachSettlements(combined);
}

/** Only what the settlement screens show, not addresses or OTPs. */
function summaryRow(order: any) {
  return {
    id: order.id,
    orderType: order.orderType,
    status: order.status,
    restaurantName: order.provider?.businessName || "Restaurant",
    customerName: order.user?.username || "Customer",
    paymentMethod: order.paymentMethod,
    pickedUpAt: order.pickedUpAt,
    deliveredAt: order.deliveredAt,
    createdAt: order.createdAt,
    items: (Array.isArray(order.items) ? order.items : []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
    settlement: order.settlement as OrderSettlement,
  };
}

function readDate(value: unknown): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : istToday();
}

export function registerSettlementRoutes(app: Express, mw: { isAdmin: Middleware; isDeliveryPartner: Middleware }) {
  // The signed-in partner's day: each order and the amount to settle.
  app.get("/api/rider/settlement", mw.isDeliveryPartner, async (req: any, res: Response) => {
    try {
      const date = readDate(req.query.date);
      const orders = (await pickedUpOrdersOn(date, req.userId)).map(summaryRow);
      res.json({ date, orders, totals: addUpSettlements(orders.map((o) => o.settlement)) });
    } catch (error: any) {
      console.error("Rider settlement error:", error);
      res.status(500).json({ message: error.message || "Could not load today's settlement" });
    }
  });

  // Every partner's day, for the admin panel.
  app.get("/api/admin/rider-settlements", mw.isAdmin, async (req: any, res: Response) => {
    try {
      const date = readDate(req.query.date);
      const orders = await pickedUpOrdersOn(date);
      const byRider = new Map<string, { riderId: string; riderName: string; riderPhone: string | null; orders: any[] }>();
      for (const order of orders as any[]) {
        const riderId = order.riderId as string;
        if (!byRider.has(riderId)) {
          byRider.set(riderId, {
            riderId,
            riderName: order.rider?.username || "Delivery partner",
            riderPhone: order.rider?.phone || null,
            orders: [],
          });
        }
        byRider.get(riderId)!.orders.push(summaryRow(order));
      }
      const riders = Array.from(byRider.values())
        .map((r) => ({ ...r, totals: addUpSettlements(r.orders.map((o) => o.settlement)) }))
        .sort((a, b) => a.riderName.localeCompare(b.riderName));
      res.json({ date, riders, totals: addUpSettlements(orders.map((o) => o.settlement!)) });
    } catch (error: any) {
      console.error("Admin rider settlements error:", error);
      res.status(500).json({ message: error.message || "Could not load settlements" });
    }
  });

  // Current restaurant price of every dish, by menu item id, for the admin pricing screen.
  app.get("/api/admin/restaurant-prices", mw.isAdmin, async (_req: any, res: Response) => {
    try {
      const rows = await db.select().from(menuItemRestaurantPrices)
        .orderBy(asc(menuItemRestaurantPrices.effectiveFrom), asc(menuItemRestaurantPrices.id));
      const latest: Record<string, number | null> = {};
      for (const row of rows) latest[row.itemId] = toNumber(row.restaurantPrice);
      res.json(latest);
    } catch (error: any) {
      console.error("Get restaurant prices error:", error);
      res.status(500).json({ message: error.message || "Could not load restaurant prices" });
    }
  });

  // Many dishes at once (a whole menu card): [{ itemId, restaurantPrice, customerPrice? }].
  // customerPrice, when given, also changes the price customers pay.
  // An entry with `create` instead of itemId adds a new restaurant dish
  // ({ providerId, name, category, price, imageUrl?, description?, isVeg? }); a dish
  // with the same name at that restaurant is reused, so pasting twice is safe.
  app.post("/api/admin/restaurant-prices/import", mw.isAdmin, async (req: any, res: Response) => {
    try {
      const list = Array.isArray(req.body?.prices) ? req.body.prices : null;
      if (!list || list.length === 0 || list.length > 2000) {
        return res.status(400).json({ message: "Paste the price list you were given" });
      }
      // { rename: { providerId, businessName } } changes a restaurant's name.
      let restaurantsRenamed = 0;
      for (const entry of list) {
        const r = entry?.rename;
        if (!r || typeof r !== "object") continue;
        if (typeof r.providerId !== "string" || typeof r.businessName !== "string" || !r.businessName.trim()) {
          return res.status(400).json({ message: "A rename in the list is missing the restaurant or the new name" });
        }
        const [renamed] = await db.update(serviceProviders).set({ businessName: r.businessName.trim() })
          .where(eq(serviceProviders.id, r.providerId)).returning({ id: serviceProviders.id });
        if (renamed) restaurantsRenamed += 1;
      }

      let dishesAdded = 0;
      for (const entry of list) {
        const c = entry?.create;
        if (!c || typeof c !== "object") continue;
        const price = toNumber(c.price);
        if (typeof c.providerId !== "string" || typeof c.name !== "string" || !c.name.trim() || price === null || price <= 0) {
          return res.status(400).json({ message: "A new dish in the list is missing its restaurant, name or price" });
        }
        // { create: { streetFood: true, ... } } adds the dish to a street food vendor's menu.
        if (c.streetFood === true) {
          const [existingStreet] = await db.select({ id: streetFoodItems.id }).from(streetFoodItems)
            .where(and(eq(streetFoodItems.providerId, c.providerId), eq(streetFoodItems.name, c.name.trim())));
          if (existingStreet) {
            entry.itemId = existingStreet.id;
            continue;
          }
          const [createdStreet] = await db.insert(streetFoodItems).values({
            providerId: c.providerId,
            name: c.name.trim(),
            category: typeof c.category === "string" ? c.category : null,
            description: typeof c.description === "string" ? c.description : null,
            imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : null,
            price: String(price),
            isVeg: c.isVeg !== false,
            isAvailable: true,
          }).returning({ id: streetFoodItems.id });
          entry.itemId = createdStreet.id;
          dishesAdded += 1;
          continue;
        }
        const [existing] = await db.select({ id: restaurantMenuItems.id }).from(restaurantMenuItems)
          .where(and(eq(restaurantMenuItems.providerId, c.providerId), eq(restaurantMenuItems.name, c.name.trim())));
        if (existing) {
          entry.itemId = existing.id;
          continue;
        }
        const [created] = await db.insert(restaurantMenuItems).values({
          providerId: c.providerId,
          name: c.name.trim(),
          category: typeof c.category === "string" ? c.category : null,
          description: typeof c.description === "string" ? c.description : null,
          imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : null,
          price: price.toFixed(2),
          isVeg: c.isVeg !== false,
          isAvailable: true,
        }).returning({ id: restaurantMenuItems.id });
        entry.itemId = created.id;
        dishesAdded += 1;
      }

      // { itemId, remove: true } deletes a dish that is no longer on the menu card.
      // Past orders keep their own copy of the dish name and price.
      let dishesRemoved = 0;
      for (const entry of list) {
        if (entry?.remove !== true || typeof entry?.itemId !== "string") continue;
        const r1 = await db.delete(restaurantMenuItems).where(eq(restaurantMenuItems.id, entry.itemId)).returning({ id: restaurantMenuItems.id });
        const r2 = r1.length ? [] : await db.delete(streetFoodItems).where(eq(streetFoodItems.id, entry.itemId)).returning({ id: streetFoodItems.id });
        if (r1.length || r2.length) dishesRemoved += 1;
      }

      // { itemId, name?, category? } renames a dish or moves it to another category.
      let dishesRenamed = 0;
      for (const entry of list) {
        if (entry?.remove === true || typeof entry?.itemId !== "string") continue;
        const changes: { name?: string; category?: string } = {};
        if (typeof entry?.name === "string" && entry.name.trim()) changes.name = entry.name.trim();
        if (typeof entry?.category === "string" && entry.category.trim()) changes.category = entry.category.trim();
        if (!changes.name && !changes.category) continue;
        const r1 = await db.update(restaurantMenuItems).set(changes).where(eq(restaurantMenuItems.id, entry.itemId)).returning({ id: restaurantMenuItems.id });
        const r2 = r1.length ? [] : await db.update(streetFoodItems).set(changes).where(eq(streetFoodItems.id, entry.itemId)).returning({ id: streetFoodItems.id });
        if (r1.length || r2.length) dishesRenamed += 1;
      }

      // { itemId, imageUrl } sets a dish photo; { itemId, imageFrom: otherItemId }
      // copies the photo of another dish (e.g. from another restaurant).
      let imagesSet = 0;
      for (const entry of list) {
        if (entry?.remove === true || typeof entry?.itemId !== "string") continue;
        let imageUrl = typeof entry?.imageUrl === "string" ? entry.imageUrl.trim() : "";
        if (!imageUrl && typeof entry?.imageFrom === "string") {
          const [a] = await db.select({ u: restaurantMenuItems.imageUrl }).from(restaurantMenuItems).where(eq(restaurantMenuItems.id, entry.imageFrom));
          const [b] = a?.u ? [] : await db.select({ u: streetFoodItems.imageUrl }).from(streetFoodItems).where(eq(streetFoodItems.id, entry.imageFrom));
          imageUrl = (a?.u || b?.u || "").trim();
        }
        if (!imageUrl) continue;
        const r1 = await db.update(restaurantMenuItems).set({ imageUrl }).where(eq(restaurantMenuItems.id, entry.itemId)).returning({ id: restaurantMenuItems.id });
        const r2 = r1.length ? [] : await db.update(streetFoodItems).set({ imageUrl }).where(eq(streetFoodItems.id, entry.itemId)).returning({ id: streetFoodItems.id });
        if (r1.length || r2.length) imagesSet += 1;
      }

      // { itemId, clearRestaurantPrice: true, customerPrice? } undoes a wrong entry:
      // the dish loses its restaurant price (partner asks at the counter again).
      let restaurantPricesCleared = 0;
      let clearedCustomerPrices = 0;
      for (const entry of list) {
        if (entry?.clearRestaurantPrice !== true || typeof entry?.itemId !== "string") continue;
        await db.delete(menuItemRestaurantPrices).where(eq(menuItemRestaurantPrices.itemId, entry.itemId));
        restaurantPricesCleared += 1;
        const customerPrice = toNumber(entry?.customerPrice);
        if (customerPrice !== null && customerPrice > 0) {
          const [r] = await db.update(restaurantMenuItems).set({ price: customerPrice.toFixed(2) })
            .where(eq(restaurantMenuItems.id, entry.itemId)).returning({ id: restaurantMenuItems.id });
          if (!r) await db.update(streetFoodItems).set({ price: String(customerPrice) }).where(eq(streetFoodItems.id, entry.itemId));
          clearedCustomerPrices += 1;
        }
      }

      const wanted = new Map<string, number>();
      const customerPrices = new Map<string, number>();
      for (const entry of list) {
        if (typeof entry?.itemId !== "string" || entry?.clearRestaurantPrice === true || entry?.remove === true) continue;
        const price = toNumber(entry?.restaurantPrice);
        if (price !== null && price >= 0) wanted.set(entry.itemId, price);
        const customerPrice = toNumber(entry?.customerPrice);
        if (customerPrice !== null && customerPrice > 0) customerPrices.set(entry.itemId, customerPrice);
      }
      const ids = Array.from(wanted.keys());
      if (ids.length === 0) {
        if (restaurantsRenamed > 0 || restaurantPricesCleared > 0 || dishesRemoved > 0 || dishesRenamed > 0 || imagesSet > 0) {
          return res.json({ imagesSet, restaurantsRenamed, restaurantPricesCleared, dishesRemoved, dishesRenamed, dishesAdded, customerPricesChanged: clearedCustomerPrices, saved: 0, unchanged: 0, notFound: 0 });
        }
        return res.status(400).json({ message: "No valid prices in the list" });
      }

      const [restaurantRows, streetRows] = await Promise.all([
        db.select({ id: restaurantMenuItems.id }).from(restaurantMenuItems).where(inArray(restaurantMenuItems.id, ids)),
        db.select({ id: streetFoodItems.id }).from(streetFoodItems).where(inArray(streetFoodItems.id, ids)),
      ]);
      const known = new Set([...restaurantRows, ...streetRows].map((r) => r.id));
      const history = await loadPriceHistory(ids);
      const now = new Date();
      const rows = ids
        .filter((id) => known.has(id))
        .filter((id) => {
          const h = history.get(id);
          return !h || h[h.length - 1].price !== wanted.get(id);
        })
        .map((id) => ({ itemId: id, restaurantPrice: wanted.get(id)!.toFixed(2), effectiveFrom: now }));
      if (rows.length > 0) await db.insert(menuItemRestaurantPrices).values(rows);

      const restaurantIds = new Set(restaurantRows.map((r) => r.id));
      let customerPricesChanged = 0;
      for (const [id, price] of Array.from(customerPrices.entries())) {
        if (!known.has(id)) continue;
        if (restaurantIds.has(id)) {
          await db.update(restaurantMenuItems).set({ price: price.toFixed(2) }).where(eq(restaurantMenuItems.id, id));
        } else {
          await db.update(streetFoodItems).set({ price: String(price) }).where(eq(streetFoodItems.id, id));
        }
        customerPricesChanged += 1;
      }

      res.json({
        imagesSet,
        dishesRemoved,
        dishesRenamed,
        restaurantsRenamed,
        restaurantPricesCleared,
        dishesAdded,
        customerPricesChanged: customerPricesChanged + clearedCustomerPrices,
        saved: rows.length,
        unchanged: ids.filter((id) => known.has(id)).length - rows.length,
        notFound: ids.filter((id) => !known.has(id)).length,
      });
    } catch (error: any) {
      console.error("Import restaurant prices error:", error);
      res.status(500).json({ message: error.message || "Could not import prices" });
    }
  });

  // Set what Shirur Express pays the restaurant for a dish from now on.
  // An empty value removes the dish's restaurant price completely (for a mistake).
  app.patch("/api/admin/menu-items/:itemId/restaurant-price", mw.isAdmin, async (req: any, res: Response) => {
    try {
      const { itemId } = req.params;
      const raw = req.body?.restaurantPrice;
      const clear = raw === null || raw === undefined || raw === "";
      const price = clear ? null : toNumber(raw);
      if (!clear && (price === null || price < 0)) {
        return res.status(400).json({ message: "Enter a valid price" });
      }
      const [restaurantItem] = await db.select({ id: restaurantMenuItems.id }).from(restaurantMenuItems).where(eq(restaurantMenuItems.id, itemId));
      const [streetItem] = restaurantItem
        ? [undefined]
        : await db.select({ id: streetFoodItems.id }).from(streetFoodItems).where(eq(streetFoodItems.id, itemId));
      if (!restaurantItem && !streetItem) return res.status(404).json({ message: "Menu item not found" });

      if (price === null) {
        await db.delete(menuItemRestaurantPrices).where(eq(menuItemRestaurantPrices.itemId, itemId));
      } else {
        const [current] = await db.select().from(menuItemRestaurantPrices)
          .where(eq(menuItemRestaurantPrices.itemId, itemId))
          .orderBy(desc(menuItemRestaurantPrices.effectiveFrom), desc(menuItemRestaurantPrices.id))
          .limit(1);
        if (toNumber(current?.restaurantPrice) !== price) {
          await db.insert(menuItemRestaurantPrices).values({ itemId, restaurantPrice: price.toFixed(2), effectiveFrom: new Date() });
        }
      }
      res.json({ itemId, restaurantPrice: price });
    } catch (error: any) {
      console.error("Set restaurant price error:", error);
      res.status(500).json({ message: error.message || "Could not save restaurant price" });
    }
  });
}
