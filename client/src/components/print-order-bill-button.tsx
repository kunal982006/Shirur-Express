// One-tap bill printing for app orders and service bookings.
// The bill is made on the server from the order itself (items, prices, customer),
// then printed on the Bluetooth thermal printer through the Android app.
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bluetooth, Loader2, Printer, RefreshCw, Share2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  clearPrinter, formatAmount, getSavedPrinter, isOldAppVersion, isPrinterAvailable,
  listPairedPrinters, openBluetoothSettings, printBillOnPrinter, PrinterError,
  receiptAsText, savePrinter, type PrintableBill, type PrinterDevice,
} from "@/lib/thermal-printer";

export type Bill = PrintableBill & { id: string; printCount: number };

export type BillOrderType = "grocery" | "restaurant" | "street_food" | "booking";

export function shareOnWhatsApp(bill: PrintableBill) {
  const text = "```\n" + receiptAsText(bill) + "\n```";
  const digits = (bill.customerPhone || "").replace(/\D/g, "");
  const phone = digits.length === 10 ? `91${digits}` : digits.length === 12 && digits.startsWith("91") ? digits : "";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  // Inside the app the WebView hands external links to WhatsApp; in a browser open a new tab.
  if ((window as any).AndroidApp) window.location.href = url;
  else window.open(url, "_blank");
}

export function printerErrorToast(e: unknown) {
  const err = e as PrinterError;
  return {
    title: err.code === "BLUETOOTH_OFF" ? "Bluetooth is off" : "Printer problem",
    description: err.message || "Could not print.",
    variant: "destructive" as const,
  };
}

// ---------- printer picker ----------

export function PrinterPickerDialog({
  open, onOpenChange, onSelected, onForget,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelected: (device: PrinterDevice) => void;
  onForget?: () => void;
}) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const saved = open ? getSavedPrinter() : null;

  async function load() {
    setLoading(true);
    try {
      setDevices(await listPairedPrinters());
    } catch (e) {
      onOpenChange(false);
      toast(printerErrorToast(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(device: PrinterDevice) {
    savePrinter(device);
    toast({ title: "Printer selected", description: device.name });
    // Before closing: the caller may be holding a bill to print right away.
    onSelected(device);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle>Select printer</DialogTitle>
          <DialogDescription>
            Switch the printer on. If it's not listed, pair it first in Bluetooth settings (PIN is usually 0000 or 1234).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {loading && <Loader2 className="h-5 w-5 animate-spin mx-auto" />}
          {!loading && devices.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-3">No paired Bluetooth devices</p>
          )}
          {devices.map((d) => (
            <button key={d.address} onClick={() => choose(d)}
              className={`w-full text-left border rounded-lg p-3 hover:bg-gray-50 ${saved?.address === d.address ? "border-green-500 bg-green-50" : ""}`}>
              <p className="font-medium flex items-center gap-2">
                {d.likelyPrinter && <Printer className="h-4 w-4 text-green-600" />}
                {d.name}
              </p>
              <p className="text-xs text-gray-500">{d.address}</p>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => openBluetoothSettings()}>
            <Bluetooth className="h-4 w-4 mr-1" /> Pair new
          </Button>
          <Button variant="outline" className="flex-1" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
        {saved && onForget && (
          <Button variant="ghost" size="sm" className="text-red-600"
            onClick={() => { clearPrinter(); onForget(); onOpenChange(false); }}>
            Forget saved printer
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------- print button ----------

type Props = {
  orderType: BillOrderType;
  orderId: string;
  /** Off until the order is delivered / the job is billed. */
  disabled?: boolean;
  /** Shown under a disabled button, e.g. "Available after delivery". */
  disabledHint?: string;
  label?: string;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

export function PrintOrderBillButton({
  orderType, orderId, disabled, disabledHint, label = "Print Bill", className, size, variant,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewBill, setPreviewBill] = useState<Bill | null>(null);
  const waitingBill = useRef<Bill | null>(null);

  async function print(bill: Bill) {
    setBusy(true);
    try {
      await printBillOnPrinter(bill);
      try {
        await api.post(`/bills/${bill.id}/printed`);
      } catch {
        // The bill is printed; failing to count it is not worth alarming anyone.
      }
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast({ title: "Bill printed", description: `${bill.billNo} · Rs. ${formatAmount(bill.total)}` });
    } catch (e) {
      toast(printerErrorToast(e));
      if ((e as PrinterError).code === "NO_PRINTER") {
        waitingBill.current = bill;
        setPickerOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClick() {
    setBusy(true);
    let bill: Bill;
    try {
      bill = (await api.post("/bills/from-order", { orderType, orderId })).data;
    } catch (e: any) {
      toast({ title: "Bill not ready", description: e?.message || "Please try again.", variant: "destructive" });
      setBusy(false);
      return;
    }

    if (!isPrinterAvailable()) {
      // Browser or old app: show the bill so it can still be shared.
      setPreviewBill(bill);
      setBusy(false);
      return;
    }
    if (!getSavedPrinter()) {
      waitingBill.current = bill;
      setPickerOpen(true);
      setBusy(false);
      return;
    }
    await print(bill);
  }

  return (
    <>
      <div className={disabled && disabledHint ? "flex flex-col items-stretch gap-1" : "contents"}>
        <Button
          type="button"
          size={size}
          variant={variant}
          className={className}
          disabled={disabled || busy}
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
          {label}
        </Button>
        {disabled && disabledHint && <span className="text-[11px] text-gray-500 text-center">{disabledHint}</span>}
      </div>

      <PrinterPickerDialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open && !busy) waitingBill.current = null;
        }}
        onSelected={() => {
          const bill = waitingBill.current;
          waitingBill.current = null;
          if (bill) print(bill);
        }}
      />

      <Dialog open={!!previewBill} onOpenChange={(open) => !open && setPreviewBill(null)}>
        <DialogContent className="max-w-sm bg-white text-gray-900">
          <DialogHeader>
            <DialogTitle>Bill {previewBill?.billNo}</DialogTitle>
            <DialogDescription>
              {isOldAppVersion()
                ? "Update the Shirur Express app from the Play Store to print on the Bluetooth printer."
                : "Printing works in the Shirur Express Android app. You can share this bill on WhatsApp."}
            </DialogDescription>
          </DialogHeader>
          {previewBill && (
            <>
              <pre className="bg-white border rounded p-3 text-[11px] leading-snug font-mono max-h-80 overflow-auto whitespace-pre">
                {receiptAsText(previewBill)}
              </pre>
              <Button variant="outline" onClick={() => shareOnWhatsApp(previewBill)}>
                <Share2 className="h-4 w-4 mr-1" /> Share on WhatsApp
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
