// Slides a newly opened page in over the old one, the way an Android app moves
// between screens. The browser takes a picture of the old page, the new page is
// rendered, and the two are animated on the GPU (the View Transitions API).
//
// Only "forward" navigation to a different page is animated. Going back is left
// alone so the browser can restore the scroll position exactly as before.
// Browsers and WebViews without the API just switch pages as they always did.

import { flushSync } from "react-dom";
import { isAndroidApp } from "./native-app";

function pathOf(url: string | URL | null | undefined): string | null {
  if (url == null) return null;
  try {
    return new URL(String(url), window.location.href).pathname;
  } catch {
    return null;
  }
}

function shouldAnimate(): boolean {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  // A phone-sized screen, or the app itself. Desktop keeps instant page switches.
  return isAndroidApp() || window.matchMedia("(max-width: 767px)").matches;
}

export function installPageTransitions() {
  const start = (document as any).startViewTransition as
    | ((update: () => void) => { finished: Promise<void> })
    | undefined;
  if (typeof start !== "function") return;

  // wouter has already wrapped pushState to announce navigations; this wraps it
  // once more so the announcement (and the re-render it causes) happens inside
  // the transition.
  const push = history.pushState;
  history.pushState = function (this: History, ...args: Parameters<History["pushState"]>) {
    const target = pathOf(args[2]);
    if (!target || target === window.location.pathname || !shouldAnimate()) {
      return push.apply(this, args);
    }
    const root = document.documentElement;
    try {
      root.dataset.nav = "forward";
      const transition = start.call(document, () => {
        flushSync(() => push.apply(history, args));
      });
      transition.finished.catch(() => {}).finally(() => {
        delete root.dataset.nav;
      });
    } catch {
      delete root.dataset.nav;
      push.apply(this, args);
    }
  };
}
