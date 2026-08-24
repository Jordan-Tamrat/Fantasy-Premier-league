# Fantasy Money League

A private Fantasy Premier League money-competition platform for a small group of friends. Replaces a Telegram-based workflow (payments, verification, winner calculation, payouts) with one app.

**Phase 1** built the money loop: invite-only accounts, Game Week lifecycle, payment verification, the prize/tie-splitting engine, FPL score syncing, transparency/history, and admin tooling.

**Phase 2** replaced the rest of Telegram: a league chat (text, image attachments, replies, pinned and system messages), announcements, in-app notifications, database-backed rules, rule proposals with one-member-one-vote, and a dispute system.

## How the money math works

Every Game Week: only members with a payment **verified by the admin before the payment deadline** become participants — registering is not the same as participating. Once the deadline passes, that participant list is locked and snapshotted forever, independent of anything that happens to `Payment` rows afterward.

Prizes are **custom**: the admin sets an amount for 1st/2nd/3rd (or however many positions), and the total can never exceed what was actually collected. Ranking uses each Game Week's FPL points only — never season totals. Ties use standard competition ranking: two people tied for 1st split the 1st+2nd prize pool 50/50 and the next distinct rank is 3rd, not 2nd. Money is `Decimal`, never JS floats, and every remainder cent is deterministically assigned so nothing is ever silently lost. See `services/prizeEngine.ts` and its test suite (`services/prizeEngine.test.ts`) for the exact algorithm and the spec's worked examples (2-way/3-way/4-way ties).

## Tech stack

Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS + shadcn/ui (built on Base UI) · PostgreSQL via Supabase + Prisma 7 · Auth.js v5 (Credentials + JWT sessions, no OAuth) · Supabase Storage for payment/prize-payment screenshots · Zod validation · Vercel Cron for scheduled Game Week transitions and FPL syncing · Vitest for the prize-engine test suite.

This is a small, self-run project (~20-25 friends, one admin) — the architecture deliberately skips things that only matter at larger scale: no Redis/queue, no distributed-lock/race-condition machinery (an admin clicking a button twice is handled with a plain status check, not optimistic-concurrency plumbing), no generic "correction framework" (just a couple of specific, always-audited actions for the realistic cases).

## Project layout

```
prisma/schema.prisma      Database schema
prisma/seed.ts            Demo data (admin + 8 members, a completed Game Week with a tie, rules, a live vote, chat)
lib/prisma.ts             Prisma client (pg driver adapter, pooled connection)
lib/auth.ts               Auth.js config + requireUser()/requireAdmin() guards
lib/money.ts              Decimal/cents helpers (decimal.js — deliberately not Prisma's re-export, see below)
lib/storage.ts            Supabase Storage: upload + signed URL minting
app/api/attachments/      Authenticated proxy for private files (see note below)
lib/fpl/                  FPLService — the only code that knows FPL's API endpoints
lib/validations/          Zod schemas
services/                 Business logic (prize engine, lock/finalize, payments, chat, proposals, ...)
app/(auth)/               /login, /invite/[token] — public
app/(member)/             /dashboard, /gameweeks, /chat, /rules, /proposals, /disputes, ... — signed-in
app/(admin)/admin/        Game Weeks, members, announcements, rules, disputes, settings — admin only
app/api/cron/             Scheduled jobs, protected by CRON_SECRET (not user sessions)
```

**Private files** (payment proofs, prize proofs, chat images) are never linked as signed Supabase URLs from a page. Pages link to `/api/attachments/{chat|payment|prize}/{id}`, which checks the session, authorizes the specific record, and redirects to a freshly minted signed URL. That keeps authorization in one place and means rendering a list of 50 messages or payments costs zero Storage API calls — a URL is only minted when a browser actually loads the image.

Server actions live as `actions.ts` next to the route that uses them and stay thin: auth guard, Zod parse, call into `services/`. Business logic itself is framework-agnostic and lives in `services/`, not in components — `services/prizeEngine.ts` in particular has zero I/O, which is what makes it fully unit-testable.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

You need a free project at [supabase.com](https://supabase.com) for Postgres + file storage:

1. Create the project.
2. **Database → Connection string**: copy both the pooled connection (port 6543, `?pgbouncer=true`) and the direct connection (port 5432).
3. **Storage**: create four **private** buckets: `payment-proofs`, `prize-payment-proofs`, `chat-attachments`, and `profile-images`.
4. **Settings → API**: copy the project URL, anon key, and service role key.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` (pooled) and `DIRECT_URL` (direct — used only for migrations, since Supabase's pooler can't create the shadow database migrations need), the Supabase keys, and generate an auth secret:

```bash
npx auth secret
```

Also set `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` — the seed script uses these to create your first admin account, since signup is invite-only and there's no other way to bootstrap it.

### 4. Set up the database

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Run it

```bash
npm run dev
```

Sign in with your `ADMIN_EMAIL`/`ADMIN_PASSWORD`, or as a demo member (`mube@demo.local` / `password123`, etc. — see `prisma/seed.ts` for the full list).

## Commands

```bash
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run test         # vitest (prize engine test suite)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
```

## Deployment (Vercel)

1. Import the repo into Vercel, set the same environment variables as `.env.example` (plus `AUTH_URL` = your production URL and a random `CRON_SECRET`).
2. `vercel.json` already declares the two cron jobs (Game Week transitions every 15 min, FPL sync every 5 min). Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on cron requests when `CRON_SECRET` is set — `lib/cron.ts` checks exactly that.
3. Run `npx prisma migrate deploy` against production (via a one-off job, or locally pointed at the production `DIRECT_URL`) before first deploy.

## Known limitations / next steps

- **`lockGameWeek`/`finalizeResults` tests run against the real dev database**, not a mock — `npm run test` will create and delete real rows (a few test users, one Game Week) while it runs. Every test cleans up fully in `afterEach`, including the system chat messages and notifications those functions fan out to every member (see `services/gameWeekTestFixtures.ts`). Safe to run repeatedly, but don't point `DATABASE_URL` at production when running tests.
- **Payment proof review UX is basic** — signed URLs are generated server-side per page load rather than through a dedicated API route; fine at this scale, but note if screenshot review traffic ever grows.
- **No email delivery** — invite links are shown to the admin to share manually (WhatsApp, SMS, etc.) rather than emailed. Notifications are in-app only.
- **Chat updates by polling, not websockets** — the client asks for new messages every 4 seconds while a conversation is active, backing off to 20 seconds once it's been quiet for two minutes, and skipping the request entirely while the tab is hidden. For ~20 members this is fine and avoids bridging NextAuth sessions into Supabase Realtime's row-level-security model (a second auth system to keep in sync). If concurrent viewers ever reach the high tens, Supabase Realtime is the upgrade path.
- **No "load older messages"** — the chat shows the most recent 50. `listMessages()` already takes a `before` cursor, so adding a scroll-back button is small, but the UI doesn't call it yet.
- **Chat has no reactions, typing indicators, or presence** — deliberately scoped to what the league actually needs (send, reply, attach an image, pin, delete).
- **`npm audit` reports a high-severity advisory in `deepmerge-ts`**, a transitive dependency of Prisma's own CLI config loader (not reachable from application code — it only processes `prisma.config.ts`, which we author). No fix is available yet without downgrading Prisma or using an unstable release candidate; left as-is and worth revisiting when Prisma patches it.
