# Deploy EPR Compass to Vercel

This repository contains the Next.js app at its root. The production Git branch is `main`. Vercel should detect Next.js automatically; keep the Root Directory as `./` and use the `npm run build` script from `package.json`.

## 1. Configure the web app environment

Add values in Vercel under **Project → Settings → Environment Variables**. Enter secrets in Vercel directly; never commit a populated `.env.local` or paste secrets into GitHub. Environment-variable changes apply to new deployments, so redeploy after changing them. See [Vercel environment variables](https://vercel.com/docs/environment-variables).

### Supabase connection

| Name | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Current `sb_publishable_…` key | Safe for browser use; RLS still governs user data. |
| `SUPABASE_SERVICE_ROLE_KEY` | Current, rotated `sb_secret_…` key | Server-only. This is the variable name the app reads for privileged routes. Never add `NEXT_PUBLIC_`. |

The app has a legacy fallback named `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Use the publishable key above and leave the legacy variable unset. The Supabase JavaScript client in this project supports the current publishable/secret key format. Supabase documents secret keys as backend-only because they bypass RLS; keep them out of browser code and source control. See [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys) and [migration to new API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

### Site URLs and server security

Set these for production, using the exact Vercel URL after Vercel assigns it (replace it later if a custom domain is added):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` |
| `NEXT_PUBLIC_APP_URL` | `https://<your-project>.vercel.app` |
| `APP_BASE_URL` | Same URL; used by some admin pages. |
| `IAM_PORTAL_BASE_URL` | Same URL if IAM welcome links are enabled. |
| `CRON_SECRET` | A random secret; Vercel sends it to scheduled routes as a Bearer token. |
| `COMMS_ENCRYPTION_KEY` | At least 64 hexadecimal characters (32 random bytes). |
| `COMPLIANCE_VAULT_KEY` | A unique, long random secret. Set it before saving compliance credentials. |
| `ONBOARDING_TOKEN_SECRET` | A unique, long random secret for onboarding links. |

Generate a 64-character hexadecimal value locally with Node.js, once per secret:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use a different value for each variable. Keep the encryption keys stable after records have been encrypted; changing them can prevent existing values from being decrypted. `COMPLIANCE_VAULT_KEY` has a development fallback in the code, so configure a real value before production use.

### Optional integrations

Only add the variables for features you intend to enable. Missing integration keys do not need to block a basic website deployment.

| Feature | Variables referenced by the app |
| --- | --- |
| Email | `RESEND_API_KEY`, `IAM_FROM_EMAIL`, `RENEWAL_FROM_EMAIL`, `IAM_PORTAL_BASE_URL` |
| AI and transcription | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `INTEL_ANTHROPIC_MODEL`, `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `ASSEMBLYAI_API_KEY` |
| Google services | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_APPS_SCRIPT_URL`, `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`, `GOOGLE_SHEETS_CLIENT_EMAIL`, `GOOGLE_SHEETS_PRIVATE_KEY`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_CSE_CX`, `GOOGLE_CUSTOM_SEARCH_CX`, `GOOGLE_DOCUMENT_AI_PROCESSOR`, `GOOGLE_CLOUD_ACCESS_TOKEN` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_SUBSCRIPTION_WEBHOOK_SECRET` |
| WhatsApp and Exotel | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WEBHOOK_SECRET`, `WHATSAPP_INTERNAL_SECRET`, `WHATSAPP_INTEL_SOURCE_ID`, `NEXT_PUBLIC_WA_NUMBER`, `NEXT_PUBLIC_WHATSAPP_NOTIFICATIONS`, `EXOTEL_ACCOUNT_SID`, `EXOTEL_API_KEY`, `EXOTEL_API_TOKEN`, `EXOTEL_CALLER_ID`, `EXOTEL_SUBDOMAIN`, `EXOTEL_WEBHOOK_SECRET` |
| Airtable and Intel services | `AIRTABLE_BASE_ID`, `AIRTABLE_INTEL_BASE_ID`, `AIRTABLE_PAT`, `AIRTABLE_INTEL_PAT`, `AIRTABLE_TABLE_NAME`, `INTEL_ADMIN_TOKEN`, `INTEL_API_SECRET`, `INTEL_EXPRESS_URL`, `INTEL_USER_EMAIL`, `INTEL_USER_ID`, `INTERNAL_API_KEY`, `INTERNAL_API_URL`, `INTERNAL_WEBHOOK_SECRET`, `SUPABASE_WEBHOOK_SECRET`, `FORGECHAT_DB_URL`, `TC_ADMIN_USER_ID`, `LANDING_PAGE_INTEL_SOURCE_ID` |
| Social sign-in | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` |
| Analytics and public feature settings | `NEXT_PUBLIC_AMPLITUDE_API_KEY`, `NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SCRAPER_URL`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_AI_NEGOTIATION_ASSIST`, `NEXT_PUBLIC_AI_TENDER_MATCHING`, `NEXT_PUBLIC_AUCTION_ML_PRICING`, `NEXT_PUBLIC_CHECKOUT_EARLYBIRD_END`, `NEXT_PUBLIC_CPCB_AUTO_SCRAPER`, `NEXT_PUBLIC_ENABLE_RECYCLER_NETWORK`, `NEXT_PUBLIC_ENABLE_RECYCLER_PORTAL`, `NEXT_PUBLIC_ENABLE_TYRE_EPR`, `NEXT_PUBLIC_EPR_DASHBOARD_EXPORT`, `NEXT_PUBLIC_EPR_EXTENSION_ID`, `NEXT_PUBLIC_GOOGLE_SIGN_IN_ENABLED`, `NEXT_PUBLIC_SUPER_ADMIN_EMAILS`, `SUPER_ADMIN_EMAILS` |
| Pricing | `CEPC_ASSOCIATE_SUBTOTAL_INR`, `CEPC_EXPERT_SUBTOTAL_INR`, `CEPC_PROFESSIONAL_SUBTOTAL_INR`, `EPR_COURSE_GST_PERCENT`, `EPR_COURSE_SUBTOTAL_INR`, `EPR_WEBINAR_GST_PERCENT`, `EPR_WEBINAR_SUBTOTAL_INR`, `FREELANCER_NETWORK_FEE_INR` |

Values with a `NEXT_PUBLIC_` prefix are bundled for browser use. Put only public values there, never API secrets or database passwords. `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SCRAPER_URL` are only needed when those services run at a separate URL.

`NEXT_PUBLIC_SUPER_ADMIN_EMAILS` is visible to browsers. Use the server-side `SUPER_ADMIN_EMAILS` for private admin allow-lists.

## 2. Import the GitHub repository

1. Sign in to [Vercel](https://vercel.com/) with an account that can access `navnathlahane1/eprcompass`.
2. Select **Add New → Project**, connect GitHub if asked, and import `navnathlahane1/eprcompass`.
3. Set the project name to `eprcompass` or `epr-compass`.
4. Confirm **Framework Preset: Next.js**, **Root Directory: `./`**, and the detected `npm run build` command. Keep the detected install and output settings.
5. Add the required Production environment variables above, then select **Deploy**. Vercel documents this Git import flow in [Deploying Git repositories](https://vercel.com/docs/git).

Pushes to `main` will deploy to Production after Git integration is connected. Other branches create Preview deployments.

## 3. Connect Supabase Auth to the deployed URL

After the first deploy, open **Supabase → Authentication → URL Configuration**:

1. Set **Site URL** to the production Vercel URL.
2. Add `https://<your-project>.vercel.app/**` to **Redirect URLs**.
3. Keep `http://localhost:3000/**` if local sign-in is still needed.
4. If sign-in should work on Vercel previews, add the Vercel preview wildcard described in the [Supabase redirect URL guide](https://supabase.com/docs/guides/auth/redirect-urls).
5. If a custom domain is added, set `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_URL` to it and add that domain to Supabase’s Site URL/Redirect URLs. Redeploy afterward.

## 4. Check cron behavior before production

`vercel.json` registers `/api/cron/keepalive` every 10 minutes and `/api/cron/telecalling-enrich` every 15 minutes. Vercel cron jobs run on Production and the handlers check `CRON_SECRET`. The telecalling job may read or update Supabase data, so keep it only if that scheduled processing is intended. Vercel Hobby cron timing is limited to daily/hour-level precision; these intervals need a plan with minute-level precision. See Vercel’s [cron scheduling guidance](https://vercel.com/i/event-driven-architecture) and [cron authorization example](https://vercel.com/kb/guide/daily-digest-bot-with-chat-sdk-and-workflow-sdk).

Vercel Hobby is for personal, non-commercial projects; check the [Hobby plan terms](https://vercel.com/docs/plans/hobby) for a customer-facing EPR service.

## 5. Verify the deployment

- Check the Vercel build log for a successful Next.js build.
- Open the assigned URL and check the homepage, sign-in, and the internal pages you plan to use.
- Check Vercel Runtime Logs for failed API calls or cron invocations.
- Use a separate Supabase project for Preview deployments where possible; do not point untrusted previews at production data with a secret key.

The Supabase database migration has already been handled separately. Vercel deployment does not require running the Excel/import scripts or direct database migration scripts in `scripts/`. `DATABASE_URL` is not needed for the normal Next.js website runtime.
