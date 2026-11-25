// Asks Android app customers to rate Shirur Express on the Play Store after a
// good experience: a food order delivered in under 26 minutes, or a finished
// booking (electrician, plumber, beauty parlour, …). The server picks the
// orders and bookings. On this phone it asks at most once every 30 days, never
// again after "Rate now", and stops after "Later" three times.
//
// App 1.5.3+ shows Google's own rating sheet inside the app. Older app versions
// get a small popup that opens the Play Store page.

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { isAndroidApp, requestNativeReview } from "@/lib/native-app";
import type { ReviewPromptCandidate } from "@shared/review-prompt";
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
const ASKED_KEY = "reviewPromptAsked";
const STATE_KEY = "reviewPromptState";
const GAP_MS = 30 * 24 * 60 * 60 * 1000; // at most once every 30 days
const MAX_LATER = 3; // stop asking after "Later" three times

interface PromptState {
  lastShownAt: number;
  rated: boolean; // tapped "Rate now": never ask again
  laterCount: number;
}

function readState(): PromptState {
  try {
    const v = JSON.parse(localStorage.getItem(STATE_KEY) || "{}");
    return { lastShownAt: Number(v.lastShownAt) || 0, rated: v.rated === true, laterCount: Number(v.laterCount) || 0 };
  } catch {
    return { lastShownAt: 0, rated: false, laterCount: 0 };
  }
}

function saveState(patch: Partial<PromptState>) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ ...readState(), ...patch }));
  } catch {}
}

function mayAsk(): boolean {
  const st = readState();
  return !st.rated && st.laterCount < MAX_LATER && Date.now() - st.lastShownAt >= GAP_MS;
}

function askedIds(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(ASKED_KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function markAsked(id: string) {
  try {
    localStorage.setItem(ASKED_KEY, JSON.stringify([id, ...askedIds().filter((x) => x !== id)].slice(0, 100)));
  } catch {}
}

export default function ReviewPrompt() {
  const { user } = useAuth();
  const enabled = isAndroidApp() && !!user && (user as any).role === "customer";
  const [prompt, setPrompt] = useState<ReviewPromptCandidate | null>(null);

  const { data } = useQuery<{ candidates: ReviewPromptCandidate[] }>({
    queryKey: ["review-prompt"],
    queryFn: () => api.get("/review-prompt").then((r) => r.data),
    enabled,
    refetchInterval: 90_000,
    refetchOnWindowFocus: true,
  });

  const waiting = useRef(false);
  useEffect(() => {
    if (!enabled || prompt || waiting.current) return;
    const asked = new Set(askedIds());
    const next = data?.candidates?.find((c) => !asked.has(c.id));
    if (!next) return;
    // Orders and bookings that come while we may not ask are skipped for good,
    // so an old order never pops up weeks later.
    const fresh = data!.candidates.filter((c) => !asked.has(c.id));
    fresh.forEach((c) => markAsked(c.id));
    if (!mayAsk()) return;
    saveState({ lastShownAt: Date.now() });
    waiting.current = true;
    // A short pause so the "Delivered" / "Completed" screen is seen first.
    setTimeout(() => {
      waiting.current = false;
      if (!requestNativeReview()) setPrompt(next);
    }, 4000);
  }, [data, enabled, prompt]);

  if (!prompt) return null;

  const isFood = prompt.kind === "order";

  return (
    <AlertDialog open onOpenChange={(o) => !o && setPrompt(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isFood ? "Enjoyed your fast delivery? 🚀" : "Happy with the service? 🙌"}</AlertDialogTitle>
          <AlertDialogDescription>
            Please rate Shirur Express on the Play Store. It takes 10 seconds and helps more people in Shirur find us. ⭐⭐⭐⭐⭐
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              saveState({ laterCount: readState().laterCount + 1 });
              setPrompt(null);
            }}
          >
            Later
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              saveState({ rated: true });
              setPrompt(null);
              // The app opens non-Shirur links outside the WebView, so this lands in the Play Store app.
              window.location.href = PLAY_STORE_URL;
            }}
          >
            Rate now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
