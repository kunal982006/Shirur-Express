// Live order status for customers, like Blinkit / Swiggy: one pinned notification per order on
// the customer's Android phone that changes as the order moves
// (accepted → preparing → ready → out for delivery with arrival time → delivered).
//
// The Android app (MyFirebaseMessagingService, type ORDER_STATUS) keeps the notification pinned
// until the order is delivered. Older app versions show each status change as a normal
// notification instead, so the frequent arrival-time refreshes go only to phones whose app said
// it can show the pinned notification (see markLiveStatusCapable).

import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { sendPushNotification } from "./firebase";
import { isApnsToken } from "./apns";
import { groceryOrders, restaurantOrders, streetFoodOrders } from "@shared/schema";
import { parseDeliveryAddress } from "@shared/delivery-address";

type OrderType = "grocery" | "restaurant" | "street_food";
const TABLES = { grocery: groceryOrders, restaurant: restaurantOrders, street_food: streetFoodOrders } as const;

const isOrderType = (t: unknown): t is OrderType => t === "grocery" || t === "restaurant" || t === "street_food";

// ---------- arrival time ----------

const AVG_SPEED_KMH = 18;   // town traffic on a bike
const ROAD_FACTOR = 1.35;   // roads are longer than the straight line
const HANDOVER_MIN = 2;     // parking, finding the door, handing over
const LOCATION_FRESH_MS = 5 * 60 * 1000;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Minutes until the rider reaches the customer, from the rider's last location and the customer's map pin. */
export function estimateArrivalMinutes(
  rider: { lat: number; lng: number },
  deliveryAddress: string | null | undefined,
): number | null {
  const { pin } = parseDeliveryAddress(deliveryAddress);
  if (!pin) return null;
  const km = distanceKm(rider, pin) * ROAD_FACTOR;
  return Math.max(1, Math.round((km / AVG_SPEED_KMH) * 60 + HANDOVER_MIN));
}

