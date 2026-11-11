// server/bill-routes.ts
// Bills that admins and delivery partners create and print on the
// Bluetooth thermal printer from the Android app.

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { and, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import {
  bookings, deliveryBills, groceryOrders, groceryProducts, invoices, restaurantMenuItems,
  restaurantOrders, serviceProviders, streetFoodItems, streetFoodOrders, users,
  type BillDetails, type BillItem, type DeliveryBill,
} from "@shared/schema";
import { displayDeliveryAddress } from "@shared/delivery-address";

interface BillRequest extends Request {
  billUser?: { id: string; name: string; role: "admin" | "delivery_partner" | "provider" };
}

// Admins, registered delivery partners and service providers
// (electricians, plumbers, ...) can create bills.
async function canCreateBills(req: BillRequest, res: Response, next: NextFunction) {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: "You are not logged in." });

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "You are not logged in." });

  if (user.role === "admin") {
    req.billUser = { id: user.id, name: user.username, role: "admin" };
    return next();
  }
  const partner = await storage.getDeliveryPartnerByUserId(user.id);
  if (partner) {
    req.billUser = { id: user.id, name: user.username, role: "delivery_partner" };
    return next();
  }
  const provider = await storage.getProviderByUserId(user.id);
  if (provider) {
    req.billUser = { id: user.id, name: provider.businessName || user.username, role: "provider" };
    return next();
  }
  return res.status(403).json({ message: "Only admins and delivery partners can create bills." });
}

const money = z.coerce.number().min(0).max(1_000_000);

const createBillSchema = z.object({
  orderRef: z.string().trim().max(60).optional().nullable(),
  customerName: z.string().trim().max(80).optional().nullable(),
  customerPhone: z.string().trim().max(20).optional().nullable(),
  customerAddress: z.string().trim().max(200).optional().nullable(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Item name is required").max(60),
        quantity: z.coerce.number().positive().max(10_000),
        price: money,
      }),
    )
    .min(1, "Add at least one item")
    .max(50),
  deliveryCharge: money.default(0),
  discount: money.default(0),
  paymentMode: z.enum(["cash", "upi", "online", "pending"]).default("cash"),
  note: z.string().trim().max(200).optional().nullable(),
});

const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatBillNumber(n: number) {
  return `SE-${String(n).padStart(6, "0")}`;
}

function toResponse(bill: DeliveryBill) {
  return { ...bill, billNo: formatBillNumber(bill.billNumber) };
}

// ---------- bills generated from app orders ----------

const ORDER_TYPES = ["grocery", "restaurant", "street_food", "booking"] as const;
type OrderType = (typeof ORDER_TYPES)[number];

const fromOrderSchema = z.object({
  orderType: z.enum(ORDER_TYPES),
  orderId: z.string().trim().min(1).max(100),
});

const ORDER_LABELS: Record<Exclude<OrderType, "booking">, string> = {
  grocery: "Grocery Delivery",
  restaurant: "Food Delivery",
  street_food: "Street Food Delivery",
};

class BillSourceError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type BillDraft = {
  orderRef: string;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  items: BillItem[];
  total: number;
  paymentMode: "cash" | "upi" | "online" | "pending";
  details: BillDetails;
};

const shortId = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
const iso = (d: Date | null | undefined) => (d ? new Date(d).toISOString() : undefined);
const toNum = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const titleCase = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Name-lookup for item ids, for orders that only stored the product id. */
async function nameMap(table: typeof groceryProducts | typeof streetFoodItems | typeof restaurantMenuItems, ids: string[]) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return new Map<string, string>();
  const rows = await db.select({ id: table.id, name: table.name }).from(table).where(inArray(table.id, unique));
  return new Map(rows.map((r) => [r.id, r.name]));
}

async function loadCustomer(userId: string) {
  const [u] = await db.select({ username: users.username, phone: users.phone }).from(users).where(eq(users.id, userId));
  return u;
}

async function loadStoreName(providerId: string | null | undefined) {
  if (!providerId) return undefined;
  const [p] = await db
    .select({ businessName: serviceProviders.businessName })
    .from(serviceProviders)
    .where(eq(serviceProviders.id, providerId));
  return p?.businessName || undefined;
}

