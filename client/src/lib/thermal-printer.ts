// client/src/lib/thermal-printer.ts
// Talks to the Bluetooth thermal printer through the Android app bridge
// (window.AndroidApp, see PrinterManager.kt) and lays out the 58mm receipt.

export const RECEIPT_WIDTH = 32; // characters per line on 58mm paper (normal font)

export const BUSINESS = {
  name: "SHIRUR EXPRESS",
  tagline: "Shirur's Super App",
  footer: "Thank you! Order again on the Shirur Express app",
};

export type PrinterDevice = { address: string; name: string; likelyPrinter?: boolean };

type ReceiptLine = {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  size?: "normal" | "tall" | "wide" | "large";
};

export type PrintableBill = {
  billNo: string;
  createdAt: string | Date | null;
  orderRef?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: string | number;
  deliveryCharge: string | number;
  discount: string | number;
  total: string | number;
  paymentMode: string;
  note?: string | null;
  createdByName?: string | null;
};

export class PrinterError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function bridge(): any {
  return typeof window !== "undefined" ? (window as any).AndroidApp : undefined;
}

/** True only inside an Android app version that has the printer code. */
export function isPrinterAvailable(): boolean {
  try {
    return !!bridge()?.isPrinterSupported?.();
  } catch {
    return false;
  }
}

/** Inside the app, but an old version without printer support. */
export function isOldAppVersion(): boolean {
  const b = bridge();
  return !!b && typeof b.isPrinterSupported !== "function";
}

// ---- async bridge calls: Kotlin answers via window.__onPrinterResult(id, result) ----
const pending = new Map<string, { resolve: (v: any) => void; reject: (e: Error) => void; timer: number }>();

function ensureResultHandler() {
  const w = window as any;
  if (w.__onPrinterResult) return;
  w.__onPrinterResult = (id: string, result: any) => {
    const p = pending.get(id);
    if (!p) return;
    pending.delete(id);
    window.clearTimeout(p.timer);
    if (result?.ok) p.resolve(result);
    else p.reject(new PrinterError(result?.code || "UNKNOWN", result?.message || "Printer error"));
  };
}

function callAsync(method: string, args: string[], timeoutMs: number): Promise<any> {
  const b = bridge();
  if (!b?.[method]) {
    return Promise.reject(new PrinterError("NOT_SUPPORTED", "Printing works only in the latest Shirur Express Android app."));
  }
  ensureResultHandler();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new PrinterError("TIMEOUT", "The printer did not respond. Check it is on and try again."));
    }, timeoutMs);
    pending.set(id, { resolve, reject, timer });
    try {
      b[method](id, ...args);
    } catch (e: any) {
      pending.delete(id);
      window.clearTimeout(timer);
      reject(new PrinterError("BRIDGE_ERROR", e?.message || "Could not reach the printer."));
    }
  });
}

export async function listPairedPrinters(): Promise<PrinterDevice[]> {
  // Long timeout: the user may be answering the permission dialog.
  const res = await callAsync("listPairedPrinters", [], 60_000);
  return res.devices || [];
}

