import { useEffect } from "react";

// The Android app wraps the site in a native swipe-to-refresh layer that reloads the page
// whenever the page itself is scrolled to the top, even while the finger is scrolling a list
// inside a popup or sheet. This guard switches that layer off while a touch is inside a popup
// or any other inner scrolling area.

const POPUP = '[role="dialog"], [role="alertdialog"], [data-vaul-drawer]';

function isInsideInnerScroller(target: EventTarget | null): boolean {
    let node = target instanceof Element ? target : null;
    if (node?.closest(POPUP)) return true;
    while (node && node !== document.body && node !== document.documentElement) {
        const overflowY = getComputedStyle(node).overflowY;
        if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) return true;
        node = node.parentElement;
    }
    return false;
}

export default function PullToRefreshGuard() {
    useEffect(() => {
        const setNativeRefresh = (enabled: boolean) => {
            try {
                (window as any).AndroidApp?.setPullToRefreshEnabled?.(enabled);
            } catch {
                // Older app versions have no such method.
            }
        };

        const onTouchStart = (event: TouchEvent) => {
            const inner = isInsideInnerScroller(event.target);
            setNativeRefresh(!inner);
            // App versions without the method above only refresh when the page is at its very
            // top, so move it down by one pixel for the duration of the gesture.
            if (inner && window.scrollY < 1) window.scrollTo(0, 1);
        };

        document.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
        return () => {
            document.removeEventListener("touchstart", onTouchStart, { capture: true });
            setNativeRefresh(true);
        };
    }, []);
    return null;
}
