// client/src/lib/thermal-printer.ts
// Talks to the Bluetooth thermal printer through the Android app bridge
// (window.AndroidApp, see PrinterManager.kt) and lays out the 58mm receipt.

export const RECEIPT_WIDTH = 32; // characters per line on 58mm paper (normal font)

export const BUSINESS = {
  name: "SHIRUR EXPRESS",
  tagline: "Shirur's Super App",
  services: "Food | Grocery | Home Services",
  city: "Shirur, Pune, Maharashtra",
  helpline: "78409 40113",
  email: "support@shirurexpress.com",
  footer: "Order again on the Shirur Express app",
  logoUrl: "/shirur-express-logo.png",
};

export type PrinterDevice = { address: string; name: string; likelyPrinter?: boolean };

export type ReceiptLine = {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  size?: "normal" | "tall" | "wide" | "large";
  /** 1-bit raster (MSB first, base64). Needs app 1.4.0+; older apps print an empty line. */
  image?: { data: string; width: number; height: number };
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
  createdByRole?: string | null;
  details?: {
    orderLabel?: string;
    storeName?: string;
    orderedAt?: string;
    completedAt?: string;
    chargesLabel?: string;
  } | null;
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

/** App 1.4.0+ can print the logo. */
export function canPrintImages(): boolean {
  try {
    return !!bridge()?.printerSupportsImages?.();
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

// ---- logo ----

/** Dots across 58mm paper. */
const PAPER_DOTS = 384;
/** The logo is printed smaller than the paper, centered, to keep the header compact. */
const LOGO_DOTS = 224;
const LOGO_MAX_HEIGHT = 160;
let logoLine: Promise<ReceiptLine | null> | null = null;

/** The app logo as a black/white raster line, cropped to its edges. Cached. */
export function loadLogoLine(): Promise<ReceiptLine | null> {
  if (!logoLine) {
    logoLine = rasterizeLogo().catch((e) => {
      console.warn("[Printer] Logo not available:", e);
      logoLine = null; // try again next print
      return null;
    });
  }
  return logoLine;
}

async function rasterizeLogo(): Promise<ReceiptLine> {
  const img = new Image();
  img.src = BUSINESS.logoUrl;
  await img.decode();

  // 1. Find the logo's edges (the PNG has a wide white border).
  const src = document.createElement("canvas");
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  const sctx = src.getContext("2d", { willReadFrequently: true })!;
  sctx.fillStyle = "#fff";
  sctx.fillRect(0, 0, src.width, src.height);
  sctx.drawImage(img, 0, 0);
  const px = sctx.getImageData(0, 0, src.width, src.height).data;
  let minX = src.width, minY = src.height, maxX = -1, maxY = -1;
  for (let y = 0; y < src.height; y += 2) {
    for (let x = 0; x < src.width; x += 2) {
      const i = (y * src.width + x) * 4;
      if (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114 < 200) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("Logo is blank");
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  // 2. Scale down to a compact size and center it on a full-width strip
  //    (so it stays centered even if the printer ignores image alignment).
  const width = PAPER_DOTS;
  let logoW = LOGO_DOTS;
  let logoH = Math.round((cropH * logoW) / cropW);
  if (logoH > LOGO_MAX_HEIGHT) {
    logoH = LOGO_MAX_HEIGHT;
    logoW = Math.round((cropW * logoH) / cropH);
  }
  const height = logoH;
  const dst = document.createElement("canvas");
  dst.width = width;
  dst.height = height;
  const dctx = dst.getContext("2d", { willReadFrequently: true })!;
  dctx.fillStyle = "#fff";
  dctx.fillRect(0, 0, width, height);
  dctx.imageSmoothingQuality = "high";
  dctx.drawImage(src, minX, minY, cropW, cropH, Math.round((width - logoW) / 2), 0, logoW, logoH);
  const d = dctx.getImageData(0, 0, width, height).data;

  // 3. Threshold to 1-bit: the blue and black print solid, the white text stays white.
  const rowBytes = width / 8;
  const bits = new Uint8Array(rowBytes * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lum = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      if (lum < 150) bits[y * rowBytes + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  let binary = "";
  for (let i = 0; i < bits.length; i++) binary += String.fromCharCode(bits[i]);
  return { text: "", align: "center", image: { data: btoa(binary), width, height } };
}

/**
 * Prints a bill with the logo on top (when the app supports images).
 * Duplicate copies are marked automatically from printCount.
 */
export async function printBillOnPrinter(bill: PrintableBill & { printCount?: number }) {
  const lines = buildReceiptLines(bill, { reprint: (bill.printCount ?? 0) > 0 });
  if (canPrintImages()) {
    const logo = await loadLogoLine();
    if (logo) lines.unshift(logo, { text: "" });
  }
  await printLines(lines);
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
  const double = "=".repeat(RECEIPT_WIDTH);
  const lines: ReceiptLine[] = [];
  const add = (text: string, extra: Omit<ReceiptLine, "text"> = {}) => lines.push({ text, ...extra });
  const blank = () => add("");
  const details = bill.details || {};

  // ---- header ----
  add(BUSINESS.name, { align: "center", bold: true, size: "large" });
  add(BUSINESS.tagline, { align: "center", bold: true });
  add(BUSINESS.services, { align: "center" });
  add(BUSINESS.city, { align: "center" });
  add(`Helpline: ${BUSINESS.helpline}`, { align: "center" });
  add(double);
  add(details.orderLabel ? "ORDER BILL" : "BILL / RECEIPT", { align: "center", bold: true, size: "tall" });
  if (opts.reprint) add("** DUPLICATE COPY **", { align: "center", bold: true });
  add(double);

  // ---- bill info ----
  add(twoCol("Bill No:", bill.billNo), { bold: true });
  add(twoCol("Date:", formatDate(bill.createdAt)));
  if (bill.orderRef) add(twoCol("Order ID:", bill.orderRef));
  if (details.orderLabel) add(twoCol("Type:", details.orderLabel));
  if (details.orderedAt) add(twoCol("Ordered:", formatDate(details.orderedAt)));
  if (details.completedAt) {
    add(twoCol(details.orderLabel?.includes("Service") ? "Completed:" : "Delivered:", formatDate(details.completedAt)));
  }
  if (details.storeName) {
    add(dash);
    add(details.orderLabel?.includes("Service") ? "SERVICE BY" : "ORDERED FROM", { bold: true });
    wrap(details.storeName).forEach((l) => add(l));
  }

  // ---- customer ----
  if (bill.customerName || bill.customerPhone || bill.customerAddress) {
    add(dash);
    add("CUSTOMER DETAILS", { bold: true });
    if (bill.customerName) wrap(`Name: ${bill.customerName}`).forEach((l) => add(l));
    if (bill.customerPhone) add(`Phone: ${toPrintable(bill.customerPhone)}`);
    if (bill.customerAddress) wrap(`Address: ${bill.customerAddress}`).forEach((l) => add(l));
  }

  // ---- items ----
  add(double);
  add(twoCol("ITEM", "AMOUNT"), { bold: true });
  add(dash);
  let totalQty = 0;
  bill.items.forEach((item, index) => {
    totalQty += item.quantity;
    const amount = formatAmount(item.quantity * item.price);
    const nameLines = wrap(`${index + 1}. ${item.name}`);
    if (item.quantity === 1) {
      // "1. Groceries              450.00"
      nameLines.slice(0, -1).forEach((l) => add(l));
      add(twoCol(nameLines[nameLines.length - 1] || "", amount));
    } else {
      // "2. Milk 1L"
      // "   2 x 30.00               60.00"
      nameLines.forEach((l) => add(l));
      add(twoCol(`   ${qtyText(item.quantity)} x ${formatAmount(item.price)}`, amount));
    }
  });
  add(dash);
  add(twoCol(`Items: ${bill.items.length}`, `Qty: ${qtyText(totalQty)}`));
  add(dash);

  // ---- totals ----
  const deliveryCharge = num(bill.deliveryCharge);
  const discount = num(bill.discount);
  add(twoCol("Subtotal", formatAmount(bill.subtotal)));
  if (deliveryCharge > 0) add(twoCol(details.chargesLabel || "Delivery", formatAmount(deliveryCharge)));
  if (discount > 0) add(twoCol("Discount", `-${formatAmount(discount)}`));
  add(double);
  // Double height keeps 32 columns, so the total stays aligned but stands out.
  add(twoCol("TOTAL", `Rs. ${formatAmount(bill.total)}`), { bold: true, size: "tall" });
  add(double);
  if (discount > 0) {
    wrap(`You saved Rs. ${formatAmount(discount)} on this order!`).forEach((l) => add(l, { align: "center", bold: true }));
  }
  add(twoCol("Payment Mode", PAYMENT_LABELS[bill.paymentMode] || bill.paymentMode), { bold: true });
  add(twoCol("Payment Status", bill.paymentMode === "pending" ? "TO BE COLLECTED" : "PAID"), { bold: true });

  if (bill.note) {
    add(dash);
    add("NOTE", { bold: true });
    wrap(bill.note).forEach((l) => add(l));
  }

  // ---- footer ----
  add(dash);
  if (bill.createdByName) {
    const who = bill.createdByRole === "delivery_partner" ? "Delivered by" : bill.createdByRole === "provider" ? "Served by" : "Billed by";
    wrap(`${who}: ${bill.createdByName}`).forEach((l) => add(l));
  }
  blank();
  add("THANK YOU!", { align: "center", bold: true, size: "large" });
  wrap(BUSINESS.footer).forEach((l) => add(l, { align: "center" }));
  blank();
  wrap("Food, grocery, electrician, plumber & more in one app").forEach((l) => add(l, { align: "center" }));
  add("Available on Play Store", { align: "center" });
  add("and App Store:", { align: "center" });
  add('"Shirur Express"', { align: "center", bold: true });
  blank();
  add("Help & Support", { align: "center", bold: true });
  add(`Call/WhatsApp: ${BUSINESS.helpline}`, { align: "center" });
  add(BUSINESS.email, { align: "center" });
  blank();
  wrap("Please check your items at delivery. For any issue, contact us instantly.").forEach((l) =>
    add(l, { align: "center" }),
  );
  add(dash);
  add("Order again anytime on the app!", { align: "center", bold: true });
  add("Computer generated bill", { align: "center" });
  add(double);
  wrap("Your trust is our responsibility.").forEach((l) => add(l, { align: "center", bold: true, size: "tall" }));
  add(double);
  return lines;
}

/** Plain-text version for preview, WhatsApp sharing and the browser fallback. */
export function receiptAsText(bill: PrintableBill, opts: { reprint?: boolean } = {}): string {
  return buildReceiptLines(bill, opts)
    .filter((l) => !l.image)
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
