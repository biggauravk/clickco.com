# Meridian Vercel environment variables

Configure the Razorpay credentials below in addition to the existing variables. Keep the secret server-only.

Configure the following thirteen variables in Vercel under **Project Settings → Environment Variables**. Add them for **Production**, **Preview**, and **Development** as appropriate.

| Variable | Required value |
|---|---|
| `DATABASE_URL` | The existing Supabase PostgreSQL connection string used by the project. Use the server-side connection string, not a browser API key. |
| `BETTER_AUTH_SECRET` | A long random secret used by Better Auth for customer authentication sessions. |
| `BETTER_AUTH_URL` | The exact deployed application URL, for example `https://your-domain.vercel.app`, without a trailing slash. For Preview, use the preview URL if preview auth is required. |
| `JWT_SECRET` | A separate long random secret used to sign the owner/admin session cookie. Do not reuse `BETTER_AUTH_SECRET`. |
| `OWNER_EMAIL` | The email address allowed to sign in at `/admin/login`. |
| `OWNER_PASSWORD` | The owner/admin password for `/admin/login`. Store it as a Vercel encrypted secret. |
| `SUPABASE_URL` | Existing Supabase project URL, such as `https://your-project.supabase.co`. |
| `SUPABASE_SERVICE_ROLE_KEY` | Existing Supabase server-side service-role key. Store it as an encrypted Vercel secret and never expose it as `VITE_*`. |
| `SUPABASE_MEDIA_BUCKET` | Optional Storage bucket name; defaults to `meridian-media`. |
| `RAZORPAY_KEY_ID` | Razorpay public Key ID used by the in-site Checkout modal. |
| `RAZORPAY_KEY_SECRET` | Razorpay server-only API secret. Store it as an encrypted Vercel secret and never expose it to browser code. |
| `RAZORPAY_WEBHOOK_SECRET` | The webhook secret configured in Razorpay Dashboard for `POST /api/razorpay/webhook`. |
| `RAZORPAY_CHECKOUT_CONFIG_ID` | Optional Razorpay Dashboard payment configuration ID. Configure only UPI, cards, netbanking, and wallets in that configuration. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required for the media library. `SUPABASE_MEDIA_BUCKET` is optional. No `SUPABASE_ANON_KEY` or `VITE_*` Supabase variable is required. The service-role key is used only in server functions for signed-upload creation, metadata finalization, listing, and deletion; it must never be sent to the browser. File bytes are uploaded directly from the browser to Supabase Storage using a short-lived signed URL, so Vercel’s 4.5 MB function payload limit is not involved.

Razorpay Checkout opens as an in-site modal rather than a top-level redirect. The server creates each Razorpay order using the current Admin Panel prices, signs a short-lived price quote, and verifies the Razorpay signature, remote order amount, currency, and captured payment status before creating the local order. The checkout enables UPI, cards, netbanking, and wallets while disabling Pay Later, EMI, and cardless EMI; COD is not offered. If `RAZORPAY_CHECKOUT_CONFIG_ID` is set, the same Dashboard configuration is passed at order creation and modal launch.

In Razorpay Dashboard, configure the webhook URL as `https://<production-domain>/api/razorpay/webhook`, use the same value as `RAZORPAY_WEBHOOK_SECRET`, and enable payment-captured and payment-failed events. The webhook validates the raw request signature before updating a matching local order; payment fulfillment still requires the separate server-side signature and captured-payment verification.

`SUPABASE_URL` must be the Supabase project URL (`https://<project-ref>.supabase.co`), not `DATABASE_URL`. `SUPABASE_SERVICE_ROLE_KEY` must be the server-side service-role key from **Project Settings → API**, not the publishable/anon key. The upload code first checks whether the configured bucket already exists, then attempts creation only when needed; an existing-bucket response is treated as success.

## Deployment

Use the repository root as the Vercel project root. The existing `package.json` provides the build command through `npm run build`, which generates the Vercel Nitro output. Do not commit `.env` files, database passwords, `OWNER_PASSWORD`, or any secret values to GitHub.

The existing database schema is reused as-is. Do not run the checked-in schema as a reset/recreation operation against a production database.

Run `supabase/media-library.sql` once against the existing Supabase database to add the non-destructive `media_assets` registry table. The Storage bucket is named `meridian-media` by default; the server attempts to create it on the first authenticated upload. Existing product, brand, and storefront columns remain unchanged.

## Existing media prerequisite

Existing database media references must already point to deployed public assets or Supabase Storage URLs before removing any legacy repository media. The production source does not include a one-time migration utility; perform any required media migration separately with an approved backup and migration process before deployment.

If Storage still returns an error, create a public bucket named exactly `meridian-media` in **Supabase → Storage**, or set `SUPABASE_MEDIA_BUCKET` to the bucket name you created. The application now includes the Supabase response body in the error, which distinguishes an incorrect project URL/key from a missing bucket or insufficient permissions.


## Media limits

All image upload paths enforce a maximum file size of **10 MB**. All video upload paths enforce a maximum file size of **250 MB**. Video dimensions must be 16:9 or 9:16. These limits are enforced server-side as well as in the browser. Supabase Storage must be configured with a compatible file-size limit; for the 250 MB video policy, set the bucket/project limit to at least 250 MB.
