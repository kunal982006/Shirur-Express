// Asks Android app users on an old Play Store version to update.
// Apps before versionCode 14 have no getAppVersionCode(), so they count as version 0.
// The versions to compare against come from Render env vars via /api/app-version.

import { useEffect, useState, type MouseEvent } from "react";
import { API_BASE_URL } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.shirurexpress.app";
const SNOOZE_KEY = "appUpdateSnoozedUntil";
const SNOOZE_MS = 24 * 60 * 60 * 1000;

function installedVersionCode(): number | null {
  const bridge = (window as any).AndroidApp;
  if (!bridge) return null; // browser, not the app
  try {
    return typeof bridge.getAppVersionCode === "function" ? Number(bridge.getAppVersionCode()) || 0 : 0;
  } catch {
    return 0;
  }
}

export default function AppUpdatePopup() {
  const [open, setOpen] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const installed = installedVersionCode();
    if (installed === null) return;

    fetch(`${API_BASE_URL}/api/app-version`)
      .then((r) => r.json())
      .then(({ latestVersionCode, minVersionCode }: { latestVersionCode: number; minVersionCode: number }) => {
        const mustUpdate = installed < minVersionCode;
        if (!mustUpdate && installed >= latestVersionCode) return;
        if (!mustUpdate) {
          let snoozedUntil = 0;
          try { snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY)) || 0; } catch {}
          if (Date.now() < snoozedUntil) return;
        }
        setForced(mustUpdate);
        setOpen(true);
      })
      .catch(() => {});
  }, []);

  const later = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch {}
    setOpen(false);
  };

  // The app opens non-Shirur links outside the WebView, so this lands in the Play Store app.
  const update = (e: MouseEvent) => {
    if (forced) e.preventDefault(); // keep the popup up until they actually update
    window.location.href = PLAY_STORE_URL;
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && !forced && later()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>New update available 🎉</AlertDialogTitle>
          <AlertDialogDescription>
            A new version of Shirur Express is available on the Play Store with fixes and improvements.
            Please update to keep everything working smoothly.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!forced && <AlertDialogCancel onClick={later}>Later</AlertDialogCancel>}
          <AlertDialogAction onClick={update}>Update now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