/** Reads a delivered order and checks the caller is allowed to bill it. */
async function draftFromDeliveryOrder(type: Exclude<OrderType, "booking">, orderId: string, user: NonNullable<BillRequest["billUser"]>): Promise<BillDraft> {
  const order: any =
    type === "grocery"
      ? await db.query.groceryOrders.findFirst({ where: eq(groceryOrders.id, orderId) })
      : type === "street_food"
        ? await db.query.streetFoodOrders.findFirst({ where: eq(streetFoodOrders.id, orderId) })
        : await db.query.restaurantOrders.findFirst({ where: eq(restaurantOrders.id, orderId) });
  if (!order) throw new BillSourceError(404, "Order not found.");

  if (user.role !== "admin" && order.riderId !== user.id) {
    throw new BillSourceError(403, "This order is not assigned to you.");
  }
  if (order.status !== "delivered") {
    throw new BillSourceError(400, "The bill can be printed after the order is marked delivered.");
  }

  const rawItems: any[] = Array.isArray(order.items) ? order.items : [];
  const idOf = (i: any) => i.productId || i.itemId || i.menuItemId || "";
  const names =
    type === "grocery"
      ? await nameMap(groceryProducts, rawItems.map(idOf))
      : type === "street_food"
        ? await nameMap(streetFoodItems, rawItems.filter((i) => !i.name).map(idOf))
        : await nameMap(restaurantMenuItems, rawItems.filter((i) => !i.name).map(idOf));

  const items: BillItem[] = rawItems
    .map((i) => ({
      name: String(i.name || names.get(idOf(i)) || "Item").slice(0, 60),
      quantity: toNum(i.quantity) || 1,
      price: toNum(i.price),
    }))
    .slice(0, 50);
  if (items.length === 0) throw new BillSourceError(400, "This order has no items to bill.");

  const customer = await loadCustomer(order.userId);
  return {
    orderRef: shortId(order.id),
    customerName: customer?.username || null,
    customerPhone: customer?.phone || null,
    customerAddress: displayDeliveryAddress(order.deliveryAddress) || null,
    items,
    total: toNum(type === "grocery" ? order.total : order.totalAmount),
    // The order is delivered, so cash-on-delivery has been collected.
    paymentMode: order.paymentMethod === "cod" || order.paymentMethod === "cash" ? "cash" : "online",
    details: {
      orderLabel: ORDER_LABELS[type],
      storeName: await loadStoreName(order.providerId),
      orderedAt: iso(order.createdAt),
      completedAt: iso(order.deliveredAt),
      chargesLabel: type === "grocery" ? "Delivery & fees" : "Delivery & taxes",
    },
  };
}

/** Reads a finished service booking (electrician, plumber, ...) and its final bill. */
async function draftFromBooking(bookingId: string, user: NonNullable<BillRequest["billUser"]>): Promise<BillDraft> {
  const booking = await db.query.bookings.findFirst({
    where: eq(bookings.id, bookingId),
    with: { problem: true, serviceOffering: true },
  });
  if (!booking) throw new BillSourceError(404, "Booking not found.");

  if (user.role !== "admin") {
    const provider = await storage.getProviderByUserId(user.id);
    if (!provider || provider.id !== booking.providerId) {
      throw new BillSourceError(403, "This booking is not assigned to you.");
    }
  }
  if (!["pending_payment", "completed"].includes(booking.status || "")) {
    throw new BillSourceError(400, "The bill can be printed after the job is done and the final bill is created.");
  }

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(booking.invoiceId ? eq(invoices.id, booking.invoiceId) : eq(invoices.bookingId, booking.id))
    .orderBy(desc(invoices.createdAt))
    .limit(1);

  const serviceType = titleCase(booking.serviceType || "Home");
  const serviceName =
    (booking.problem as any)?.name || (booking.serviceOffering as any)?.name || `${serviceType} Service`;

  const items: BillItem[] = [];
  let total: number;
  let paymentMode: BillDraft["paymentMode"];
  const cod = (booking.paymentMethod || "cod") === "cod";
  if (invoice) {
    items.push({ name: `Service charge - ${serviceName}`.slice(0, 60), quantity: 1, price: toNum(invoice.serviceCharge) });
    for (const part of invoice.sparePartsDetails || []) {
      items.push({ name: String(part.part || "Spare part").slice(0, 60), quantity: 1, price: toNum(part.cost) });
    }
    total = toNum(invoice.totalAmount);
    paymentMode = invoice.paymentStatus === "paid" ? (cod ? "cash" : "online") : "pending";
  } else {
    // Completed by an admin without a final bill: fall back to the quoted price.
    const price = toNum(booking.estimatedCost) || toNum((booking.serviceOffering as any)?.price);
    if (price <= 0) throw new BillSourceError(400, "This booking has no bill amount yet. Create the final bill first.");
    items.push({ name: serviceName.slice(0, 60), quantity: 1, price });
    total = price;
    paymentMode = cod ? "cash" : "online";
  }

  const customer = await loadCustomer(booking.userId);
  return {
    orderRef: shortId(booking.id),
    customerName: customer?.username || null,
    customerPhone: booking.userPhone || customer?.phone || null,
    customerAddress: displayDeliveryAddress(booking.userAddress) || null,
    items: items.slice(0, 50),
    total,
    paymentMode,
    details: {
      orderLabel: `${serviceType} Service`,
      storeName: await loadStoreName(booking.providerId),
      orderedAt: iso(booking.scheduledAt || booking.createdAt),
      completedAt: iso(invoice?.createdAt),
      chargesLabel: "Other charges",
    },
  };
}

