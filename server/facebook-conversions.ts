/**
 * Facebook / Meta Conversions API — Server-Side Event Tracking
 * 
 * Sends events directly from the server to Meta's Conversions API.
 * This provides reliable tracking that bypasses ad blockers and browser restrictions.
 * 
 * Setup:
 * 1. Get your Conversions API access token from Meta Business Suite → Events Manager
 * 2. Set it as FACEBOOK_CONVERSIONS_API_TOKEN in .env
 * 3. Set your Pixel ID as VITE_FACEBOOK_PIXEL_ID in .env
 * 
 * Reference: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PIXEL_ID = process.env.VITE_FACEBOOK_PIXEL_ID;
const ACCESS_TOKEN = process.env.FACEBOOK_CONVERSIONS_API_TOKEN;
const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversionsApiUserData {
  /** User's email (will be hashed before sending) */
  email?: string;
  /** User's phone number with country code (will be hashed) */
  phone?: string;
  /** User's first name (will be hashed) */
  firstName?: string;
  /** User's last name (will be hashed) */
  lastName?: string;
  /** Client IP address (forwarded from request) */
  clientIpAddress?: string;
  /** Client User Agent (forwarded from request) */
  clientUserAgent?: string;
  /** Facebook click ID (from fbclid URL param) */
  fbc?: string;
  /** Facebook browser ID (from _fbp cookie) */
  fbp?: string;
  /** External ID (e.g., your user ID — will be hashed) */
  externalId?: string;
}

export interface ConversionsApiCustomData {
  /** Currency code (e.g., 'INR') */
  currency?: string;
  /** Monetary value of the event */
  value?: number;
  /** Content name */
  contentName?: string;
  /** Content category */
  contentCategory?: string;
  /** Content IDs */
  contentIds?: string[];
  /** Content type */
  contentType?: string;
  /** Number of items */
  numItems?: number;
  /** Order ID for deduplication */
  orderId?: string;
  /** Search query string */
  searchString?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hash a value for PII normalization (Meta requirement) */
function hashValue(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

/** Check if the Conversions API is configured */
export function isConversionsApiConfigured(): boolean {
  return !!(
    PIXEL_ID &&
    PIXEL_ID !== 'YOUR_PIXEL_ID' &&
    ACCESS_TOKEN &&
    ACCESS_TOKEN !== 'YOUR_CONVERSIONS_API_TOKEN'
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a server-side event to Meta's Conversions API.
 * 
 * @param eventName — Standard event name (e.g., 'Purchase', 'Lead', 'ViewContent')
 * @param userData — User data for matching (email, phone, IP, etc.)
 * @param customData — Event-specific data (value, currency, content IDs, etc.)
 * @param eventSourceUrl — The URL where the event occurred
 * 
 * @example
 *   await trackServerEvent('Purchase', {
 *     email: 'user@example.com',
 *     phone: '+919876543210',
 *     clientIpAddress: req.ip,
 *     clientUserAgent: req.headers['user-agent'],
 *   }, {
 *     currency: 'INR',
 *     value: 350,
 *     contentIds: ['order-123'],
 *     contentType: 'product',
 *   }, 'https://shirur-express.onrender.com/checkout');
 */
export async function trackServerEvent(
  eventName: string,
  userData: ConversionsApiUserData,
  customData?: ConversionsApiCustomData,
  eventSourceUrl?: string
): Promise<void> {
  if (!isConversionsApiConfigured()) {
    console.warn('[FacebookConversions] Not configured — skipping server-side event:', eventName);
    return;
  }

  try {
    // Build user_data with hashed PII
    const hashedUserData: Record<string, string | undefined> = {};
    if (userData.email) hashedUserData.em = hashValue(userData.email);
    if (userData.phone) hashedUserData.ph = hashValue(userData.phone);
    if (userData.firstName) hashedUserData.fn = hashValue(userData.firstName);
    if (userData.lastName) hashedUserData.ln = hashValue(userData.lastName);
    if (userData.clientIpAddress) hashedUserData.client_ip_address = userData.clientIpAddress;
    if (userData.clientUserAgent) hashedUserData.client_user_agent = userData.clientUserAgent;
    if (userData.fbc) hashedUserData.fbc = userData.fbc;
    if (userData.fbp) hashedUserData.fbp = userData.fbp;
    if (userData.externalId) hashedUserData.external_id = hashValue(userData.externalId);

    // Build custom_data
    const eventCustomData: Record<string, unknown> = {};
    if (customData?.currency) eventCustomData.currency = customData.currency;
    if (customData?.value !== undefined) eventCustomData.value = customData.value;
    if (customData?.contentName) eventCustomData.content_name = customData.contentName;
    if (customData?.contentCategory) eventCustomData.content_category = customData.contentCategory;
    if (customData?.contentIds) eventCustomData.content_ids = customData.contentIds;
    if (customData?.contentType) eventCustomData.content_type = customData.contentType;
    if (customData?.numItems) eventCustomData.num_items = customData.numItems;
    if (customData?.orderId) eventCustomData.order_id = customData.orderId;
    if (customData?.searchString) eventCustomData.search_string = customData.searchString;

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      action_source: 'website' as const,
      event_source_url: eventSourceUrl || 'https://shirur-express.onrender.com',
      user_data: hashedUserData,
      custom_data: eventCustomData,
      // Use orderId for deduplication if available
      ...(customData?.orderId && { event_id: `${eventName}_${customData.orderId}` }),
    };

    const url = `${BASE_URL}/${PIXEL_ID}/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [event],
        access_token: ACCESS_TOKEN,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[FacebookConversions] API error:', response.status, errorBody);
    } else {
      const result = await response.json();
      console.log(`[FacebookConversions] ${eventName} event sent successfully:`, result);
    }
  } catch (error) {
    console.error('[FacebookConversions] Failed to send event:', eventName, error);
    // Don't throw — server-side tracking failures should never break the user flow
  }
}

// ---------------------------------------------------------------------------
// Convenience Methods
// ---------------------------------------------------------------------------

/**
 * Track a Purchase event server-side.
 * Call this when an order is confirmed/paid.
 */
export async function trackPurchase(
  userData: ConversionsApiUserData,
  orderId: string,
  totalAmount: number,
  itemIds: string[],
  eventSourceUrl?: string
): Promise<void> {
  return trackServerEvent('Purchase', userData, {
    currency: 'INR',
    value: totalAmount,
    contentIds: itemIds,
    contentType: 'product',
    numItems: itemIds.length,
    orderId,
  }, eventSourceUrl);
}

/**
 * Track a Lead event server-side.
 * Call this when a user signs up.
 */
export async function trackLead(
  userData: ConversionsApiUserData,
  eventSourceUrl?: string
): Promise<void> {
  return trackServerEvent('Lead', userData, {
    contentName: 'User Signup',
    contentCategory: 'registration',
  }, eventSourceUrl);
}
