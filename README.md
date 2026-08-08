# Padel Organizer

Mobile-first Next.js app for organizing padel Americanos, Mexicanos, leagues, tournaments, live scoring, public rooms, QR sharing, and CSV exports.

## Stack

- Next.js App Router, React, TypeScript strict mode
- Tailwind CSS, small shadcn-style primitives, Lucide icons
- Supabase Auth/Postgres/Realtime via `@supabase/ssr`
- `postgres` for server-only transactional mutations with `prepare: false`
- `tods-competition-factory@6.19.0` isolated behind `lib/competitions/courthive`
- Vitest domain tests and Playwright smoke tests

## Local Setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The UI can build without Supabase credentials. Server database operations require `DATABASE_URL`.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
APP_SECRET=
```

Do not prefix server secrets with `NEXT_PUBLIC_`.

## Supabase

1. Create a Supabase project from the Vercel Marketplace or Supabase dashboard.
2. Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the transaction-pooler `DATABASE_URL`.
3. Apply migrations from `supabase/migrations`.
4. Optionally apply `supabase/seed.sql` for demo data.
5. Add `matches`, `rounds`, `standings`, and `activity_logs` to the Supabase Realtime publication if live updates are enabled.
6. Review RLS policies before production; public pages should use sanitized DTOs, not raw tables.

`postgres.js` is configured with `prepare: false`, which is required for Supabase transaction pooling in serverless runtimes.

## Vercel

1. Import the repository as a Next.js project.
2. Set the environment variables above.
3. Use Node.js 22 or newer.
4. Deploy with the default Vercel Next.js build command.

No Docker, always-on Node server, or custom WebSocket/SSE server is required.

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm e2e
```

## Domain Notes

- Americano and Mexicano scheduling are pure TypeScript modules and do not copy Padelo source.
- Social scores use fixed total-point validation.
- Mexicano future rounds are invalidated after historical edits because pairings depend on standings.
- Leagues use deterministic circle-method schedules.
- CourtHive stays server-only and returns app-friendly projections instead of leaking upstream types into React.
