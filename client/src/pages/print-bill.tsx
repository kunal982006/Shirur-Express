// Bill generation + Bluetooth thermal printing for admins and delivery partners.
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Bluetooth, CheckCircle2, Loader2, Plus, Printer, RefreshCw,
  Settings2, Share2, Trash2, AlertTriangle, ReceiptText,
} from "lucide-react";
import { PrinterPickerDialog, printerErrorToast, shareOnWhatsApp, type Bill } from "@/components/print-order-bill-button";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatAmount, getSavedPrinter, isOldAppVersion, isPrinterAvailable, printBillOnPrinter,
  printLines, PrinterError, receiptAsText, type PrinterDevice,
} from "@/lib/thermal-printer";

type ItemRow = { name: string; quantity: string; price: string };

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "online", label: "Paid Online" },
  { value: "pending", label: "Not Paid" },
] as const;

const emptyItem = (): ItemRow => ({ name: "", quantity: "1", price: "" });

const toNumber = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

export default function PrintBillPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const printerSupported = isPrinterAvailable();
  const oldApp = isOldAppVersion();

  // ---- printer ----
  const [printer, setPrinter] = useState<PrinterDevice | null>(() => getSavedPrinter());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);

  // ---- form ----
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [discount, setDiscount] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("cash");
  const [note, setNote] = useState("");
  const [lastBill, setLastBill] = useState<Bill | null>(null);

  useEffect(() => {
    if (!authLoading && !user) setLocation("/login");
  }, [authLoading, user, setLocation]);

  const billsQuery = useQuery<Bill[]>({
    queryKey: ["bills"],
    queryFn: async () => (await api.get("/bills?limit=30")).data,
    enabled: !!user,
    staleTime: 30_000,
  });

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + toNumber(i.quantity) * toNumber(i.price), 0);
    const total = subtotal + toNumber(deliveryCharge) - toNumber(discount);
    return { subtotal, total };
  }, [items, deliveryCharge, discount]);

  const showPrinterError = (e: unknown) => {
    toast(printerErrorToast(e));
    if ((e as PrinterError).code === "NO_PRINTER") openPicker();
  };

  const openPicker = () => setPickerOpen(true);

  async function testPrint() {
    setPrintingId("test");
    try {
      await printLines([
        { text: "SHIRUR EXPRESS", align: "center", bold: true, size: "large" },
        { text: "Printer test OK", align: "center" },
        { text: "-".repeat(32) },
        { text: "12345678901234567890123456789012" },
      ]);
      toast({ title: "Test page printed" });
    } catch (e) {
      showPrinterError(e);
    } finally {
      setPrintingId(null);
    }
  }

  async function printBill(bill: Bill) {
    if (!printerSupported) return;
    if (!getSavedPrinter()) {
      toast({ title: "Select your printer first" });
      openPicker();
      return;
    }
    setPrintingId(bill.id);
    try {
      await printBillOnPrinter(bill);
      try {
        const updated: Bill = (await api.post(`/bills/${bill.id}/printed`)).data;
        setLastBill((cur) => (cur?.id === updated.id ? updated : cur));
        queryClient.invalidateQueries({ queryKey: ["bills"] });
      } catch {
        // The bill is printed; failing to count it is not worth alarming the rider.
      }
      toast({ title: "Bill printed", description: bill.billNo });
    } catch (e) {
      showPrinterError(e);
    } finally {
      setPrintingId(null);
    }
  }

  const createBill = useMutation({
    mutationFn: async () => {
      const cleanItems = items
        .filter((i) => i.name.trim() || i.price.trim())
        .map((i) => ({ name: i.name.trim() || "Item", quantity: toNumber(i.quantity) || 1, price: toNumber(i.price) }));
      const res = await api.post("/bills", {
        customerName, customerPhone, customerAddress, orderRef,
        items: cleanItems,
        deliveryCharge: toNumber(deliveryCharge),
        discount: toNumber(discount),
        paymentMode, note,
      });
      return res.data as Bill;
    },
    onSuccess: (bill) => {
      setLastBill(bill);
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      resetForm();
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (printerSupported) printBill(bill);
    },
    onError: (e: any) => {
      toast({ title: "Bill not saved", description: e?.message || "Please try again.", variant: "destructive" });
    },
  });

  function resetForm() {
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setOrderRef("");
    setItems([emptyItem()]);
    setDeliveryCharge("");
    setDiscount("");
    setPaymentMode("cash");
    setNote("");
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  const hasValidItem = items.some((i) => toNumber(i.price) > 0 && toNumber(i.quantity) > 0);
  const canSubmit = hasValidItem && totals.total >= 0 && !createBill.isPending;

  if (authLoading || !user) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const forbidden = (billsQuery.error as any)?.response?.status === 403 ||
    /admins and delivery partners/i.test((billsQuery.error as any)?.message || "");
  if (forbidden) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 pt-20">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center space-y-3">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
            <p className="font-semibold">Billing is only for delivery partners and admins.</p>
            <Button onClick={() => setLocation("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 pt-20 pb-24">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.length > 1 ? window.history.back() : setLocation("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ReceiptText className="h-6 w-6" /> Print Bill
            </h1>
            <p className="text-sm text-gray-500">Create a bill and print it on the Bluetooth printer</p>
          </div>
        </div>

        {/* ---------- Printer ---------- */}
        <Card>
          <CardContent className="p-4">
            {printerSupported ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-full ${printer ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    <Bluetooth className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Printer</p>
                    <p className="font-semibold truncate">{printer ? printer.name || printer.address : "Not selected"}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {printer && (
                    <Button variant="outline" size="sm" onClick={testPrint} disabled={!!printingId}>
                      {printingId === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                    </Button>
                  )}
                  <Button size="sm" onClick={openPicker}>
                    <Settings2 className="h-4 w-4 mr-1" /> {printer ? "Change" : "Select"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-gray-700">
                  {oldApp
                    ? "Update the Shirur Express app from the Play Store to print bills on the Bluetooth printer. You can still create bills and share them on WhatsApp."
                    : "Printing works only in the Shirur Express Android app. Here you can create bills and share them on WhatsApp."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---------- Last bill ---------- */}
        {lastBill && (
          <Card className="border-green-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" /> Bill {lastBill.billNo} saved · Rs. {formatAmount(lastBill.total)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="bg-white border rounded p-3 text-[11px] leading-snug font-mono overflow-x-auto whitespace-pre">
                {receiptAsText(lastBill)}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                {printerSupported && (
                  <Button onClick={() => printBill(lastBill)} disabled={!!printingId}>
                    {printingId === lastBill.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
                    {lastBill.printCount > 0 ? "Print Again" : "Print"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => shareOnWhatsApp(lastBill)}>
                  <Share2 className="h-4 w-4 mr-1" /> WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------- New bill ---------- */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">New Bill</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cname">Customer name</Label>
                <Input id="cname" value={customerName} onChange={(e) => setCustomerName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <Label htmlFor="cphone">Phone</Label>
                <Input id="cphone" type="tel" inputMode="numeric" value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)} maxLength={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="caddr">Address (optional)</Label>
                <Input id="caddr" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} maxLength={200} />
              </div>
              <div>
                <Label htmlFor="oref">Order ID (optional)</Label>
                <Input id="oref" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} maxLength={60} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input className="flex-1" placeholder="Item / details" value={item.name}
                    onChange={(e) => updateItem(index, { name: e.target.value })} maxLength={60} />
                  <Input className="w-14 text-center" type="number" inputMode="decimal" min="0" placeholder="Qty"
                    value={item.quantity} onChange={(e) => updateItem(index, { quantity: e.target.value })} />
                  <Input className="w-20" type="number" inputMode="decimal" min="0" placeholder="Rate"
                    value={item.price} onChange={(e) => updateItem(index, { price: e.target.value })} />
                  <Button variant="ghost" size="icon" className="shrink-0" disabled={items.length === 1}
                    onClick={() => setItems((rows) => rows.filter((_, i) => i !== index))}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setItems((rows) => [...rows, emptyItem()])}
                disabled={items.length >= 50}>
                <Plus className="h-4 w-4 mr-1" /> Add item
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dcharge">Delivery charge</Label>
                <Input id="dcharge" type="number" inputMode="decimal" min="0" placeholder="0"
                  value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="disc">Discount</Label>
                <Input id="disc" type="number" inputMode="decimal" min="0" placeholder="0"
                  value={discount} onChange={(e) => setDiscount(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>Payment</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {PAYMENT_MODES.map((m) => (
                  <Button key={m.value} type="button" size="sm"
                    variant={paymentMode === m.value ? "default" : "outline"}
                    onClick={() => setPaymentMode(m.value)}>
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            </div>

            <div className="rounded-lg bg-gray-50 p-3 flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className={`text-2xl font-bold ${totals.total < 0 ? "text-red-600" : ""}`}>
                Rs. {totals.total.toFixed(2)}
              </span>
            </div>

            <Button className="w-full h-12 text-base" disabled={!canSubmit} onClick={() => createBill.mutate()}>
              {createBill.isPending ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Printer className="h-5 w-5 mr-2" />}
              {printerSupported ? "Save & Print Bill" : "Save Bill"}
            </Button>
          </CardContent>
        </Card>

        {/* ---------- Recent bills ---------- */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Bills</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => billsQuery.refetch()} disabled={billsQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 ${billsQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {billsQuery.isLoading && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
            {billsQuery.data?.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No bills yet</p>}
            {billsQuery.data?.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between gap-2 border rounded-lg p-3 bg-white">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    {bill.billNo} · Rs. {formatAmount(bill.total)}
                    {bill.paymentMode === "pending" && <Badge variant="destructive" className="ml-2">Not paid</Badge>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {bill.customerName || "Walk-in"} · {bill.createdAt ? new Date(bill.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : ""}
                    {user.role === "admin" && bill.createdByName ? ` · by ${bill.createdByName}` : ""}
                    {bill.printCount > 1 ? ` · printed ${bill.printCount}x` : ""}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {printerSupported && (
                    <Button variant="outline" size="icon" onClick={() => printBill(bill)} disabled={!!printingId}>
                      {printingId === bill.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => shareOnWhatsApp(bill)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ---------- Printer picker ---------- */}
      <PrinterPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelected={(device: PrinterDevice) => setPrinter(device)}
        onForget={() => setPrinter(null)}
      />
    </div>
  );
}
