import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { parseRazorpayWebhook } from "@/lib/store/razorpay-webhook";

export const Route = createFileRoute("/api/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const eventId = request.headers.get("x-razorpay-event-id");
        try {
          const result = parseRazorpayWebhook(rawBody, signature, eventId);
          if (result.orderId && ["payment.captured", "payment.failed"].includes(result.event ?? "")) {
            const sql = await getSql();
            const nextStatus = result.event === "payment.captured" ? "paid" : "pending";
            await sql`
              update orders
              set status = ${nextStatus}
              where order_number like ${`%-${result.orderId}`}
                and status not in ('cancelled', 'refunded')
            `;
          }
          return Response.json(result, { status: 200 });
        } catch (error) {
          return Response.json({ accepted: false, error: error instanceof Error ? error.message : "Invalid webhook." }, { status: 400 });
        }
      },
    },
  },
});
