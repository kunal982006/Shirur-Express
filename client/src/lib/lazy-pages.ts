// Pages are split into their own files so the first screen only downloads what it
// needs. The customer-flow pages are then fetched quietly in the background, so
// tapping through to them is still instant.

import { lazy, type ComponentType } from "react";
import { reloadForNewVersion } from "./native-app";

type Loader<T extends ComponentType<any>> = () => Promise<{ default: T }>;

const backgroundLoaders: Array<() => Promise<unknown>> = [];

export function page<T extends ComponentType<any>>(loader: Loader<T>, preload = false) {
  if (preload) backgroundLoaders.push(loader);
  return lazy(() =>
    loader().catch((error) => {
      // The page file is missing: almost always a new version was deployed while
      // this one was open. Reloading picks up the new version.
      if (navigator.onLine && reloadForNewVersion()) return new Promise<{ default: T }>(() => {});
      throw error;
    }),
  );
}

export function preloadPagesWhenIdle() {
  const run = () => {
    // One at a time, so the background work never competes with what the user is doing.
    const next = () => {
      const loader = backgroundLoaders.shift();
      if (!loader) return;
      loader().catch(() => {}).finally(() => window.setTimeout(next, 60));
    };
    next();
  };
  const idle = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => void) | undefined;
  if (idle) idle(run, { timeout: 4000 });
  else window.setTimeout(run, 2500);
}
