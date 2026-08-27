# ADR-0001: Stack & Architecture

**Status:** Accepted
**Date:** 2026-08-27
**Deciders:** Charles Omoregie
**Task:** E1.T0 (`docs/TASKS.md`)

## Context

`meet-invite` is a chat-native meetup RSVP tool (see [`docs/PRD.md`](../PRD.md)). The product is opened, shared, and used **inside chat apps' in-app browsers** (WhatsApp, Telegram, iMessage, Discord, Slack). Two forces shape the stack:

1. **The link is the product.** A pasted link must unfurl into a rich, RSVP-able preview (P0.2) and open as a fast, accountless page (P0.1, P0.3). This makes server-side rendering and per-event Open Graph image generation first-class concerns, and makes latency on the read/render path matter (preview target <1s p90).
2. **A real domain sits behind the page.** Capacity/waitlist with concurrency safety (P0.4/E4.T4), a confirm-then-release state machine (P0.5/E6), scheduled reminders (E9), and groups/re-invite (P0.6/E7). This is more than a CRUD frontend — it warrants a structured backend with a queue.

We must also not foreclose the P2 bets: native chat bots (P2.1), payments (P2.2), attendee reputation (P2.3), paid group tiers (P2.4). The data model and API boundary have to leave room for those without building them now.

Constraints: solo/small team, no hard deadline (PRD §8), free events only in v1, cost sensitivity on per-event messaging.

## Decision

Build a **TypeScript pnpm + Turborepo monorepo** with two deployables:

- **`apps/web` — Next.js (App Router):** the attendee/host UI, SSR event pages, and per-event OG images (`next/og`). A thin frontend/BFF. **It never touches the database.**
- **`apps/api` — NestJS:** the single source of truth for all database access, domain logic, auth, and background jobs. **Prisma lives only here.** BullMQ queue producers **and** consumers run **in-process** in this one service (no separate worker yet).

Shared code lives in `packages/database` (Prisma, imported only by `api`), `packages/shared` (Zod schemas, error contract, typed API client — imported by both), and `packages/config` (tsconfig/eslint/prettier base).

Postgres for data, Redis for the queue + rate-limiter store. Deploy Next.js to **Vercel** and the NestJS API + Postgres + Redis to a **container host (Railway** default; Render/Fly.io interchangeable).

### Named technology choices

| Concern                   | Choice                                                                  |
| ------------------------- | ----------------------------------------------------------------------- |
| Language                  | TypeScript end-to-end, `strict: true`                                   |
| Frontend / SSR / OG       | Next.js (App Router); OG images via `next/og` (Satori)                  |
| Backend / domain          | NestJS                                                                  |
| Monorepo                  | pnpm workspaces + Turborepo                                             |
| Database                  | Postgres                                                                |
| ORM                       | Prisma (Nest-side only)                                                 |
| Queue / scheduling        | BullMQ + Redis (`@nestjs/bullmq`), in-process in `apps/api`             |
| Validation / shared types | Zod (`packages/shared`); Nest via `nestjs-zod`                          |
| API contract              | OpenAPI via `@nestjs/swagger` + typed fetch client in `packages/shared` |
| Rate limiting             | `@nestjs/throttler`, Redis store                                        |
| CI / hooks                | GitHub Actions (typecheck + lint + test per PR); husky + lint-staged    |
| Hosting                   | Vercel (web) + Railway (api + Postgres + Redis)                         |

## Options Considered

### Option A: NestJS API + thin Next.js frontend (CHOSEN)

Next.js renders and proxies; NestJS owns the DB and all logic. Prisma is Nest-only.

| Dimension        | Assessment                                                                  |
| ---------------- | --------------------------------------------------------------------------- |
| Complexity       | Medium — two services, one clean boundary                                   |
| Cost             | Low-Medium — Vercel free/hobby + one small container host                   |
| Scalability      | Good — API scales independently of the render tier; worker splits out later |
| Team familiarity | High — mainstream, well-documented stack                                    |

