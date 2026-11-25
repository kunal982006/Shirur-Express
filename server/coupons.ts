// Coupon codes, e.g. a ₹500 food coupon for a creator collaboration.
//
// The checkout sends the code with the order. The server checks it, takes the discount off the
// order total and records who used it. Each person can use a coupon once; a coupon can also be
// limited to a number of uses in total, an expiry date and order types (food / grocery).
// If the customer leaves the online payment, the coupon is given back (see releaseCouponForOrder).

import type { Express, Response } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { coupons, couponRedemptions, users } from "@shared/schema";

type Middleware = (req: any, res: Response, next: () => void) => unknown;
export type CouponOrderType = "restaurant" | "street_food" | "grocery";

const ORDER_TYPES: CouponOrderType[] = ["restaurant", "street_food", "grocery"];

/** Creates the coupon tables when they are missing (same approach as the other startup tables). */
export async function ensureCouponTables() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      label TEXT,
      discount_type TEXT NOT NULL DEFAULT 'flat',
      value DECIMAL(10,2) NOT NULL,
      max_discount DECIMAL(10,2),
      min_order DECIMAL(10,2) NOT NULL DEFAULT 0,
      order_types TEXT[],
      max_uses INTEGER,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id TEXT PRIMARY KEY,
      coupon_id TEXT NOT NULL,
      user_id VARCHAR NOT NULL,
      order_type TEXT NOT NULL,
      order_id TEXT,
      discount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_once ON coupon_redemptions(coupon_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_order ON coupon_redemptions(order_id);
  `);
}

export const normalizeCode = (code: unknown) =>
  typeof code === "string" ? code.trim().toUpperCase().replace(/\s+/g, "") : "";

const money = (n: number) => Math.round(n * 100) / 100;

/** Discount for an order of `orderTotal` under this coupon's rule (never more than the total). */
export function discountFor(coupon: { discountType: string; value: string | number; maxDiscount: string | number | null }, orderTotal: number) {
  const value = Number(coupon.value) || 0;
  let discount = coupon.discountType === "percent" ? (orderTotal * value) / 100 : value;
  if (coupon.maxDiscount != null && Number(coupon.maxDiscount) > 0) discount = Math.min(discount, Number(coupon.maxDiscount));
  return money(Math.max(0, Math.min(discount, orderTotal)));
}

class CouponError extends Error {}

/** Checks a code for this customer and order. Throws CouponError with a message for the customer. */
async function findUsableCoupon(code: string, userId: string, orderType: CouponOrderType, orderTotal: number) {
  if (!code) throw new CouponError("Enter a coupon code.");
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  if (!coupon || !coupon.isActive) throw new CouponError("This coupon code is not valid.");
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) throw new CouponError("This coupon has expired.");
  if (coupon.orderTypes && coupon.orderTypes.length > 0 && !coupon.orderTypes.includes(orderType)) {
    throw new CouponError(coupon.orderTypes.includes("grocery") ? "This coupon is for grocery orders only." : "This coupon is for food orders only.");
  }
  const [used] = await db.select({ id: couponRedemptions.id }).from(couponRedemptions)
    .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.userId, userId))).limit(1);
  if (used) throw new CouponError("You have already used this coupon.");
  if (coupon.maxUses != null && (coupon.usedCount ?? 0) >= coupon.maxUses) throw new CouponError("This coupon has already been used.");
  const minOrder = Number(coupon.minOrder) || 0;
  if (orderTotal < minOrder) throw new CouponError(`This coupon needs an order of at least ₹${minOrder}.`);
  return coupon;
}

/**
 * Reserves the coupon for an order that is about to be created. Returns the discount and a
 * `attach(orderId)` to link the order once it exists, and `release()` if creating it fails.
 */
export async function reserveCoupon(rawCode: unknown, userId: string, orderType: CouponOrderType, orderTotal: number) {
  const code = normalizeCode(rawCode);
  const coupon = await findUsableCoupon(code, userId, orderType, orderTotal);
  const discount = discountFor(coupon, orderTotal);
  if (discount <= 0) throw new CouponError("This coupon gives no discount on this order.");

  // Count the use only while uses are left (two people using the last one at the same time).
  const [counted] = await db.update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1` })
    .where(and(eq(coupons.id, coupon.id), sql`(${coupons.maxUses} IS NULL OR ${coupons.usedCount} < ${coupons.maxUses})`))
    .returning({ id: coupons.id });
  if (!counted) throw new CouponError("This coupon has already been used.");

  let redemptionId: string;
  try {
    const [row] = await db.insert(couponRedemptions)
      .values({ couponId: coupon.id, userId, orderType, discount: discount.toFixed(2) })
      .returning({ id: couponRedemptions.id });
    redemptionId = row.id;
  } catch {
    await db.update(coupons).set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` }).where(eq(coupons.id, coupon.id));
    throw new CouponError("You have already used this coupon.");
  }

  return {
    code,
    discount,
    attach: (orderId: string) =>
      db.update(couponRedemptions).set({ orderId }).where(eq(couponRedemptions.id, redemptionId)),
    release: async () => {
      await db.delete(couponRedemptions).where(eq(couponRedemptions.id, redemptionId));
      await db.update(coupons).set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` }).where(eq(coupons.id, coupon.id));
    },
  };
}

export const isCouponError = (err: unknown): err is CouponError => err instanceof CouponError;

