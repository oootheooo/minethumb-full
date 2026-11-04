# MineThumb

MineThumb is a SvelteKit + Supabase SaaS for generating clickable Minecraft YouTube thumbnails with AI.

## Stack

- SvelteKit + TypeScript
- Supabase Auth, Postgres, Storage, Edge Functions
- OpenAI Images API from a Google Cloud Function worker
- Google Cloud Tasks for long-running generation jobs
- Stripe Checkout and webhooks
- Vercel frontend deployment

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

The UI works without live credentials for design/development. Auth, storage, generation, and billing need Supabase, OpenAI, Google Cloud, and Stripe values configured locally (`.env` is gitignored and never committed).

## Supabase Setup (local alternative)

```bash
supabase start
supabase db reset
supabase functions serve create-thumbnail-generation
supabase functions serve create-checkout-session
supabase functions serve stripe-webhook
```

Set these Supabase function secrets:

```bash
supabase secrets set OPENAI_API_KEY=...
supabase secrets set IMAGE_MODEL=gpt-image-2
supabase secrets set IMAGE_SIZE=1792x1008
supabase secrets set IMAGE_QUALITY=high
supabase secrets set GENERATION_CREDIT_COST=1
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set STRIPE_PRO_PRICE_ID=...
supabase secrets set STRIPE_CREATOR_PRICE_ID=...
supabase secrets set SITE_URL=http://localhost:5173
supabase secrets set GOOGLE_CLOUD_TASKS_PROJECT_ID=...
supabase secrets set GOOGLE_CLOUD_TASKS_LOCATION=us-central1
supabase secrets set GOOGLE_CLOUD_TASKS_QUEUE=thumbnail-generation
supabase secrets set GOOGLE_CLOUD_TASKS_SERVICE_ACCOUNT_JSON='...'
supabase secrets set GOOGLE_GENERATION_FUNCTION_URL=...
supabase secrets set GOOGLE_GENERATION_FUNCTION_SECRET=...
```

Migrations create:

- `profiles`
- `plans`
- `generations`
- `generation_assets`
- `subscriptions`
- `credit_ledger`
- private `user-uploads`
- private `generated-thumbnails`
- public `public-assets`

## Plans

| Plan | Price | Credits / month |
| --- | --- | --- |
| Free | $0 | 2 |
| Pro | $13.99 | 30 |
| Creator | $20.99 | 60 |

Pricing targets about $5 net margin per subscriber at full credit usage with `IMAGE_QUALITY=high` (~$0.25/generation).

Create matching recurring Stripe prices for Pro and Creator, then set `STRIPE_PRO_PRICE_ID` and `STRIPE_CREATOR_PRICE_ID`.

Public env vars (`PUBLIC_*_PLAN_GENERATIONS`, `PUBLIC_*_PRICE_USD`) drive the pricing UI. Database plan rows and the Stripe webhook must stay in sync after migrations.

## OpenAI Generation Flow

1. User submits a video description and optional references.
2. Supabase Edge Function verifies the JWT.
3. Function checks profile credits.
4. Function builds a Minecraft thumbnail prompt.
5. Function enqueues a Google Cloud Task and returns quickly.
6. Cloud Tasks calls the Google Cloud Function worker.
7. Worker calls the OpenAI Images API.
8. Result is stored in Supabase Storage.
9. Generation is marked completed.
10. Credits are deducted only after success.

## Stripe Flow

- `create-checkout-session` creates subscription checkout for Pro or Creator.
- `cancel-subscription` cancels at period end (or reactivates before renewal).
- `stripe-webhook` updates profile plan, credits, and subscription status.
- Deleted subscriptions fall back to Free.

## Deployment

Frontend:

```bash
npm run build
```

Deploy the SvelteKit app to Vercel and set public env vars.

Backend:

```bash
supabase db push
supabase functions deploy create-thumbnail-generation
supabase functions deploy create-checkout-session
supabase functions deploy cancel-subscription
supabase functions deploy stripe-webhook
```

Deploy `cloud-functions/generate-thumbnail` to Google Cloud Functions (Gen2), create the Cloud Tasks queue, and set the Google/Supabase/OpenAI worker secrets on both GCP and Supabase before enabling production generation.

## Current Limitations

- Long-running image generation depends on Google Cloud Tasks and the deployed Google Cloud Function worker.
- Reference images are sent with `/v1/images/edits` when uploaded.

## Future Improvements

- Add direct upload-to-storage from the composer.
- Add generated thumbnail variants.
- Add prompt controls for title text, mood, and composition.
- Add monthly credit reset automation.
- Add signed URL refresh endpoint for older generated thumbnails.
