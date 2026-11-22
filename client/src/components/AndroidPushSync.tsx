// Saves this Android phone's push token on the logged-in account, so the server can ring it
// (new orders, admin-assigned deliveries). Mounted for the whole app: delivery partners never
// open the shop or admin dashboards, which were the only screens that used to save the token,
// so their phones never rang. iOS does the same in IosPushSync.
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

function readAndroidToken(): string {
  try {
    const bridge = typeof window !== "undefined" ? (window as any).AndroidApp : undefined;
    if (!bridge || typeof bridge.getFcmToken !== "function") return "";
    return String(bridge.getFcmToken() || "");
  } catch {
    return "";
  }
}

// App versions that show the pinned live order-status notification say so through the bridge.
function supportsLiveOrderStatus(): boolean {
  try {
    const bridge = (window as any).AndroidApp;
    return typeof bridge?.supportsLiveOrderStatus === "function" && !!bridge.supportsLiveOrderStatus();
  } catch {
    return false;
  }
}

export function AndroidPushSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    if (typeof window === "undefined" || !(window as any).AndroidApp) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    // On a fresh install Firebase hands the app its token a few seconds after start,
    // so try again for up to a minute before giving up.
    const sync = async () => {
      if (cancelled) return;
      const token = readAndroidToken();
      if (!token) {
        if (attempt++ < 12) timer = setTimeout(sync, 5000);
        return;
      }
      try {
        await api.post("/users/fcm-token", { token, liveStatus: supportsLiveOrderStatus() });
        console.log("[Android Push] Token saved:", token.substring(0, 12) + "...");
      } catch (err) {
        console.error("[Android Push] Failed to save token:", err);
        if (attempt++ < 12) timer = setTimeout(sync, 5000);
      }
    };

    sync();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [user?.id]);

  return null;
}
