// Registers the iOS app (Capacitor shell) for Apple push notifications so admins, restaurants,
// service providers and delivery partners get a ringing alert for new orders/bookings.
// The Android app does the same thing through window.AndroidApp.getFcmToken().
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

const isIosApp = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

export function IosPushSync() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Tapping a notification opens the dashboard the server asked for (navigateTo).
  useEffect(() => {
    if (!isIosApp()) return;
    const handle = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const target = action.notification?.data?.navigateTo;
      if (typeof target === "string" && target.startsWith("/")) setLocation(target);
    });
    return () => { handle.then((h) => h.remove()); };
  }, [setLocation]);

  // Only staff accounts need order rings; don't prompt customers.
  const shouldRegister = isIosApp() && !!user?.id && user.role !== "customer";

  useEffect(() => {
    if (!shouldRegister) return;
    let cancelled = false;
    const listeners = [
      PushNotifications.addListener("registration", async ({ value }) => {
        if (cancelled || !value) return;
        try {
          await api.post("/users/fcm-token", { token: value });
          console.log("[iOS Push] Token saved:", value.substring(0, 12) + "...");
        } catch (err) {
          console.error("[iOS Push] Failed to save token:", err);
        }
      }),
      PushNotifications.addListener("registrationError", (err) => {
        console.error("[iOS Push] Registration failed:", err);
      }),
    ];

    (async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive === "granted" && !cancelled) await PushNotifications.register();
      } catch (err) {
        console.error("[iOS Push] Setup error:", err);
      }
    })();

    return () => {
      cancelled = true;
      listeners.forEach((l) => l.then((h) => h.remove()));
    };
  }, [shouldRegister, user?.id]);

  return null;
}
