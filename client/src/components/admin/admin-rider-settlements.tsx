import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Phone, AlertTriangle } from "lucide-react";
import { istToday, type OrderSettlement, type SettlementTotals } from "@shared/rider-settlement";
import { rupees, settleLine } from "@/components/settlement/money";

interface SettlementOrder {
  id: string;
  orderType: "restaurant" | "street_food";
  status: string;
  restaurantName: string;
  customerName: string;
  paymentMethod: string;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  createdAt: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  settlement: OrderSettlement;
}

interface RiderDay {
  riderId: string;
  riderName: string;
  riderPhone: string | null;
  orders: SettlementOrder[];
  totals: SettlementTotals;
}

interface SettlementsResponse {
  date: string;
  riders: RiderDay[];
  totals: SettlementTotals;
}

const timeOf = (o: SettlementOrder) => {
  const at = o.pickedUpAt || o.deliveredAt || o.createdAt;
  return at ? new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";
};

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AdminRiderSettlements() {
  const [date, setDate] = useState(istToday());
  const isToday = date === istToday();

  const { data, isLoading, isError } = useQuery<SettlementsResponse>({
    queryKey: ["/api/admin/rider-settlements", date],
    queryFn: () => api.get(`/admin/rider-settlements?date=${date}`).then((r) => r.data),
    refetchInterval: isToday ? 30000 : false,
    refetchOnWindowFocus: true,
  });

  const t = data?.totals;

  return (
    <div className="space-y-4">
      <Card className="bg-[#111827] border-white/10 text-white">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Rider Settlements</h2>
              <p className="text-sm text-gray-400">
                Restaurant and street food orders picked up by delivery partners. Partners earn ₹40 per order, ₹50 for Yash Biryani.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="bg-white/5 border-white/10 text-white" onClick={() => setDate(shiftDate(date, -1))}>
                ‹ Prev
              </Button>
              <Input
                type="date"
                value={date}
                max={istToday()}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                className="w-40 bg-white/5 border-white/10 text-white [color-scheme:dark]"
              />
              <Button
                size="sm"
                variant="outline"
                className="bg-white/5 border-white/10 text-white"
                disabled={isToday}
                onClick={() => setDate(shiftDate(date, 1))}
              >
                Next ›
              </Button>
            </div>
          </div>

          {t && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <Stat label="Orders" value={String(t.orders)} hint={`${t.cashOrders} cash · ${t.onlineOrders} online`} />
              <Stat label="Customers paid" value={rupees(t.customerTotal)} />
              <Stat label="Paid to restaurants" value={rupees(t.paidToRestaurants)} />
              <Stat label="Partner earnings" value={rupees(t.partnerEarnings)} />
              <Stat label="Shirur Express profit" value={rupees(t.shirurProfit)} accent={t.shirurProfit >= 0 ? "text-emerald-400" : "text-red-400"} />
            </div>
          )}

          {t && t.ordersMissingPrices > 0 && (
            <p className="flex items-start gap-2 text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-md p-2.5">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              {t.ordersMissingPrices} order{t.ordersMissingPrices > 1 ? "s have" : " has"} dishes with no restaurant price, so restaurant bills and profit are too low. Add the missing prices in ⚡ Restaurant Pricing.
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-16 flex justify-center text-gray-400">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : isError ? (
        <p className="text-center text-red-400 py-10">Could not load settlements. Please try again.</p>
      ) : !data || data.riders.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No orders were picked up by delivery partners on this day.</p>
      ) : (
        data.riders.map((rider) => <RiderCard key={rider.riderId} rider={rider} />)
      )}
    </div>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-3">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-lg font-bold ${accent || "text-white"}`}>{value}</p>
      {hint && <p className="text-[11px] text-gray-500">{hint}</p>}
    </div>
  );
}

function RiderCard({ rider }: { rider: RiderDay }) {
  const [open, setOpen] = useState(false);
  const t = rider.totals;
  const line = settleLine(t.partnerOwes, "admin", rider.riderName);

  return (
    <Card className="bg-[#111827] border-white/10 text-white overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold">{rider.riderName}</p>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              {t.orders} order{t.orders === 1 ? "" : "s"} · {t.cashOrders} cash · {t.onlineOrders} online
              {rider.riderPhone && (
                <a href={`tel:${rider.riderPhone}`} className="inline-flex items-center gap-1 text-sky-400">
                  <Phone className="h-3.5 w-3.5" /> {rider.riderPhone}
                </a>
              )}
            </p>
          </div>
          <div
            className={`rounded-lg px-4 py-2 text-center font-bold ${
              line.tone === "partnerPays"
                ? "bg-orange-500/15 text-orange-300 border border-orange-500/30"
                : line.tone === "shirurPays"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-white/5 text-gray-300 border border-white/10"
            }`}
          >
            {line.text}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <Row label="Cash collected" value={rupees(t.collectedFromCustomers)} />
          <Row label="Paid to restaurants" value={rupees(t.paidToRestaurants)} />
          <Row label="Partner earnings" value={rupees(t.partnerEarnings)} />
          <Row label="Our profit" value={rupees(t.shirurProfit)} />
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-center gap-1 text-sm text-sky-400 py-1"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {open ? "Hide orders" : "Show orders"}
        </button>

        {open && (
          <div className="overflow-x-auto -mx-4">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-white/10">
                  <th className="px-4 py-2">Time</th>
                  <th className="px-2 py-2">Restaurant</th>
                  <th className="px-2 py-2">Payment</th>
                  <th className="px-2 py-2 text-right">Customer paid</th>
                  <th className="px-2 py-2 text-right">Restaurant bill</th>
                  <th className="px-2 py-2 text-right">Partner</th>
                  <th className="px-2 py-2 text-right">Our profit</th>
                  <th className="px-4 py-2 text-right">Partner owes</th>
                </tr>
              </thead>
              <tbody>
                {rider.orders.map((o) => (
                  <tr key={o.id} className="border-b border-white/5 align-top">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-300">
                      {timeOf(o)}
                      <span className="block text-[10px] text-gray-500">#{o.id.slice(0, 8)}</span>
                    </td>
                    <td className="px-2 py-2">
                      <span className="font-medium">{o.restaurantName}</span>
                      <span className="block text-[11px] text-gray-500">
                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className={o.settlement.isCod ? "text-orange-300" : "text-sky-300"}>{o.settlement.isCod ? "Cash" : "Online"}</span>
                    </td>
                    <td className="px-2 py-2 text-right">{rupees(o.settlement.customerTotal)}</td>
                    <td className="px-2 py-2 text-right">
                      {rupees(o.settlement.restaurantBill)}
                      {o.settlement.missingPrices > 0 && (
                        <span className="block text-[10px] text-amber-400">{o.settlement.missingPrices} price{o.settlement.missingPrices > 1 ? "s" : ""} missing</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">{rupees(o.settlement.partnerEarning)}</td>
                    <td className={`px-2 py-2 text-right ${o.settlement.shirurProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {rupees(o.settlement.shirurProfit)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${o.settlement.partnerOwes >= 0 ? "text-orange-300" : "text-emerald-300"}`}>
                      {o.settlement.partnerOwes >= 0 ? rupees(o.settlement.partnerOwes) : `−${rupees(-o.settlement.partnerOwes)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 pt-2 text-[11px] text-gray-500">
              Partner owes: positive means the partner gives Shirur Express that amount; minus means Shirur Express pays the partner.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/5 border border-white/10 px-3 py-2">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
