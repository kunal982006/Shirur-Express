import type { Express, RequestHandler } from "express";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "./db";
import { bookings, restaurantOrders, streetFoodOrders } from "@shared/schema";
import { FAST_DELIVERY_MINUTES, FINISHED_BOOKING_STATUSES, type ReviewPromptCandidate } from "@shared/review-prompt";

/**
 * GET /api/review-prompt: the customer's recent orders and bookings that earn a
 * "Rate us on Play Store" popup, newest first. The app shows it once per id.
 */
export function registerReviewPromptRoutes(app: Express, isLoggedIn: RequestHandler) {
  app.get("/api/review-prompt", isLoggedIn, async (req: any, res) => {
    try {
      const userId: string = req.userId;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const bookingsSince = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      const fastFood = (t: typeof restaurantOrders | typeof streetFoodOrders) =>
        db.select({ id: t.id, at: t.deliveredAt }).from(t).where(and(
          eq(t.userId, userId),
          eq(t.status, "delivered"),
          isNotNull(t.deliveredAt),
          gte(t.deliveredAt, since),
          sql`extract(epoch from (${t.deliveredAt} - ${t.createdAt})) < ${FAST_DELIVERY_MINUTES * 60}`,
        )).orderBy(desc(t.deliveredAt)).limit(5);

      const [restaurant, street, done] = await Promise.all([
        fastFood(restaurantOrders),
        fastFood(streetFoodOrders),
        db.select({ id: bookings.id, at: bookings.createdAt }).from(bookings).where(and(
          eq(bookings.userId, userId),
          inArray(bookings.status, FINISHED_BOOKING_STATUSES),
          gte(bookings.createdAt, bookingsSince),
        )).orderBy(desc(bookings.createdAt)).limit(5),
      ]);

      const list = [
        ...restaurant.map((r) => ({ kind: "order" as const, id: r.id, at: r.at })),
        ...street.map((r) => ({ kind: "order" as const, id: r.id, at: r.at })),
        ...done.map((r) => ({ kind: "booking" as const, id: r.id, at: r.at })),
      ].sort((a, b) => (b.at?.getTime() || 0) - (a.at?.getTime() || 0));

      const candidates: ReviewPromptCandidate[] = list.map(({ kind, id }) => ({ kind, id }));
      res.json({ candidates });
    } catch (error: any) {
      console.error("Review prompt error:", error?.message || error);
      res.json({ candidates: [] });
    }
  });
}
