// server/razorpay-client.ts (NEW FILE)

import Razorpay from 'razorpay';
import crypto from 'crypto';

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn('!!! Razorpay environment variables (KEY_ID, KEY_SECRET) not set. Payment API will fail.');
}

export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Verifies the Razorpay payment signature
 * @param orderId - The Razorpay Order ID
 * @param paymentId - The Razorpay Payment ID
 * @param signature - The signature received from frontend
 * @returns boolean
 */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
  hmac.update(orderId + "|" + paymentId);
  const generatedSignature = hmac.digest('hex');

  return generatedSignature === signature;
}

/**
 * Verifies the Razorpay webhook signature
 * @param rawBody - The raw request body
 * @param signature - The signature from 'X-Razorpay-Signature' header
 * @returns boolean
 */
export function verifyWebhookSignature(rawBody: string | Buffer, signature: string): boolean {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set. Webhook verification will fail.');
    return false;
  }

  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!);
  hmac.update(rawBody);
  const generatedSignature = hmac.digest('hex');

  return generatedSignature === signature;
}