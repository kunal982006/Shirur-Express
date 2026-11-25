// Everything the website says to the Android app shell (window.AndroidApp, see
// MainActivity.kt). Every call is feature-checked, so the same website keeps
// working in a browser, on iOS and inside older versions of the Android app.

type Bridge = Record<string, any> | undefined;

function bridge(): Bridge {
  return typeof window !== "undefined" ? (window as any).AndroidApp : undefined;
}

function call(method: string, ...args: unknown[]): boolean {
  const b = bridge();
  if (!b || typeof b[method] !== "function") return false;
  try {
    b[method](...args);
    return true;
  } catch {
    return false;
  }
}

export function isAndroidApp(): boolean {
  return !!bridge();
}

// ---------- Play Store rating ----------

/** Opens Google's own "Rate this app" sheet (app 1.5.3+). False when the app is older. */
export function requestNativeReview(): boolean {
  return call("requestReview");
}

// ---------- haptics ----------

export type HapticKind = "tap" | "success" | "warning";

/** A short vibration for a touch that changed something (cart, order placed). */
export function haptic(kind: HapticKind = "tap") {
  call("haptic", kind);
}

// ---------- startup ----------

let readySent = false;

/** Tells the app the first screen is on screen, so it can lift its splash. */
export function notifyAppReady() {
  if (readySent) return;
  readySent = true;
  call("appReady");
}

const RELOAD_KEY = "se_last_version_reload";

/**
 * Reloads to pick up a newly deployed version. Returns false when a reload was
 * already tried in the last minute, so a broken deploy can't cause a reload loop.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  // The app fetches the newest version first; a browser just reloads.
  if (!call("reloadFresh")) window.location.reload();
  return true;
}

// ---------- native bottom navigation ----------

export type NativeNavIcon = "home" | "bookings" | "deliveries" | "dashboard" | "settings" | "login";

export interface NativeNavItem {
  href: string;
  label: string;
  icon: NativeNavIcon;
}

export interface NativeNavState {
  visible: boolean;
  active: string | null;
  items: NativeNavItem[];
  colors: { background: string; active: string; inactive: string; border: string };
}

/** True when this app version draws the bottom bar itself. */
export function hasNativeBottomNav(): boolean {
  return typeof bridge()?.setBottomNav === "function";
}

let lastNavJson = "";

export function setNativeBottomNav(state: NativeNavState) {
  const json = JSON.stringify(state);
  if (json === lastNavJson) return;
  if (call("setBottomNav", json)) lastNavJson = json;
}

/** "rgb(1, 2, 3)" as the browser reports it -> "#010203" for Android. */
export function cssColorToHex(color: string, fallback: string): string {
  const parts = color.match(/[\d.]+/g);
  if (!color.startsWith("rgb") || !parts || parts.length < 3) return fallback;
  return "#" + parts.slice(0, 3).map((n) => Math.round(Number(n)).toString(16).padStart(2, "0")).join("");
}

// ---------- back button ----------

const OPEN_OVERLAY =
  '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], ' +
  '[data-vaul-drawer][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]';

let lastBackTarget: Element | null = null;

/**
 * Called by the app when Back is pressed. Closes the topmost popup, sheet or
 * menu the way Android apps do, and reports whether it did. A popup that
 * refuses to close is skipped on the next press so Back never gets stuck.
 */
function handleNativeBack(): boolean {
  const open = document.querySelectorAll(OPEN_OVERLAY);
  const top = open[open.length - 1];
  if (!top) {
    lastBackTarget = null;
    return false;
  }
  if (top === lastBackTarget) {
    lastBackTarget = null;
    return false;
  }
  lastBackTarget = top;
  (document.activeElement ?? document.body).dispatchEvent(
    new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
  );
  return true;
}

export function installNativeBackHandler() {
  (window as any).__nativeBack = handleNativeBack;
}
