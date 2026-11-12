// server/ring-repeat.ts
// iOS can't loop a ringtone the way Android's IncomingOrderActivity does: a notification sound plays
// once, for at most 30 seconds. To get the same "keeps ringing until someone acts" behaviour we
// re-send the ring to each iPhone every RING_INTERVAL_MS while:
//   - the order's state (status + assigned rider) hasn't changed since the first ring, and
//   - that iPhone hasn't opened the app (the app calls /api/users/push-ack, see stopRingsForToken).

import { sendApnsNotification } from "./apns";

const RING_INTERVAL_MS = 30_000; // ring.caf is 29s long
const MAX_REPEATS = 5;           // first ring + 5 repeats ≈ 3 minutes of ringing

type RingPayload = Parameters<typeof sendApnsNotification>[1];
// Returns a fingerprint of the order's current state, or null if it can't be found / isn't tracked.
type OrderStateResolver = (orderType: string, orderId: string) => Promise<string | null>;

let resolveOrderState: OrderStateResolver | null = null;
export function setOrderStateResolver(resolver: OrderStateResolver) {
  resolveOrderState = resolver;
}

const active = new Map<string, ReturnType<typeof setTimeout>>(); // key: `${token}|${orderId}`

export async function scheduleRepeatRing(token: string, payload: RingPayload) {
  const orderId = payload.data?.orderId;
  const orderType = payload.data?.orderType;
  if (!resolveOrderState || !orderId || !orderType) return;

  const key = `${token}|${orderId}`;
  if (active.has(key)) return; // already ringing this device for this order

  let initial: string | null;
  try {
    initial = await resolveOrderState(orderType, orderId);
  } catch {
    return;
  }
  if (initial === null) return;

  let repeats = 0;
  const tick = async () => {
    if (!active.has(key)) return; // stopped (app opened) while we were waiting
    repeats++;
    let current: string | null = null;
    try { current = await resolveOrderState!(orderType, orderId); } catch { /* treat as changed */ }
    if (current !== initial || !active.has(key)) {
      active.delete(key);
      return;
    }
    console.log(`[Ring Repeat] Order ${orderId} still waiting, ringing iPhone again (${repeats}/${MAX_REPEATS})`);
    await sendApnsNotification(token, { ...payload, repeat: repeats });
    if (repeats >= MAX_REPEATS || !active.has(key)) {
      active.delete(key);
      return;
    }
    active.set(key, setTimeout(tick, RING_INTERVAL_MS));
  };
  active.set(key, setTimeout(tick, RING_INTERVAL_MS));
}

// Called when the user opens the app on that iPhone: stop every pending repeat for that device.
export function stopRingsForToken(token: string): number {
  let stopped = 0;
  for (const [key, timer] of Array.from(active.entries())) {
    if (key.startsWith(`${token}|`)) {
      clearTimeout(timer);
      active.delete(key);
      stopped++;
    }
  }
  return stopped;
}
