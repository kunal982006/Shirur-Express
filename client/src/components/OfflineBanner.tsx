// A small notice while the phone has no internet.
//
// The Android app now opens from files stored on the phone, so with no
// connection it shows the last saved home screen instead of an error page.
// This tells the customer why prices and orders are not refreshing.

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);

  useEffect(() => {
    const update = () => setOffline(navigator.onLine === false);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed left-3 right-3 z-[60] mx-auto flex max-w-md items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-white shadow-xl"
      style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-300" />
      <span>No internet connection. Showing what was last loaded.</span>
    </div>
  );
}
