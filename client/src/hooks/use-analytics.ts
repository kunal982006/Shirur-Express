// client/src/hooks/use-analytics.ts
// Comprehensive user behavior tracking for admin analytics dashboard

import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import api from "@/lib/api";

// Generate a unique session ID (persisted in sessionStorage)
function getSessionId(): string {
  let sessionId = sessionStorage.getItem("se_session_id");
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("se_session_id", sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

// Batch queue for analytics events (fire-and-forget)
let eventQueue: any[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];
  try {
    await api.post("/analytics/track-batch", { events: batch });
  } catch {
    // If batch fails, try individually (silently ignore failures)
    // Analytics should never block UX
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 3000); // Flush every 3 seconds max
}

function queueEvent(event: any) {
  eventQueue.push(event);
  if (eventQueue.length >= 10) {
    // Flush immediately if we have 10+ events
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    flushEvents();
  } else {
    scheduleFlush();
  }
}

// Flush remaining events on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (eventQueue.length > 0) {
      // Use sendBeacon for reliable delivery on page close
      const blob = new Blob([JSON.stringify({ events: eventQueue })], { type: "application/json" });
      const apiBase = (import.meta as any).env?.VITE_API_URL || "";
      navigator.sendBeacon(`${apiBase}/api/analytics/track-batch`, blob);
      eventQueue = [];
    }
  });
}

/**
 * Main analytics hook — drop into App.tsx to auto-track everything.
 * Tracks: page views, time on page, navigation flow, device type.
 */
export function useAnalyticsTracker() {
  const [location] = useLocation();
  const prevPageRef = useRef<string>("");
  const pageEntryTimeRef = useRef<number>(Date.now());
  const sessionId = getSessionId();
  const deviceType = getDeviceType();

  // Track page view on route change
  useEffect(() => {
    const prevPage = prevPageRef.current;
    const now = Date.now();

    // If we were on a previous page, record duration
    if (prevPage && prevPage !== location) {
      const durationSec = Math.round((now - pageEntryTimeRef.current) / 1000);
      if (durationSec > 0 && durationSec < 3600) {
        // Send page_leave event for the previous page
        queueEvent({
          sessionId,
          eventType: "page_leave",
          page: prevPage,
          referrer: null,
          duration: durationSec,
          deviceType,
          userAgent: navigator.userAgent,
          metadata: { nextPage: location },
        });
      }
    }

    // Track new page view
    queueEvent({
      sessionId,
      eventType: "page_view",
      page: location,
      referrer: prevPage || null,
      duration: null,
      deviceType,
      userAgent: navigator.userAgent,
      metadata: null,
    });

    prevPageRef.current = location;
    pageEntryTimeRef.current = now;
  }, [location, sessionId, deviceType]);

  // Track session start
  useEffect(() => {
    const isNewSession = !sessionStorage.getItem("se_session_started");
    if (isNewSession) {
      sessionStorage.setItem("se_session_started", "1");
      queueEvent({
        sessionId,
        eventType: "session_start",
        page: location,
        referrer: document.referrer || null,
        duration: null,
        deviceType,
        userAgent: navigator.userAgent,
        metadata: { entryPage: location },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Manual analytics event tracker for specific actions.
 * Use inside components to track searches, clicks, cart actions, etc.
 */
export function useTrackEvent() {
  const [location] = useLocation();
  const sessionId = getSessionId();
  const deviceType = getDeviceType();

  const trackEvent = useCallback(
    (eventType: string, metadata?: Record<string, any>) => {
      queueEvent({
        sessionId,
        eventType,
        page: location,
        referrer: null,
        duration: null,
        deviceType,
        userAgent: navigator.userAgent,
        metadata: metadata || null,
      });
    },
    [location, sessionId, deviceType]
  );

  return trackEvent;
}
