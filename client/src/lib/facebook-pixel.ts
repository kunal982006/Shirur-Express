/**
 * Facebook (Meta) Pixel Helper
 * 
 * Provides type-safe wrappers around the Facebook Pixel SDK for tracking
 * standard and custom events used in Meta Ads campaigns.
 * 
 * Usage:
 *   import { initFacebookPixel, trackEvent, FacebookStandardEvent } from '@/lib/facebook-pixel';
 *   initFacebookPixel();  // Call once on app mount
 *   trackEvent(FacebookStandardEvent.ViewContent, { content_name: 'Hotel RK' });
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Standard Facebook Pixel events recognized by Meta Ads */
export enum FacebookStandardEvent {
  AddPaymentInfo = 'AddPaymentInfo',
  AddToCart = 'AddToCart',
  AddToWishlist = 'AddToWishlist',
  CompleteRegistration = 'CompleteRegistration',
  Contact = 'Contact',
  CustomizeProduct = 'CustomizeProduct',
  Donate = 'Donate',
  FindLocation = 'FindLocation',
  InitiateCheckout = 'InitiateCheckout',
  Lead = 'Lead',
  PageView = 'PageView',
  Purchase = 'Purchase',
  Schedule = 'Schedule',
  Search = 'Search',
  StartTrial = 'StartTrial',
  SubmitApplication = 'SubmitApplication',
  Subscribe = 'Subscribe',
  ViewContent = 'ViewContent',
}

/** Common parameter shapes for standard events */
export interface FacebookEventParams {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: string;
  value?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Extend Window for the fbq global
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: (...args: unknown[]) => void };
    _fbq: typeof Window.prototype.fbq;
  }
}

// ---------------------------------------------------------------------------
// Pixel ID from environment
// ---------------------------------------------------------------------------

const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID as string | undefined;

/**
 * Whether the pixel has been initialized in this session.
 * Prevents double-initialization on React StrictMode re-mounts.
 */
let pixelInitialized = false;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialise the Meta Pixel.
 * Safe to call multiple times — subsequent calls are no-ops.
 * Skipped entirely when VITE_FACEBOOK_PIXEL_ID is not set (dev/test).
 */
export function initFacebookPixel(): void {
  if (pixelInitialized) return;
  if (!PIXEL_ID || PIXEL_ID === 'YOUR_PIXEL_ID') {
    console.warn('[FacebookPixel] VITE_FACEBOOK_PIXEL_ID not configured — pixel disabled.');
    return;
  }

  // The standard Meta Pixel base code (minified inline loader)
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  pixelInitialized = true;
  console.log('[FacebookPixel] Initialized with Pixel ID:', PIXEL_ID);
}

// ---------------------------------------------------------------------------
// Native Android Bridge
// ---------------------------------------------------------------------------

/** Check if running inside the Shirur Express Android WebView app */
function isNativeApp(): boolean {
  return !!(window as any).AndroidApp?.isNativeApp?.();
}

/**
 * Forward an event to the native Android Facebook SDK via the JS bridge.
 * This provides more reliable tracking for in-app events than browser pixel alone.
 */
function forwardToNativeSdk(eventName: string, params?: Record<string, unknown>): void {
  try {
    const bridge = (window as any).AndroidApp;
    if (!bridge) return;

    const paramsJson = JSON.stringify(params || {});

    // Use the dedicated purchase method for Purchase events
    if (eventName === FacebookStandardEvent.Purchase && params?.value && params?.currency) {
      bridge.logFacebookPurchase?.(
        Number(params.value),
        String(params.currency),
        paramsJson
      );
    } else {
      bridge.logFacebookEvent?.(eventName, paramsJson);
    }
  } catch (e) {
    console.warn('[FacebookPixel] Native bridge forward failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Track a standard Facebook Pixel event.
 *
 * @example
 *   trackEvent(FacebookStandardEvent.ViewContent, {
 *     content_name: 'Hotel Sangram',
 *     content_type: 'restaurant',
 *     content_ids: ['42'],
 *     value: 200,
 *     currency: 'INR',
 *   });
 */
export function trackEvent(eventName: FacebookStandardEvent, params?: FacebookEventParams): void {
  // Web Pixel
  if (pixelInitialized && window.fbq) {
    if (params) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  }

  // Native Android SDK (via JS bridge)
  if (isNativeApp()) {
    forwardToNativeSdk(eventName, params as Record<string, unknown>);
  }
}

/**
 * Track a *custom* event (not in Facebook's standard list).
 *
 * @example
 *   trackCustomEvent('ShareItem', { item_id: '123' });
 */
export function trackCustomEvent(eventName: string, params?: Record<string, unknown>): void {
  // Web Pixel
  if (pixelInitialized && window.fbq) {
    if (params) {
      window.fbq('trackCustom', eventName, params);
    } else {
      window.fbq('trackCustom', eventName);
    }
  }

  // Native Android SDK
  if (isNativeApp()) {
    forwardToNativeSdk(eventName, params);
  }
}

/**
 * Fire a PageView event. Call this on route changes.
 */
export function trackPageView(): void {
  if (pixelInitialized && window.fbq) {
    window.fbq('track', 'PageView');
  }

  // Native Android SDK
  if (isNativeApp()) {
    forwardToNativeSdk('PageView');
  }
}
