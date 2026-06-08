/**
 * HMAC receipt for the unauthenticated /notifications/:id/delivered endpoint.
 *
 * The receipt is embedded in each push payload at send time so the SW can
 * include it when POSTing /delivered without needing a user session.
 * Receipt = HMAC-SHA256(notifId:walletId, DELIVERY_SECRET).slice(0, 32)
 */
import { createHmac } from "crypto";

const DELIVERY_SECRET =
  process.env.SESSION_SECRET ||
  process.env.ADMIN_TOKEN ||
  "lirapro-delivery-2026";

export function makeDeliveryReceipt(notifId: number, walletId: string): string {
  return createHmac("sha256", DELIVERY_SECRET)
    .update(`${notifId}:${walletId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyDeliveryReceipt(
  notifId: number,
  walletId: string,
  receipt: string,
): boolean {
  const expected = makeDeliveryReceipt(notifId, walletId);
  if (expected.length !== receipt.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ receipt.charCodeAt(i);
  }
  return diff === 0;
}
