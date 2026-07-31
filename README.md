<p align="center">
  <img src="public/logos/zvc_logo_logomark_rgb_color.svg" alt="Zero Vision Cinema" width="180" />
</p>

<h1 align="center">Zero Vision Cinema</h1>

The website, ticketing platform, and content hub for **Zero Vision Cinema (ZVC)** —
a film screening pop-up — and its sister community, **Astoria
Horror Club (AHC)**.

The site sells screening tickets, publishes screening listings, runs a newsletter, and delivers tickets by email. It is built as a
single Next.js app with an embedded [Payload CMS](https://payloadcms.com/) admin.

---

## Table of contents

- [What this is (non-technical)](#what-this-is-non-technical)
- [How to use it (hosts / creeps)](#how-to-use-it-hosts-creeps)
- [Technical overview](#technical-overview)
- [Architecture & key flows](#architecture--key-flows)
- [How to develop](#how-to-develop)
  - [Prerequisites](#prerequisites)
  - [First-time setup](#first-time-setup)
  - [Environment variables](#environment-variables)
  - [Running locally](#running-locally)
  - [Testing checkout & the ticket-email queue locally](#testing-checkout--the-ticket-email-queue-locally)
  - [QA-ing emails without payments](#qa-ing-emails-without-payments)
  - [Project structure](#project-structure)
  - [Database & migrations](#database--migrations)
  - [Testing](#testing)
- [Deployment](#deployment)

---

## What this is (non-technical)

Zero Vision Cinema hosts movie screenings and community events. This site is where
fans:

- **Browse upcoming and past screenings** and buy tickets online.
- **Read editorials and film reviews** written by the ZVC team.
- **Follow the Astoria Horror Club**, a related community (with its own page,
  book club, and Discord).
- **Sign up for the newsletter** for upcoming screenings and cult-film picks.

When someone buys a ticket, they pay by card or a digital wallet (Apple Pay /
Google Pay), and their ticket is emailed to them automatically.

Organizers manage everything — events, prices, venues, content, and orders —
through a built-in admin dashboard, without touching code.

### Event types

The site supports three kinds of events:

| Type                          | Who                | Notes                                                                      |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------- |
| **ZVC screening**             | Zero Vision Cinema | Paid ticketed film screenings. Shown on the main site.                     |
| **Astoria Horror Club (AHC)** | AHC community      | Free community events. Shown on the AHC page (kept out of search results). |
| **Astoria Horror Book Club**  | AHC community      | Free book-club events with book cover/details.                             |

---

## How to use it (hosts / creeps)

Everything is managed from the **admin dashboard at `/admin`** (e.g.
`https://zerovisioncinema.com/admin`). Sign in with your organizer account.

### Creating a screening / event

1. Go to **Events → Create New**.
2. Choose the **event type** (ZVC / AHC / Book Club).
3. Fill in the basics: name, date/time, and **Location** (venues are managed
   under **Locations**, each with a seating **capacity**).
4. **Auto-fill film details:** enter the film's **IMDb ID** and the poster,
   director, cast, runtime, rating, and synopsis are pulled in automatically
   (via OMDB). For book-club events, look up the book to pull its cover and
   details (via Open Library).
5. Set the **price** (ZVC screenings). A price of `0` marks the event as free.
6. Publish. The event appears on the site and becomes purchasable.

> **Sold out** is automatic: once tickets sold reach the venue's capacity, the
> event shows a "Sold Out" stamp and checkout is disabled. Leave capacity at `0`
> to treat an event as unlimited.

### Orders & attendees

- **Orders** (under the admin) are created automatically after a successful
  payment — they record the buyer, amount, quantity, and Stripe receipt. Orders
  are read-only.
- **Attendee lists** for an event are available at `/attendees` for check-in.

### Content

- **Articles / Editorials** and **Reviews** are authored in the admin (rich-text)
  and appear under `/editorials/...` and `/reviews/...`.
- **Authors** manages editorial bylines.
- **Merch** holds sellable merchandise.

### Newsletter

Newsletter sign-ups (site footer and checkout opt-in) are pushed to **MailerLite**
automatically.

---

## Technical overview

A single **Next.js (App Router)** application with an embedded **Payload CMS**
admin, deployed on **Vercel**.

| Concern                  | Technology                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| Framework                | Next.js 15 (App Router, React 19)                                                         |
| CMS / admin / data layer | Payload CMS 3 (`/admin`)                                                                  |
| Database                 | Postgres (Neon / Vercel Postgres) via `@payloadcms/db-vercel-postgres`                    |
| Media storage            | Vercel Blob (`@payloadcms/storage-vercel-blob`)                                           |
| Payments                 | Stripe — PaymentIntents + Stripe Elements / Express Checkout; `@payloadcms/plugin-stripe` |
| Background jobs / queue  | Upstash QStash (durable ticket-email delivery, retries, DLQ)                              |
| Transactional email      | Resend + React Email templates (`emails/`)                                                |
| Newsletter               | MailerLite                                                                                |
| Film / book metadata     | OMDB (movies), Open Library (books)                                                       |
| Logging                  | BetterStack (Logtail)                                                                     |
| Analytics                | Vercel Analytics + Speed Insights                                                         |
| Styling                  | Tailwind CSS v4 + custom `zvc-*` design system, custom fonts                              |
| Testing                  | Vitest + Testing Library                                                                  |

**Payload collections:** `Users` (admin auth), `Media`, `Locations`, `Events`,
`Merch`, `Orders`, `Authors`, `Articles`.

---

## Architecture & key flows

### Purchase → ticket delivery

The most important flow. Price is always computed **server-side** so the client
can't influence it.

```
Ticket page (/events/[id])
  → POST /api/stripe/payment-intent      (creates/updates a PaymentIntent, server-priced)
  → Stripe Elements / Express Checkout   (card + Apple Pay / Google Pay / Link)
  → confirmPayment                        (double-charge guarded)
        │
        ▼  Stripe fires webhook
  POST /api/stripe/webhook  (payment_intent.succeeded)
     • idempotent on paymentIntentId
     • creates the Order, then bumps ticketsSold
     • enqueues the ticket email to QStash  ──►  QStash (retries + DLQ)
                                                     │
                                                     ▼
                              POST /api/tasks/send-ticket-email  (signed)
                                 • idempotent via order.ticketEmailSentAt
                                 • builds poster (blob or OMDB) + sends via Resend
                              POST /api/tasks/send-ticket-email/failure (on DLQ)
```

The email is **queued, not sent inline**, so a transient OMDB/Resend failure
can't cause a paying customer to miss their ticket — QStash retries, dead-letters,
and calls the failure endpoint (logged to BetterStack).

### Notable API routes

| Route                                         | Purpose                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `POST /api/stripe/payment-intent`             | Create/update a server-priced PaymentIntent for the ticket page         |
| `POST /api/stripe/webhook`                    | Stripe fulfillment (`payment_intent.succeeded`) → order + enqueue email |
| `POST /api/tasks/send-ticket-email`           | QStash worker: sends the ticket email (idempotent, retried)             |
| `POST /api/tasks/send-ticket-email/failure`   | QStash dead-letter callback (alerting)                                  |
| `POST /api/subscribe`                         | Newsletter sign-up → MailerLite                                         |
| `POST /api/contact`                           | Contact form                                                            |
| `GET  /api/attendees`                         | Attendee data for check-in                                              |
| `/api/omdb-lookup`, `/api/openlibrary-lookup` | Admin metadata auto-fill                                                |

---

## How to develop

### Prerequisites

- **Node.js 20+** (22 recommended)
- A **Postgres** database (a Neon dev branch works well)
- Accounts/keys for the integrations you intend to exercise (see
  [Environment variables](#environment-variables)). At minimum you need the
  database and Payload secret to boot the app.

### First-time setup

```bash
git clone <repo-url>
cd zero-vision-cinema
npm install
cp .env.example .env.local   # if present; otherwise create .env.local (see below)
# fill in .env.local, then:
npm run payload migrate       # apply DB migrations to your dev database
npm run dev
```

Open <http://localhost:3000> for the site and <http://localhost:3000/admin> for
the CMS.

### Environment variables

Create `.env.local` with the following. `NEXT_PUBLIC_*` values are exposed to the
browser; everything else is server-only.

**Core**
| Var | What it's for |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `PAYLOAD_SECRET` | Payload CMS encryption/JWT secret |
| `NEXT_PUBLIC_BASE_URL` | Public origin of the deployment (e.g. `http://localhost:3000` locally, `https://zerovisioncinema.com` in prod). **Must be publicly reachable in prod** — QStash calls the ticket-email worker at this URL. |

**Payments (Stripe)**
| Var | What it's for |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_…` in dev) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the webhook (locally, the value from `stripe listen`) |

**Queue (Upstash QStash)**
| Var | What it's for |
|---|---|
| `QSTASH_TOKEN` | QStash publish token |
| `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` | Verify inbound QStash requests |
| `QSTASH_URL` | **Local only** — point at the QStash dev server. Do **not** set in prod (must default to the cloud). |

**Email / newsletter**
| Var | What it's for |
|---|---|
| `RESEND_API_KEY` | Transactional email (Resend) |
| `MAILER_LITE_ACCESS_TOKEN` / `MAILERLITE_GROUP_ID` | Newsletter (MailerLite) |

**Media (Vercel Blob)**
| Var | What it's for |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `VERCEL_BLOB_URL` | Public base URL for stored media (used to build poster image URLs) |

**Metadata / logging / misc**
| Var | What it's for |
|---|---|
| `OMDB_API_KEY` | Film metadata & poster fallback |
| `BETTERSTACK_SOURCE_TOKEN` | BetterStack (Logtail) source token |
| `BETTERSTACK_INGESTING_HOST` | BetterStack source ingesting host (bare host or full URL) |
| `DISCORD_INVITE_URL` | AHC Discord invite link |
| `SEERR_HOME_HOST` | Optional host rewrite for `requests.zerovisioncinema.com` |

### Running locally

```bash
npm run dev          # Next.js dev server (http://localhost:3000) + /admin
npm run dev:email    # preview the email templates with sample data (see below)
npm test             # run the test suite (Vitest)
npm run lint         # lint
npm run payload      # Payload CLI (e.g. `npm run payload migrate`)
```

### Testing checkout & the ticket-email queue locally

The full purchase flow touches Stripe **and** QStash, both of which call back into
your app — so localhost needs help receiving those callbacks.

1. **Forward Stripe webhooks** and copy the printed `whsec_…` into
   `STRIPE_WEBHOOK_SECRET`:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
2. **Run the QStash dev server** (cloud QStash can't reach localhost). It prints a
   local `QSTASH_URL`, token, and signing keys — put those in `.env.local`:
   ```bash
   npx @upstash/qstash-cli dev
   ```
3. Restart `npm run dev` so it picks up the QStash env (the QStash client reads
   `QSTASH_URL` once at startup).
4. Buy a ticket on `/events/[id]` with test card `4242 4242 4242 4242`. You should
   see: order created → QStash delivers → worker sends via Resend →
   `order.ticketEmailSentAt` stamped.

> Tip: `QSTASH_TARGET_BASE_URL` (in `lib/qstash.ts`) resolves from
> `NEXT_PUBLIC_BASE_URL`; keep it at `http://localhost:3000` locally so the QStash
> dev server can reach the worker.

### QA-ing emails without payments

To check the **look, content, and deliverability** of the email templates you
don't need Stripe, QStash, or an order — just the two tools below. (Reserve the
full Stripe test-mode run above for validating the webhook/refund _wiring_.)

**Visual preview:**

```bash
npm run dev:email    # http://localhost:3000
```

Renders the real templates with realistic sample data at five routes:
`TicketPreview`, `RefundPreview`, `BroadcastPaidPreview` (paid ZVC → "Get
Tickets" / About the Film), `BroadcastAhcPreview` (free Astoria Horror Club movie
→ "View Details & RSVP" / About the Film), and `BroadcastBookClubPreview` (free →
"View Details & RSVP" / About the Book). The templates' production default props
were removed for safety, so the preview server is pointed at `emails/previews/` —
small wrappers that feed each template shared sample data from
`emails/previews/sample-data.tsx` (edit that to try different content). Each
preview also has a built-in **Send** button.

The film/book content (plot, poster, rating, cover, synopsis) is **real OMDB /
Open Library data**, captured in `emails/previews/fixtures.generated.ts` (a
committed file, so previews work offline). Refresh it — or swap in different
titles by editing the ids at the top of the generator — with:

```bash
npm run email:fixtures    # needs OMDB_API_KEY (loaded via --env-file)
```

**Send the real templates to your own inbox** (true Gmail / Apple Mail rendering
and deliverability, via your live Resend key):

```bash
npm run email:send -- you@example.com
# or set EMAIL_QA_TO and omit the argument
```

This renders all four templates and sends them `From:` the verified ZVC address
with sample content — so send it **to yourself, not a customer list**. Requires
`RESEND_API_KEY` in `.env.local` (it's loaded via `--env-file`).

> The sample data is dev-only; production sends always use live
> order/event/Stripe data. `tsconfig.scripts.json` just forces the automatic JSX
> runtime for the `tsx`-run send script.

### Project structure

```
app/
  (frontend)/            Public site: home, events, /events/[id], links,
                         astoriahorrorclub, editorials, reviews, attendees
  (payload)/             Payload admin (/admin) + Payload's own API
  api/                   Route handlers (stripe, tasks, subscribe, contact, lookups)
collections/             Payload collections (Events, Orders, Locations, Merch, …)
components/              React UI (checkout, hero, event cards, nav, footer, ui/…)
emails/                  React Email templates (TicketEmail, RefundEmail, BroadcastEmail)
  previews/              Sample-data wrappers for `npm run dev:email` (dev-only)
lib/                     Integrations (stripe, qstash, resend, omdb, openlibrary, logtail)
utils/                   Helpers (getEvents, isSoldOut, formatDate, richText, …)
scripts/                 One-off scripts (e.g. preview-emails — send templates to your inbox)
migrations/              Payload/Postgres migrations (run on build)
payload.config.ts        Payload CMS config (collections, plugins, storage, email)
middleware.ts            Adds noindex headers for the AHC section
```

### Database & migrations

- The schema is defined by Payload collections and applied via **migrations** in
  `migrations/`.
- Migrations are **additive / idempotent / expand-only** (safe to re-run,
  backward-compatible with running code).
- Create a migration with `npm run payload migrate:create`, and apply with
  `npm run payload migrate`. The production **`build` script runs
  `payload migrate` automatically** before `next build`.

### Testing

- `npm test` runs **Vitest** (jsdom + Testing Library). Config in
  `vitest.config.ts`; setup in `vitest.setup.ts`.
- Existing coverage includes the checkout **double-charge guards** and the
  **ticket-email worker** (idempotency, retry-on-failure, signature auth).
- Note: unit tests mock external clients (Stripe/QStash/Resend), so contract-level
  issues (e.g. a malformed QStash payload) require a real local run to catch.

---

## Deployment

Deployed on **Vercel**. Every deploy runs:

```
payload migrate && next build   # then: next-sitemap (postbuild)
```

so migrations apply automatically before the build.

**Before deploying, set the environment variables in Vercel** (all environments).
Key production notes:

- `NEXT_PUBLIC_BASE_URL` must be the **public https origin** (`https://zerovisioncinema.com`)
  — cloud QStash delivers the ticket email to this URL.
- Set `QSTASH_TOKEN` + both signing keys. **Do not set `QSTASH_URL`** in prod (it
  must default to the QStash cloud).
- Use production Stripe keys and the **dashboard** webhook signing secret (not a
  `stripe listen` secret).

**Post-deploy smoke test:** make one real purchase and confirm the ticket email
arrives and the QStash console shows delivery with an empty dead-letter queue.
