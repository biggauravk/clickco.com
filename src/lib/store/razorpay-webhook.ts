import { createHmac, timingSafeEqual } from "node:crypto";

export type RazorpayWebhookResult = {
  accepted: true;
  event: string | null;
  eventId: string | null;
  duplicate: boolean;
  orderId: string | null;
  paymentId: string | null;
  paymentStatus: string | null;
};

function webhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) throw new Error("Razorpay webhook secret is not configured.");
  return secret;
}

export function verifyRazorpayWebhookSignature(rawBody: string, receivedSignature: string, secret = webhookSecret()): boolean {
  if (!receivedSignature || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const actual = Buffer.from(receivedSignature.trim(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
}

export function parseRazorpayWebhook(rawBody: string, receivedSignature: string, eventId: string | null, secret = webhookSecret()): RazorpayWebhookResult {
  if (!verifyRazorpayWebhookSignature(rawBody, receivedSignature, secret)) throw new Error("Invalid Razorpay webhook signature.");
  let payload: { event?: unknown; payload?: { payment?: { entity?: { id?: unknown; order_id?: unknown; status?: unknown } } } };
  try {
    payload = JSON.parse(rawBody) as { event?: unknown };
  } catch {
    throw new Error("Invalid Razorpay webhook payload.");
  }
  const event = typeof payload.event === "string" ? payload.event : null;
  const payment = payload.payload?.payment?.entity;
  return {
    accepted: true,
    event,
    eventId,
    duplicate: false,
    orderId: typeof payment?.order_id === "string" ? payment.order_id : null,
    paymentId: typeof payment?.id === "string" ? payment.id : null,
    paymentStatus: typeof payment?.status === "string" ? payment.status : null,
  };
}
