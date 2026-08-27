# Backend Testing Rules

**Scope:** How the NestJS API is tested. **Consult when** adding a service, endpoint, or job, or writing tests.
**Authority:** [TASKS X2](../../../docs/TASKS.md). Runner: **Jest + `@nestjs/testing`**.

## What to test where

- **Unit (services):** domain logic in isolation — release/promote, waitlist placement, confirm/release window edge cases (X2.1). Cover branches: empty waitlist, all confirmed, partial confirm, deadline-in-past, contactless "In" never released.
- **Integration:** RSVP + capacity + concurrency against a real Postgres, including the **last-seat race** — two simultaneous "In" for one seat, assert exactly one wins (X2.2). This is the highest-value test in the codebase.
- **Contract:** every endpoint returns the uniform error shape (`{ error: { code, message } }`) on bad input; visibility rules hold (attendee view never exposes another's contact).

## Coverage bar

- Critical-path logic (`E4.T4` allocation, `E6.T3` release/promote) MUST reach **≥90% branch coverage**. Elsewhere, test behavior, not lines.

## Determinism & isolation

- **No real network** in tests. Mock SMS/email providers and any external send; assert on the recorded delivery result, not on an actual message.
- **Inject the clock** (never call `Date.now()` directly in domain code) so window/scheduling logic is testable at fixed times.
- Use an **ephemeral/isolated database** (a disposable Postgres or a per-test transaction rolled back at teardown). Tests MUST NOT depend on order or on leftover state.
- Reuse the seed fixtures (host + two past events + RSVPs) where a realistic graph is needed.

## Jobs

- Assert **idempotency**: running a job twice sends once. Assert reschedule replaces pending jobs and cancel removes them.

## Conventions

- Co-locate specs next to source as `*.spec.ts`. Arrange-Act-Assert; one behavior per test; descriptive names. Prefer building through the service API over reaching into private state.
