import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy } from "lucide-react";

interface CouponUse {
  orderType: string;
  orderId: string | null;
  discount: string;
  createdAt: string | null;
  username: string | null;
  phone: string | null;
}

interface Coupon {
  id: string;
  code: string;
  label: string | null;
  discountType: "flat" | "percent";
  value: string;
  maxDiscount: string | null;
  minOrder: string;
  orderTypes: string[] | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  uses: CouponUse[];
}

type Scope = "food" | "grocery" | "all";
const SCOPE_TYPES: Record<Scope, string[]> = {
  food: ["restaurant", "street_food"],
  grocery: ["grocery"],
  all: [],
};

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SE" + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

/** Admin: create coupon codes (e.g. a ₹500 food coupon for a creator) and see who used them. */
export default function AdminCoupons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [code, setCode] = useState(randomCode);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("500");
  const [scope, setScope] = useState<Scope>("food");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    queryFn: () => api.get("/admin/coupons").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/admin/coupons", {
        code,
        label,
        discountType: "flat",
        value: Number(value),
        orderTypes: SCOPE_TYPES[scope],
        maxUses,
        expiresAt,
      }),
    onSuccess: () => {
      toast({ title: "Coupon created", description: `${code.toUpperCase()} is ready to share.` });
      setCode(randomCode());
      setLabel("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
    },
    onError: (err: any) => toast({ title: "Could not create", description: err.response?.data?.message || err.message, variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: (c: Coupon) => api.patch(`/admin/coupons/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] }),
    onError: (err: any) => toast({ title: "Could not update", description: err.response?.data?.message || err.message, variant: "destructive" }),
  });

  const copy = (text: string) =>
    navigator.clipboard?.writeText(text).then(() => toast({ title: "Copied", description: text }), () => {});

  const scopeLabel = (types: string[] | null) =>
    !types || types.length === 0 ? "All orders" : types.includes("grocery") && types.length === 1 ? "Grocery" : "Food";

  return (
    <div className="space-y-6">
      <Card className="bg-[#111827] border-white/10 text-white">
        <CardContent className="pt-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Create a coupon</h2>
            <p className="text-sm text-gray-400">
              The customer types the code at checkout. Each person can use a coupon once.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Coupon code</span>
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))} className="bg-white/5 border-white/15 text-white uppercase" />
                <Button type="button" variant="outline" className="bg-white/5 border-white/15 text-white shrink-0" onClick={() => setCode(randomCode())}>
                  New
                </Button>
              </div>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Note (only you see it)</span>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Instagram creator collab" className="bg-white/5 border-white/15 text-white" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Discount (₹ off the order)</span>
              <Input type="number" inputMode="numeric" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="bg-white/5 border-white/15 text-white" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Works on</span>
              <select value={scope} onChange={(e) => setScope(e.target.value as Scope)} className="w-full h-10 rounded-md bg-white/5 border border-white/15 px-3 text-white">
                <option value="food" className="text-black">Food (restaurants and street food)</option>
                <option value="grocery" className="text-black">Grocery</option>
                <option value="all" className="text-black">All orders</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Total uses allowed (empty = no limit)</span>
              <Input type="number" inputMode="numeric" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} className="bg-white/5 border-white/15 text-white" />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-gray-300">Valid until (optional)</span>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="bg-white/5 border-white/15 text-white" />
            </label>
          </div>

          <Button
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 font-bold"
            disabled={!code || !value || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Create ₹${value || 0} coupon`}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#111827] border-white/10 text-white">
        <CardContent className="pt-5">
          <h2 className="text-lg font-bold mb-3">Your coupons</h2>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : !coupons || coupons.length === 0 ? (
            <p className="text-sm text-gray-400">No coupons yet.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {coupons.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
                const usedUp = c.maxUses != null && c.usedCount >= c.maxUses;
                const state = !c.isActive ? "Off" : expired ? "Expired" : usedUp ? "Used up" : "Active";
                return (
                  <li key={c.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button type="button" onClick={() => copy(c.code)} className="font-mono font-bold text-base text-orange-300 inline-flex items-center gap-1.5">
                          {c.code} <Copy className="h-3.5 w-3.5" />
                        </button>
                        <p className="text-xs text-gray-400 break-words">
                          ₹{Number(c.value)} off · {scopeLabel(c.orderTypes)} · used {c.usedCount}
                          {c.maxUses != null ? ` of ${c.maxUses}` : ""}
                          {c.expiresAt ? ` · until ${fmtDate(c.expiresAt)}` : ""}
                        </p>
                        {c.label && <p className="text-xs text-gray-500 break-words">{c.label}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${state === "Active" ? "bg-green-500/15 text-green-300 border-green-500/30" : "bg-white/5 text-gray-400 border-white/10"}`}>
                          {state}
                        </span>
                        <Button size="sm" variant="outline" className="h-7 text-xs bg-white/5 border-white/15 text-white" disabled={toggleMutation.isPending} onClick={() => toggleMutation.mutate(c)}>
                          {c.isActive ? "Turn off" : "Turn on"}
                        </Button>
                      </div>
                    </div>
                    {c.uses.length > 0 && (
                      <ul className="text-xs text-gray-300 space-y-1 pl-2 border-l border-white/10">
                        {c.uses.map((u, i) => (
                          <li key={i} className="break-words">
                            {u.username || "Customer"}{u.phone ? ` (${u.phone})` : ""} · ₹{Number(u.discount)} off · {u.orderType.replace("_", " ")}
                            {u.orderId ? ` #${u.orderId.slice(0, 10)}` : ""} · {fmtDate(u.createdAt)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