**Pros:** One writer, one place for domain logic; bots (P2.1) hit the same API as the web; queue/cron belongs naturally in Nest; clear separation keeps the render path simple.
**Cons:** One network hop on SSR/OG reads (web → api); two things to deploy.

### Option B: Shared Prisma, Next.js reads Postgres directly

Prisma in a shared package; Next.js reads the DB for SSR/OG (no hop); NestJS owns writes + jobs.

| Dimension        | Assessment                                      |
| ---------------- | ----------------------------------------------- |
| Complexity       | Medium-High — two components touch the DB       |
| Cost             | Same as A                                       |
| Scalability      | Good reads, but schema coupling across two apps |
| Team familiarity | High                                            |

**Pros:** Fastest read/preview path (no hop).
**Cons:** Two writers-in-practice risk; migrations and connection pools span two apps; a bot surface would be a third DB client. Rejected — the split-brain cost outweighs one saved hop, which caching largely erases.

### Option C: Next.js route handlers do everything; Nest only runs jobs

Minimize Nest to a job runner; Next API routes own CRUD.

**Pros:** Fewest moving parts.
**Cons:** Under-uses the chosen backend framework; the confirm/release state machine, concurrency-safe seat allocation, and rate limiting all want a structured backend; harder to expose cleanly to future bots. Rejected.

## Trade-off Analysis

The decisive axis is **where the database lives**. Option A's single writer is worth one extra hop on reads because (a) OG images and event pages are cacheable (TTL ≤5 min per P0.2), so the hop is amortized; (b) the domain (waitlist concurrency, confirm/release, scheduled sends) is genuinely backend-shaped and benefits from living in one Nest service; and (c) P2.1 bots become "another client of the same API" rather than "a third thing that opens the database."

**One backend process, not two.** BullMQ consumers run in-process in `apps/api` at this stage. A separate worker deploy is deferred until reminder volume or failure-isolation needs justify it — premature at zero users.

### Sub-decision: attendee device-key cookie strategy

The device-cookie identity (P0.3) must persist inside **in-app chat browsers**, where cross-site/third-party cookies are increasingly partitioned or blocked. Therefore:

- **Chosen:** the browser talks only to the **Next.js origin** (same-origin BFF proxy); Next forwards to Nest server-side. **Nest signs and owns the device key**; Next relays Nest's `Set-Cookie` onto the web origin so the cookie is **first-party**. Robust in webviews; Nest stays the source of truth.
- **Rejected for now:** browser calls `api.<domain>` directly with a `Domain=.<domain>` cookie + CORS credentials. Fewer hops, but fragile under in-app-browser cookie partitioning.

## Consequences

**Easier:**

- One place to reason about data, invariants, and migrations (`apps/api`).
- Rich previews and fast accountless pages via Next.js SSR + `next/og`.
- Scheduled reminders and rate limiting have a natural home (BullMQ/Throttler on Redis).
- Future bots (P2.1) reuse the existing API.

**Harder:**

- SSR/OG reads cross a service boundary — mitigated by caching and keeping the API co-located/low-latency.
- Two deploy targets (Vercel + container host) with their own env/secret stores.
- Cross-service trust: Next→Nest calls need an internal auth mechanism (shared secret / signed internal header).

**To revisit:**

- Split BullMQ consumers into a standalone worker when reminder volume grows.
- Hosting vendor (Railway vs Render vs Fly) — revisit at first real deploy; the decision is not load-bearing.
- Reminder **channel** (SMS vs email) is deliberately out of this ADR — owned by E0.T3/E9. Keep the notification interface channel-agnostic.

## Action Items

1. [x] Record stack decisions (this ADR).
2. [ ] E1.T1 — scaffold the pnpm + Turborepo monorepo (`apps/web`, `apps/api`, `packages/*`).
3. [ ] E1.T2 — Prisma schema + migrations + seed in `packages/database`.
4. [ ] E1.T3 — Nest API surface (events, RSVPs) with Zod validation, error contract, throttler, Swagger.
5. [ ] E1.T4 — host magic-link auth + attendee device-key (first-party cookie via the BFF proxy).
6. [ ] Revisit the worker split and hosting vendor once there is real traffic.
