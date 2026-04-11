/**
 * SwipeBackGesture - iOS-style edge swipe back gesture handler
 * 
 * Detects horizontal swipe gestures starting from the left edge of the screen
 * and navigates back using browser history. This is especially important for
 * iOS PWAs/Safari where the native back swipe may not work in standalone mode.
 */
import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
  tracking: boolean;
}

export default function SwipeBackGesture() {
  const [location, setLocation] = useLocation();
  const swipeRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    tracking: false,
  });

  const isHomePage = location === "/" || location === "";

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/");
    }
  }, [setLocation]);

  useEffect(() => {
    // Don't attach swipe listener on home page
    if (isHomePage) return;

    const EDGE_WIDTH = 30; // px from left edge to start tracking
    const MIN_SWIPE_DISTANCE = 80; // minimum horizontal distance for a swipe
    const MAX_VERTICAL_DRIFT = 100; // maximum vertical drift allowed
    const MAX_SWIPE_TIME = 500; // maximum time in ms for the swipe

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only track swipes starting from the left edge
      if (touch.clientX <= EDGE_WIDTH) {
        swipeRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          tracking: true,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Optional: Could add visual feedback here (e.g., page peek animation)
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!swipeRef.current.tracking) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeRef.current.startX;
      const deltaY = Math.abs(touch.clientY - swipeRef.current.startY);
      const elapsed = Date.now() - swipeRef.current.startTime;

      swipeRef.current.tracking = false;

      // Check if the swipe qualifies as a "back" gesture
      if (
        deltaX >= MIN_SWIPE_DISTANCE && // Swiped far enough to the right
        deltaY <= MAX_VERTICAL_DRIFT && // Not too much vertical movement
        elapsed <= MAX_SWIPE_TIME // Fast enough swipe
      ) {
        handleBack();
      }
    };

    const handleTouchCancel = () => {
      swipeRef.current.tracking = false;
    };

    // Use passive listeners for better scroll performance
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [isHomePage, handleBack]);

  // This component doesn't render anything visible
  return null;
}