export function getSavedPrinter(): PrinterDevice | null {
  try {
    const raw = bridge()?.getSavedPrinter?.();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePrinter(device: PrinterDevice) {
  bridge()?.savePrinter?.(device.address, device.name);
}

export function clearPrinter() {
  bridge()?.clearPrinter?.();
}

export function openBluetoothSettings() {
  bridge()?.openBluetoothSettings?.();
}

export async function printLines(lines: ReceiptLine[], opts: { copies?: number } = {}) {
  await callAsync("printReceipt", [JSON.stringify({ lines, feed: 4, copies: opts.copies ?? 1 })], 90_000);
}

// ---- receipt layout ----

/** Cheap printers only know ASCII: swap common symbols, drop the rest. */
export function toPrintable(text: string): string {
  return (text || "")
    .replace(/₹/g, "Rs.")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/×/g, "x")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrap(text: string, width = RECEIPT_WIDTH): string[] {
  const words = toPrintable(text).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (let word of words) {
    while (word.length > width) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (!word) continue;
    if (!current) current = word;
    else if (current.length + 1 + word.length <= width) current += " " + word;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** "left ........ right" on one line; left side is cut if it doesn't fit. */
function twoCol(left: string, right: string, width = RECEIPT_WIDTH): string {
  const r = toPrintable(right);
  const indent = left.match(/^ */)?.[0] ?? "";
  const l = (indent + toPrintable(left)).slice(0, Math.max(0, width - r.length - 1));
  return l + " ".repeat(Math.max(1, width - l.length - r.length)) + r;
}

const num = (v: string | number) => Number(v || 0);
export const formatAmount = (v: string | number) => {
  const n = num(v);
  return n.toFixed(2);
};
const qtyText = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(2).replace(/0+$/, ""));

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  online: "Paid Online",
  pending: "NOT PAID",
};

function formatDate(d: string | Date | null): string {
  const date = d ? new Date(d) : new Date();
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  let h = date.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${h}:${min}${ampm}`;
}

export function buildReceiptLines(bill: PrintableBill, opts: { reprint?: boolean } = {}): ReceiptLine[] {
  const dash = "-".repeat(RECEIPT_WIDTH);
  const lines: ReceiptLine[] = [];
  const add = (text: string, extra: Omit<ReceiptLine, "text"> = {}) => lines.push({ text, ...extra });

  add(BUSINESS.name, { align: "center", bold: true, size: "large" });
  add(BUSINESS.tagline, { align: "center" });
  if (opts.reprint) add("** DUPLICATE COPY **", { align: "center", bold: true });
  add(dash);
  add(twoCol(`Bill: ${bill.billNo}`, formatDate(bill.createdAt)), { bold: true });
  if (bill.orderRef) add(`Order: ${toPrintable(bill.orderRef)}`);
  if (bill.customerName) wrap(`Customer: ${bill.customerName}`).forEach((l) => add(l));
  if (bill.customerPhone) add(`Phone: ${toPrintable(bill.customerPhone)}`);
  if (bill.customerAddress) wrap(`Address: ${bill.customerAddress}`).forEach((l) => add(l));
  add(dash);
  add(twoCol("Item", "Amount"), { bold: true });
  for (const item of bill.items) {
    const amount = formatAmount(item.quantity * item.price);
    const nameLines = wrap(item.name);
    if (item.quantity === 1) {
      // "Groceries                450.00"
      nameLines.slice(0, -1).forEach((l) => add(l));
      add(twoCol(nameLines[nameLines.length - 1] || "", amount));
    } else {
      // "Milk 1L"
      // "  2 x 30.00               60.00"
      nameLines.forEach((l) => add(l));
      add(twoCol(`  ${qtyText(item.quantity)} x ${formatAmount(item.price)}`, amount));
    }
  }
  add(dash);
  const deliveryCharge = num(bill.deliveryCharge);
  const discount = num(bill.discount);
  if (deliveryCharge > 0 || discount > 0) {
    add(twoCol("Subtotal", formatAmount(bill.subtotal)));
    if (deliveryCharge > 0) add(twoCol("Delivery", formatAmount(deliveryCharge)));
    if (discount > 0) add(twoCol("Discount", `-${formatAmount(discount)}`));
  }
  // Double height keeps 32 columns, so the total stays aligned but stands out.
  add(twoCol("TOTAL", `Rs. ${formatAmount(bill.total)}`), { bold: true, size: "tall" });
  add(twoCol("Payment", PAYMENT_LABELS[bill.paymentMode] || bill.paymentMode), { bold: bill.paymentMode === "pending" });
  if (bill.note) {
    add(dash);
    wrap(bill.note).forEach((l) => add(l));
  }
  add(dash);
  if (bill.createdByName) add(`Billed by: ${toPrintable(bill.createdByName)}`.slice(0, RECEIPT_WIDTH));
  wrap(BUSINESS.footer).forEach((l) => add(l, { align: "center" }));
  return lines;
}

/** Plain-text version for preview, WhatsApp sharing and the browser fallback. */
export function receiptAsText(bill: PrintableBill, opts: { reprint?: boolean } = {}): string {
  return buildReceiptLines(bill, opts)
    .map((l) => {
      if (l.align === "center") {
        const pad = Math.max(0, Math.floor((RECEIPT_WIDTH - l.text.length) / 2));
        return " ".repeat(pad) + l.text;
      }
      if (l.align === "right") return l.text.padStart(RECEIPT_WIDTH);
      return l.text;
    })
    .join("\n");
}
