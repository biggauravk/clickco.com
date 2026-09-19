# Razorpay testing and Live Mode setup

## 1. Webhook endpoint

The endpoint is:

```text
POST /api/razorpay/webhook
```

For Razorpay Dashboard delivery, the URL must be publicly reachable. Configure the same webhook secret in Razorpay Dashboard and `RAZORPAY_WEBHOOK_SECRET`.

## 2. Frontend Checkout modal review

The checkout integration is in `src/routes/checkout.tsx` and follows this sequence:

1. The customer enters name, phone, and address.
2. The browser loads `https://checkout.razorpay.com/v1/checkout.js` once and reuses the promise.
3. The browser calls `createRazorpayOrder`, which reads the current admin-managed product prices from PostgreSQL and creates a Razorpay order server-side.
4. The server returns only the public Key ID, Razorpay order ID, amount in paise, and a short-lived signed quote.
5. The browser opens the Razorpay Checkout modal with the current Meridian theme.
6. UPI, cards, netbanking, and wallets are enabled. PayLater, EMI, cardless EMI, and COD are not offered.
7. Razorpay calls the client `handler` after payment completion.
8. The browser sends the returned payment ID, order ID, signature, quote, and customer details to `verifyRazorpayPayment`.
9. The server verifies the HMAC signature, retrieves the Razorpay order and payment, requires the exact amount and `captured` status, then creates the local order and decrements stock transactionally.

The modal is embedded in the checkout experience; there is no top-level redirect and no `callback_url`. Razorpay hosts the sensitive card/UPI fields, so those details are never sent to Meridian.

One operational detail is intentional: the local summary before payment uses the cart’s display values, while the amount charged and final order total come from the server quote generated from the Admin Panel prices. After the server quote is created, the UI displays the confirmed amount for that payment attempt.

## 3. Configure Razorpay Live Mode on Vercel

### Create or switch to Live credentials

In the Razorpay Dashboard, switch to **Live Mode**, then open **Account & Settings → API Keys** and generate or copy the Live Key ID and Live Key Secret. Do not use the Test Mode keys in Production.

### Configure Vercel variables

Open the Vercel project and go to **Settings → Environment Variables**. Add these variables for the **Production** environment:

| Variable | Value | Exposure |
|---|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Live Key ID, usually beginning with `rzp_live_` | Used in the browser as the public checkout key |
| `RAZORPAY_KEY_SECRET` | Razorpay Live Key Secret | Server-only encrypted secret |
| `RAZORPAY_WEBHOOK_SECRET` | A strong secret configured for the Razorpay Live webhook | Server-only encrypted secret |

The existing required variables must also remain configured, including `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `JWT_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`. `SUPABASE_MEDIA_BUCKET` is optional and defaults to `meridian-media`; configure it only if the production Storage bucket uses another name.

Do not prefix any Razorpay secret with `VITE_`, `NEXT_PUBLIC_`, or another browser-exposure prefix. Do not commit `.env` files or secret values.

### Configure the Live webhook

In Razorpay Dashboard **Live Mode**, open **Webhooks**, add the deployed URL below, and use the same secret stored in Vercel:

```text
https://YOUR_PRODUCTION_DOMAIN/api/razorpay/webhook
```

Enable at least:

- `payment.captured`
- `payment.failed`

Redeploy the Vercel project after saving variables. Then make a small real transaction and verify the payment in both Razorpay Dashboard and the Meridian Admin Panel. Use a low-value transaction and confirm the production domain, webhook secret, and live keys before testing.

### Payment method configuration

Review Razorpay’s Live Mode payment configuration and enable the instruments the business accepts. The application requests UPI, cards, netbanking, and wallets at runtime and disables PayLater, EMI, and cardless EMI. COD is not a Razorpay Checkout method and is not implemented by this application.
