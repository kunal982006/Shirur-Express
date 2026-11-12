// server/apns.ts
// Sends push notifications straight to Apple (APNs) for the iOS app.
// Android keeps using FCM (server/firebase.ts); sendPushNotification routes iOS tokens here.
//
// Required env vars (from an APNs Auth Key created at developer.apple.com → Keys):
//   APNS_KEY_P8     contents of the AuthKey_XXXXXXXXXX.p8 file (newlines may be written as \n)
//   APNS_KEY_ID     the 10-character Key ID
//   APNS_TEAM_ID    your Apple Team ID (defaults to Z299YNS44D)
// Optional:
//   APNS_BUNDLE_ID          defaults to com.shirurexpress.app
//   APNS_CRITICAL_ALERTS    set to "true" ONLY after Apple approves the Critical Alerts entitlement

import http2 from "node:http2";
import crypto from "node:crypto";

const BUNDLE_ID = process.env.APNS_BUNDLE_ID || "com.shirurexpress.app";
const TEAM_ID = process.env.APNS_TEAM_ID || "Z299YNS44D";
const KEY_ID = process.env.APNS_KEY_ID;
const KEY_P8 = process.env.APNS_KEY_P8?.replace(/\\n/g, "\n");
const CRITICAL = process.env.APNS_CRITICAL_ALERTS === "true";

const HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;
type ApnsEnv = keyof typeof HOSTS;

// APNs device tokens are pure hex. Apple says not to assume a fixed length: devices usually give
// 64 hex chars, simulators give longer ones. FCM tokens always contain ':' / '-' / '_', never pure hex.
export function isApnsToken(token: string): boolean {
  return /^[0-9a-f]{64,}$/i.test(token);
}

export const isApnsConfigured = Boolean(KEY_ID && KEY_P8);
if (!isApnsConfigured) {
  console.warn("⚠️ APNs NOT configured (APNS_KEY_ID / APNS_KEY_P8 missing). iOS devices will not ring.");
}

// Apple accepts a provider JWT for up to 60 minutes; refresh every 50.
let cachedJwt: { token: string; issuedAt: number } | null = null;
function providerToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.issuedAt < 50 * 60) return cachedJwt.token;

  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "ES256", kid: KEY_ID })}.${b64({ iss: TEAM_ID, iat: now })}`;
  const signature = crypto
    .sign("sha256", Buffer.from(unsigned), { key: KEY_P8!, dsaEncoding: "ieee-p1363" })
    .toString("base64url");
  cachedJwt = { token: `${unsigned}.${signature}`, issuedAt: now };
  return cachedJwt.token;
}

// One long-lived HTTP/2 connection per environment, as Apple recommends.
const sessions: Partial<Record<ApnsEnv, http2.ClientHttp2Session>> = {};
function session(env: ApnsEnv): http2.ClientHttp2Session {
  const existing = sessions[env];
  if (existing && !existing.closed && !existing.destroyed) return existing;
  const s = http2.connect(HOSTS[env]);
  s.on("error", (err) => console.error(`[APNs] ${env} connection error:`, err.message));
  s.on("close", () => { if (sessions[env] === s) delete sessions[env]; });
  sessions[env] = s;
  return s;
}

function post(env: ApnsEnv, deviceToken: string, headers: Record<string, string>, body: string)
  : Promise<{ status: number; reason?: string; apnsId?: string }> {
  return new Promise((resolve, reject) => {
    const req = session(env).request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${providerToken()}`,
      "apns-topic": BUNDLE_ID,
      ...headers,
    });
    let data = "";
    let status = 0;
    let apnsId: string | undefined;
    req.setEncoding("utf8");
    req.setTimeout(10_000, () => req.close(http2.constants.NGHTTP2_CANCEL));
    req.on("response", (h) => { status = Number(h[":status"]); apnsId = h["apns-id"] as string | undefined; });
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => {
      let reason: string | undefined;
      try { reason = data ? JSON.parse(data).reason : undefined; } catch { reason = data; }
      resolve({ status, reason, apnsId });
    });
    req.on("error", reject);
    req.end(body);
  });
}

// Xcode debug builds get sandbox tokens; TestFlight / App Store builds get production tokens.
// We can't tell which from the token, so try production first and remember what worked.
const tokenEnv = new Map<string, ApnsEnv>();

export async function sendApnsNotification(deviceToken: string, payload: {
  type: "ORDER_REQUEST" | "ORDER_UPDATE";
  title?: string;
  body?: string;
  data?: Record<string, string>;
  repeat?: number; // set by ring-repeat.ts for the 2nd, 3rd... ring of the same order
}): Promise<{ success: boolean; messageId?: string; error?: any }> {
  if (!isApnsConfigured) {
    console.warn(`[APNs Mock] Push to ${deviceToken.substring(0, 12)}...:`, payload.type);
    return { success: false, error: "APNs not configured" };
  }

  const isRing = payload.type === "ORDER_REQUEST";
  const aps: Record<string, any> = {
    alert: { title: payload.title || "Shirur Express", body: payload.body || "" },
    badge: 1,
  };
  if (isRing) {
    // ring.caf (29s) ships inside the iOS app bundle. Critical sounds play even on silent/DND
    // but need Apple's approval; until then "time-sensitive" breaks through Focus modes.
    aps.sound = CRITICAL ? { critical: 1, name: "ring.caf", volume: 1.0 } : "ring.caf";
    aps["interruption-level"] = CRITICAL ? "critical" : "time-sensitive";
    aps["relevance-score"] = 1;
    aps["thread-id"] = "incoming-orders";
  } else {
    aps.sound = "default";
  }

  const body = JSON.stringify({ aps, type: payload.type, ...(payload.data || {}) });
  const headers: Record<string, string> = {
    "apns-push-type": "alert",
    "apns-priority": "10",
    // A new order is useless after a few minutes; don't deliver stale rings.
    "apns-expiration": String(Math.floor(Date.now() / 1000) + (isRing ? 300 : 3600)),
  };
  // Each repeat ring gets its own id so iOS shows it as a new alert and plays the sound again
  // (all rings stay grouped under the "incoming-orders" thread).
  if (payload.data?.orderId) {
    const suffix = payload.repeat ? `-r${payload.repeat}` : "";
    headers["apns-collapse-id"] = (payload.data.orderId.slice(0, 56) + suffix).slice(0, 64);
  }

  try {
    const first: ApnsEnv = tokenEnv.get(deviceToken) || "production";
    let env = first;
    let res = await post(env, deviceToken, headers, body);
    if (res.status === 400 && res.reason === "BadDeviceToken" && !tokenEnv.has(deviceToken)) {
      env = first === "production" ? "sandbox" : "production";
      res = await post(env, deviceToken, headers, body);
    }
    if (res.status === 200) {
      tokenEnv.set(deviceToken, env);
      console.log(`✅ APNs sent (${env}):`, res.apnsId);
      return { success: true, messageId: res.apnsId };
    }
    console.error(`❌ APNs send error (${env}) ${res.status}:`, res.reason);
    return { success: false, error: res.reason || `HTTP ${res.status}` };
  } catch (error: any) {
    console.error("❌ APNs send error:", error.message);
    return { success: false, error: error.message };
  }
}
