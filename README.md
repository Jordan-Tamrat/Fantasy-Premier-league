# Ethiosinia Fantasy Premier League

A private Fantasy Premier League money league for a group of friends. It replaces a Telegram workflow — entry fees, payment screenshots, working out winners, paying out prizes — with one app that runs the weekly cycle and keeps an auditable record.

Built for one admin and ~20–25 members. Optimised for correctness (real money) and mobile, not scale.

## Features

- **Money loop** — invite-only accounts, full Game Week lifecycle, payment verification, a custom prize engine with exact tie-splitting, FPL score syncing, prize payouts, leaderboard and history.
- **League** — real-time chat (images, replies, reactions, pins), announcements, notifications, rules, rule proposals with one-member-one-vote, and disputes.
- **Admin** — payment/prize controls, member and invite management, FPL sync, league settings, and a full audit log.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase Postgres via Prisma 7 · Auth.js v5 (Credentials + JWT) · Supabase Storage · Zod · Vitest. Dates display in Africa/Addis_Ababa.

## Architecture (the parts worth knowing)

- **Money math** — only payments verified before the deadline count; that list is snapshotted immutably at lock time. Prizes can't exceed what's collected, ranking uses each Game Week's FPL points, ties use competition ranking, and money is integer-cent `Decimal` (no floats). A cancelled Game Week is a refund and never counts against a member. The engine is pure and unit-tested: [`services/prizeEngine.ts`](services/prizeEngine.ts).
- **Private files** — payment/prize/chat/avatar images live in private buckets. Pages link to `/api/attachments/{kind}/{id}`, which authorizes the record then redirects to a signed URL, so listing 50 items costs zero Storage calls.
- **Thin actions, real services** — `actions.ts` files do auth + Zod + a call into `services/`; all business logic lives in `services/` (framework-agnostic, testable).
- **Chat by polling** — one request every 4s (backing off when idle, skipping hidden tabs) returns new messages and refreshed reaction/pin state. Plenty for this size; Supabase Realtime is the upgrade path.

## Structure

```
prisma/       schema, migrations, seed
lib/          prisma, auth, money, datetime, storage, fpl/, validations/
services/     business logic (prize engine, lock/finalize, payments, chat, ...)
components/   shared UI
app/(auth)/   /login, /invite — public
app/(member)/ dashboard, gameweeks, chat, leaderboard, proposals, ... — signed-in
app/(admin)/  admin-only pages
app/api/      attachments proxy, cron routes
```

## Getting started

Prerequisites: Node 20+ and a free [Supabase](https://supabase.com) project.

```bash
npm install
cp .env.example .env          # then fill it in (see below)
npx prisma migrate dev
npm run db:seed
npm run dev
```

In Supabase: copy the pooled (`6543`) and direct (`5432`) connection strings, create four **private** Storage buckets (`payment-proofs`, `prize-payment-proofs`, `chat-attachments`, `profile-images`), and grab the project URL + service-role key. Fill these into `.env` (see `.env.example`), generate `AUTH_SECRET` with `npx auth secret`, and set `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` — the seed script creates the first admin, since signup is invite-only.

Sign in as that admin, or a demo member (`mube@demo.local` / `password123` — see [`prisma/seed.ts`](prisma/seed.ts)).

## Scripts

```bash
npm run dev | build | start | lint | typecheck | test
npm run db:migrate | db:seed
```

## Deployment (Vercel)

Import the repo, set the `.env.example` variables plus `AUTH_URL` and `CRON_SECRET`, and run `npx prisma migrate deploy` against production once. Scheduled Game Week transitions and FPL sync run via GitHub Actions ([`.github/workflows/cron.yml`](.github/workflows/cron.yml)) — add `APP_URL` and `CRON_SECRET` repo secrets. Every scheduled step also has a manual button, so a late run never blocks anything.

## Testing

`npm run test`. The prize engine is pure and tested thoroughly; the lock/finalize tests hit the real dev database and clean up after themselves — never point `DATABASE_URL` at production while testing.