/** The rider's last known position, or null when it is missing or older than 5 minutes. */
async function freshRiderPosition(riderUserId: string | null | undefined): Promise<{ lat: number; lng: number } | null> {
  if (!riderUserId) return null;
  const partner: any = await storage.getDeliveryPartnerByUserId(riderUserId);
  if (!partner?.currentLatitude || !partner?.currentLongitude) return null;
  const updated = partner.lastLocationUpdate ? new Date(partner.lastLocationUpdate).getTime() : 0;
  if (!updated || Date.now() - updated > LOCATION_FRESH_MS) return null;
  const lat = Number(partner.currentLatitude);
  const lng = Number(partner.currentLongitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export async function arrivalMinutesForOrder(order: any): Promise<number | null> {
  if (order?.status !== "out_for_delivery") return null;
  const pos = await freshRiderPosition(order.riderId);
  return pos ? estimateArrivalMinutes(pos, order.deliveryAddress) : null;
}

// ---------- wording ----------

const STEPS = ["accepted", "preparing", "ready_for_pickup", "out_for_delivery", "delivered"] as const;

function stepOf(status: string): number {
  if (status === "assigned" || status === "arrived_at_pickup") return 3; // still "ready", rider on the way to the shop
  const i = STEPS.indexOf(status as any);
  return i >= 0 ? i + 1 : 0;
}

function describe(status: string, shop: string, eta: number | null): { title: string; body: string } | null {
  switch (status) {
    case "accepted":
      return { title: `${shop} accepted your order`, body: "Your order is confirmed." };
    case "preparing":
      return { title: `${shop} is preparing your order`, body: "We'll let you know when it's ready." };
    case "ready_for_pickup":
    case "assigned":
    case "arrived_at_pickup":
      return { title: "Your order is ready", body: "A delivery partner will pick it up shortly." };
    case "out_for_delivery":
      return {
        title: eta ? `Arriving in ${eta} min` : "Your order is on the way",
        body: eta ? "Your delivery partner is on the way." : "Your delivery partner has picked up your order.",
      };
    case "delivered":
      return { title: "Order delivered", body: "Enjoy your order! Thank you for ordering with Shirur Express." };
    case "cancelled":
    case "declined":
      return { title: "Order cancelled", body: "Your order was cancelled. Any amount paid will be refunded." };
    default:
      return null;
  }
}

// ---------- which phones can show the pinned notification ----------

// Tokens whose Android app reported it can show the pinned live-status notification.
// Kept in memory: the app reports it again every time it is opened.
const liveStatusTokens = new Set<string>();
export function markLiveStatusCapable(token: string) {
  if (token) liveStatusTokens.add(token);
}

function customerTokens(user: any): string[] {
  const list: string[] = [];
  if (Array.isArray(user?.fcmTokens)) list.push(...user.fcmTokens);
  else if (user?.fcmToken) list.push(user.fcmToken);
  return Array.from(new Set(list.filter(Boolean)));
}

// Last arrival time sent per order, so the rider's location pings don't resend the same minute.
const lastEtaSent = new Map<string, number>();
// Last status step sent per order: assigning a rider or a repeated update doesn't ring the customer twice.
const lastStepSent = new Map<string, string>();

async function send(order: any, orderType: OrderType, status: string, eta: number | null, etaRefreshOnly: boolean) {
  if (!order?.userId) return;
  const user = await storage.getUser(order.userId);
  const tokens = customerTokens(user);
  if (!tokens.length) return;

  const provider = order.providerId ? await storage.getServiceProvider(order.providerId) : null;
  const shop = orderType === "grocery" ? (provider?.businessName || "The store") : (provider?.businessName || "The restaurant");
  const text = describe(status, shop, eta);
  if (!text) return;

  const final = ["delivered", "cancelled", "declined"].includes(status);
  // Numbers for the notification's "Call restaurant" / "Call rider" buttons (only while it's useful).
  const shopPhone = !final ? (provider?.user?.phone || "") : "";
  const riderPhone = !final && order.riderId ? ((await storage.getUser(order.riderId))?.phone || "") : "";
  for (const token of tokens) {
    if (isApnsToken(token)) {
      // iPhones get a normal notification on each status change (no pinned one).
      if (!etaRefreshOnly) {
        await sendPushNotification(token, {
          type: "ORDER_UPDATE",
          title: text.title,
          body: text.body,
          data: { orderId: order.id, orderType, navigateTo: `/order/${order.id}/track` },
        }).catch(() => {});
      }
      continue;
    }
    if (etaRefreshOnly && !liveStatusTokens.has(token)) continue;
    await sendPushNotification(token, {
      type: "ORDER_STATUS",
      title: text.title,
      body: text.body,
      data: {
        orderId: order.id,
        orderType,
        status,
        step: String(stepOf(status)),
        steps: String(STEPS.length),
        etaMinutes: eta ? String(eta) : "",
        shopName: shop,
        shopPhone,
        riderPhone,
        final: final ? "1" : "0",
        // Status changes make a sound; arrival-time refreshes update silently.
        alert: etaRefreshOnly ? "0" : "1",
        navigateTo: `/order/${order.id}/track`,
      },
    }).catch(() => {});
  }
}

/** Called on every order status change (from broadcastOrderUpdate). Never throws. */
export async function pushOrderStatusToCustomer(p: { orderId: string; orderType?: string; status: string }) {
  try {
    if (!isOrderType(p.orderType)) return;
    const table = TABLES[p.orderType];
    const [order] = await db.select().from(table).where(eq(table.id, p.orderId)).limit(1);
    if (!order) return;
    const status = (order as any).status || p.status;
    const stepKey = ["cancelled", "declined"].includes(status) ? "cancelled" : String(stepOf(status));
    if (stepKey === "0" || lastStepSent.get(p.orderId) === stepKey) return;
    lastStepSent.set(p.orderId, stepKey);
    if (lastStepSent.size > 5000) lastStepSent.delete(lastStepSent.keys().next().value as string);
    const eta = await arrivalMinutesForOrder(order);
    if (eta) lastEtaSent.set(p.orderId, eta);
    if (["delivered", "cancelled", "declined"].includes(status)) lastEtaSent.delete(p.orderId);
    await send(order, p.orderType, status, eta, false);
  } catch (err: any) {
    console.error("[Order Status Push]", err?.message || err);
  }
}

/** Called when a rider's location updates: refreshes the arrival time on their customers' phones. */
export async function refreshArrivalTimesForRider(riderUserId: string) {
  try {
    const pos = await freshRiderPosition(riderUserId);
    if (!pos) return;
    for (const orderType of Object.keys(TABLES) as OrderType[]) {
      const table = TABLES[orderType];
      const orders = await db.select().from(table)
        .where(and(eq(table.riderId, riderUserId), eq(table.status, "out_for_delivery")));
      for (const order of orders as any[]) {
        const eta = estimateArrivalMinutes(pos, order.deliveryAddress);
        if (!eta || lastEtaSent.get(order.id) === eta) continue;
        lastEtaSent.set(order.id, eta);
        await send(order, orderType, "out_for_delivery", eta, true);
      }
    }
  } catch (err: any) {
    console.error("[Arrival Time Push]", err?.message || err);
  }
}
