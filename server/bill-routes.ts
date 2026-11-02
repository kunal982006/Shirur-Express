// server/bill-routes.ts
// Bills that admins and delivery partners create and print on the
// Bluetooth thermal printer from the Android app.

import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { deliveryBills, type DeliveryBill } from "@shared/schema";

interface BillRequest extends Request {
  billUser?: { id: string; name: string; role: "admin" | "delivery_partner" };
}

// Admins and registered delivery partners can create bills.
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

export function registerBillRoutes(app: Express) {
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
      const condition =
        user.role === "admin"
          ? eq(deliveryBills.id, req.params.id)
          : and(eq(deliveryBills.id, req.params.id), eq(deliveryBills.createdByUserId, user.id));
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