/** Gives the coupon back when an unpaid order is cancelled (customer left the payment). Never throws. */
export async function releaseCouponForOrder(orderId: string) {
  try {
    const removed = await db.delete(couponRedemptions).where(eq(couponRedemptions.orderId, orderId))
      .returning({ couponId: couponRedemptions.couponId });
    for (const r of removed) {
      await db.update(coupons).set({ usedCount: sql`GREATEST(${coupons.usedCount} - 1, 0)` }).where(eq(coupons.id, r.couponId));
    }
  } catch (err: any) {
    console.error("[Coupons] Release failed:", err?.message || err);
  }
}

export function registerCouponRoutes(app: Express, mw: { isLoggedIn: Middleware; isAdmin: Middleware }) {
  // Checkout: does this code work for me, and what does it take off? (The order route checks again.)
  app.post("/api/coupons/check", mw.isLoggedIn, async (req: any, res: Response) => {
    try {
      const orderType = ORDER_TYPES.includes(req.body?.orderType) ? req.body.orderType as CouponOrderType : null;
      const total = Number(req.body?.total);
      if (!orderType || !Number.isFinite(total) || total <= 0) return res.status(400).json({ message: "Add items to your cart first." });
      const coupon = await findUsableCoupon(normalizeCode(req.body?.code), req.userId, orderType, total);
      res.json({
        code: coupon.code,
        label: coupon.label,
        discountType: coupon.discountType,
        value: Number(coupon.value),
        maxDiscount: coupon.maxDiscount == null ? null : Number(coupon.maxDiscount),
        minOrder: Number(coupon.minOrder) || 0,
        discount: discountFor(coupon, total),
      });
    } catch (err: any) {
      if (isCouponError(err)) return res.status(400).json({ message: err.message });
      console.error("Coupon check error:", err);
      res.status(500).json({ message: "Could not check the coupon. Try again." });
    }
  });

  // Admin: every coupon with who used it.
  app.get("/api/admin/coupons", mw.isAdmin, async (_req: any, res: Response) => {
    try {
      const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
      const uses = await db.select({
        couponId: couponRedemptions.couponId,
        orderType: couponRedemptions.orderType,
        orderId: couponRedemptions.orderId,
        discount: couponRedemptions.discount,
        createdAt: couponRedemptions.createdAt,
        username: users.username,
        phone: users.phone,
      }).from(couponRedemptions).leftJoin(users, eq(couponRedemptions.userId, users.id))
        .orderBy(desc(couponRedemptions.createdAt));
      res.json(list.map((c) => ({ ...c, uses: uses.filter((u) => u.couponId === c.id) })));
    } catch (err: any) {
      console.error("List coupons error:", err);
      res.status(500).json({ message: err.message || "Could not load coupons" });
    }
  });

  app.post("/api/admin/coupons", mw.isAdmin, async (req: any, res: Response) => {
    try {
      const b = req.body || {};
      const code = normalizeCode(b.code);
      const value = Number(b.value);
      const discountType = b.discountType === "percent" ? "percent" : "flat";
      if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return res.status(400).json({ message: "Code: 3 to 30 letters or numbers, no spaces." });
      if (!Number.isFinite(value) || value <= 0 || (discountType === "percent" && value > 100)) {
        return res.status(400).json({ message: "Enter a valid discount." });
      }
      const orderTypes = Array.isArray(b.orderTypes) ? b.orderTypes.filter((t: any) => ORDER_TYPES.includes(t)) : [];
      const maxUses = b.maxUses === "" || b.maxUses == null ? null : Math.floor(Number(b.maxUses));
      if (maxUses !== null && (!Number.isFinite(maxUses) || maxUses < 1)) return res.status(400).json({ message: "Uses allowed must be 1 or more." });
      const expiresAt = b.expiresAt ? new Date(`${b.expiresAt}T23:59:59+05:30`) : null;
      if (expiresAt && Number.isNaN(expiresAt.getTime())) return res.status(400).json({ message: "Enter a valid expiry date." });
      const maxDiscount = b.maxDiscount === "" || b.maxDiscount == null ? null : Number(b.maxDiscount);
      const minOrder = Number(b.minOrder) || 0;

      const [exists] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code)).limit(1);
      if (exists) return res.status(400).json({ message: "This code already exists. Pick another." });

      const [created] = await db.insert(coupons).values({
        code,
        label: typeof b.label === "string" && b.label.trim() ? b.label.trim().slice(0, 120) : null,
        discountType,
        value: value.toFixed(2),
        maxDiscount: maxDiscount && maxDiscount > 0 ? maxDiscount.toFixed(2) : null,
        minOrder: minOrder.toFixed(2),
        orderTypes: orderTypes.length ? orderTypes : null,
        maxUses,
        expiresAt,
      }).returning();
      res.status(201).json(created);
    } catch (err: any) {
      console.error("Create coupon error:", err);
      res.status(500).json({ message: err.message || "Could not create the coupon" });
    }
  });

  // Turn a coupon on or off.
  app.patch("/api/admin/coupons/:id", mw.isAdmin, async (req: any, res: Response) => {
    try {
      const [updated] = await db.update(coupons).set({ isActive: req.body?.isActive !== false })
        .where(eq(coupons.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Coupon not found" });
      res.json(updated);
    } catch (err: any) {
      console.error("Update coupon error:", err);
      res.status(500).json({ message: err.message || "Could not update the coupon" });
    }
  });
}
