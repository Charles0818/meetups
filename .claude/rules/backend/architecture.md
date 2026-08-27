# Backend Architecture Rules

**Scope:** How the NestJS API (`apps/api`) is structured. **Consult when** adding a module, controller, service, or deciding where logic lives.
**Authority:** [ADR-0001](../../../docs/adr/0001-stack.md), [PRD](../../../docs/PRD.md), [TASKS](../../../docs/TASKS.md).

## Single-writer boundary (non-negotiable)

- The **NestJS API is the only writer to Postgres.** `packages/database` (Prisma) MUST be imported only by `apps/api`. `apps/web` MUST NOT import Prisma or open a DB connection — it calls the API. See [frontend/architecture.md](../frontend/architecture.md).
- Every data mutation and domain invariant lives behind the API so future clients (bots — P2.1) reuse the same surface.

## Layers

- **Controller** — HTTP edge only: parse/validate input (Zod DTOs), call a service, map the result. MUST NOT contain business logic or touch Prisma directly.
- **Service** — owns domain logic and invariants (seat allocation, confirm/release, promotion). This is where transactions live. Services are the unit of reuse and the unit of testing.
- **Repository/Prisma access** — via an injected `PrismaService`. Keep query construction close to the service; do not leak Prisma types past the service boundary into controllers.
- Dependencies point inward: controller → service → data. Never the reverse.

## Module organization

- One Nest **feature module per epic domain**: `events`, `rsvp`, `identity`, `notifications` (E9), `groups` (E7). Each owns its controller(s), service(s), and DTOs.
- Cross-cutting concerns are their own modules: `PrismaModule`, `ConfigModule` (validated env), `QueueModule` (BullMQ), `HealthModule`.
- Shared request/response contracts (Zod schemas + inferred types) live in `packages/shared` and are consumed by both apps — never redefine a DTO shape in one app only.

## Configuration & secrets

- All env access goes through the validated loader in `apps/api/src/config/env.ts` (Zod, fail-fast at boot). MUST NOT read `process.env` ad hoc elsewhere. Add new keys to the schema **and** `apps/api/.env.example`. See [security.md](./security.md).

## Queue / workers

- BullMQ **producers and consumers run in-process** in `apps/api` (register processors as Nest providers). No separate worker service yet (per ADR). Keep processors thin — delegate to the same domain services. See [concurrency-and-workers.md](./concurrency-and-workers.md).

## API design

- Follow [api-design.md](./api-design.md) for REST conventions, the uniform error contract, validation, and rate limiting.