export function registerBillRoutes(app: Express) {
  // Bill straight from an app order or service booking, so nobody types the items.
  // One bill per order: asking again returns the same bill (printed as a duplicate).
  app.post("/api/bills/from-order", canCreateBills, async (req: BillRequest, res: Response) => {
    try {
      const { orderType, orderId } = fromOrderSchema.parse(req.body);
      const user = req.billUser!;
      const findExisting = async () =>
        (await db
          .select()
          .from(deliveryBills)
          .where(and(eq(deliveryBills.sourceType, orderType), eq(deliveryBills.sourceId, orderId)))
          .limit(1))[0];

      // Check access before handing out an existing bill too.
      const draft =
        orderType === "booking"
          ? await draftFromBooking(orderId, user)
          : await draftFromDeliveryOrder(orderType, orderId, user);

      const existing = await findExisting();
      if (existing) return res.json(toResponse(existing));

      const items = draft.items.map((i) => ({ name: i.name, quantity: round2(i.quantity), price: round2(i.price) }));
      const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.price, 0));
      const total = round2(draft.total > 0 ? draft.total : subtotal);
      // Whatever the order total adds on top of the items (delivery, platform fee, taxes)
      // or takes off (offers) is shown separately, so the bill matches what was charged.
      const diff = round2(total - subtotal);

      try {
        const [bill] = await db
          .insert(deliveryBills)
          .values({
            orderRef: draft.orderRef,
            customerName: draft.customerName?.slice(0, 80) || null,
            customerPhone: draft.customerPhone?.slice(0, 20) || null,
            customerAddress: draft.customerAddress?.slice(0, 200) || null,
            items,
            subtotal: subtotal.toFixed(2),
            deliveryCharge: Math.max(diff, 0).toFixed(2),
            discount: Math.max(-diff, 0).toFixed(2),
            total: total.toFixed(2),
            paymentMode: draft.paymentMode,
            createdByUserId: user.id,
            createdByName: user.name,
            createdByRole: user.role,
            sourceType: orderType,
            sourceId: orderId,
            details: draft.details,
          })
          .returning();
        res.status(201).json(toResponse(bill));
      } catch (error: any) {
        // Two taps at once: the other request already made the bill.
        if (error?.code === "23505") {
          const bill = await findExisting();
          if (bill) return res.json(toResponse(bill));
        }
        throw error;
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order." });
      }
      if (error instanceof BillSourceError) {
        return res.status(error.status).json({ message: error.message });
      }
      console.error("[Bills] From order failed:", error);
      res.status(500).json({ message: "Could not make the bill. Please try again." });
    }
  });

  // Create a bill. Totals are always calculated here, never trusted from the phone.
  app.post("/api/bills", canCreateBills, async (req: BillRequest, res: Response) => {
    try {
      const data = createBillSchema.parse(req.body);
      const items = data.items.map((i) => ({
        name: i.name,
        quantity: round2(i.quantity),
        price: round2(i.price),
      }));
      const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.price, 0));
      const deliveryCharge = round2(data.deliveryCharge);
      const discount = round2(data.discount);
      const total = round2(subtotal + deliveryCharge - discount);
      if (total < 0) {
        return res.status(400).json({ message: "Discount cannot be more than the bill amount." });
      }

      const [bill] = await db
        .insert(deliveryBills)
        .values({
          orderRef: data.orderRef || null,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          customerAddress: data.customerAddress || null,
          items,
          subtotal: subtotal.toFixed(2),
          deliveryCharge: deliveryCharge.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          paymentMode: data.paymentMode,
          note: data.note || null,
          createdByUserId: req.billUser!.id,
          createdByName: req.billUser!.name,
          createdByRole: req.billUser!.role,
        })
        .returning();

      res.status(201).json(toResponse(bill));
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid bill details." });
      }
      console.error("[Bills] Create failed:", error);
      res.status(500).json({ message: "Could not save the bill. Please try again." });
    }
  });

  // Recent bills: admins see everyone's, delivery partners see only their own.
  app.get("/api/bills", canCreateBills, async (req: BillRequest, res: Response) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const user = req.billUser!;
      const rows = await db
        .select()
        .from(deliveryBills)
        .where(user.role === "admin" ? undefined : eq(deliveryBills.createdByUserId, user.id))
        .orderBy(desc(deliveryBills.createdAt))
        .limit(limit);
      res.json(rows.map(toResponse));
    } catch (error) {
      console.error("[Bills] List failed:", error);
      res.status(500).json({ message: "Could not load bills." });
    }
  });

  // Count a print (first print or a reprint) so admins can spot duplicate copies.
  app.post("/api/bills/:id/printed", canCreateBills, async (req: BillRequest, res: Response) => {
    try {
      const user = req.billUser!;
      // Order bills are shared (rider, provider and admin may each print one),
      // and access was checked when the bill was fetched.
      const condition =
        user.role === "admin"
          ? eq(deliveryBills.id, req.params.id)
          : and(
              eq(deliveryBills.id, req.params.id),
              or(eq(deliveryBills.createdByUserId, user.id), isNotNull(deliveryBills.sourceId)),
            );
      const [bill] = await db
        .update(deliveryBills)
        .set({ printCount: sql`${deliveryBills.printCount} + 1` })
        .where(condition)
        .returning();
      if (!bill) return res.status(404).json({ message: "Bill not found." });
      res.json(toResponse(bill));
    } catch (error) {
      console.error("[Bills] Mark printed failed:", error);
      res.status(500).json({ message: "Could not update the bill." });
    }
  });
}
