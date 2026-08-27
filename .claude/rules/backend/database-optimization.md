# Backend Database Optimization Rules

**Scope:** Query and schema performance for the Postgres/Prisma data layer (`packages/database`, consumed by `apps/api`). **Consult when** writing a query, adding an index or migration, or touching the headcount/list read paths.
**Authority:** [TASKS E1.T2](../../../docs/TASKS.md), [PRD §6 hot paths](../../../docs/PRD.md). Pairs with [concurrency-and-workers.md](./concurrency-and-workers.md) and [architecture.md](./architecture.md).

## Indexing

- Ship the required indexes: on `eventId`, `attendeeId`, `status`, plus the **unique `(eventId, attendeeId)`** on `Rsvp` (E1.T2.4). Every foreign key gets an index.
- **Composite index column order = equality columns first, then the range/sort column** (e.g. `(eventId, status)` for count-by-status; `(eventId, waitlistPosition)` for ordered promotion).
- Use a **partial index** where reads target a subset — e.g. waitlist ordering `WHERE status = 'waitlisted'`.
- Don't add speculative indexes: each one taxes writes. Add an index to serve a real query, and verify it's used.

## Avoid N+1

- Fetch relations in a **single query** with Prisma `select` / `include` — never issue queries inside a loop. To load many by id, use one `findMany({ where: { id: { in: [...] } } })`.
- Prefer one well-shaped query over `Promise.all` of many small ones when the data is relational.

## Fetch narrowly

- Use `select` to return only the columns the caller needs; do not `include` whole relations for a list view. Never `SELECT *` a description/blob you won't render.
- Serialize to the response DTO — don't leak internal columns (see [api-design.md](./api-design.md) visibility rules).

## Pagination

- Paginate list endpoints (attendee lists, host dashboard) with **cursor/keyset** pagination over an indexed column, not large `OFFSET` scans. Always bound `findMany` with `take`.

## Hot read: live headcount

- In/out/maybe counts are read on nearly every event view. Compute them with a single indexed aggregate (`groupBy` on `(eventId, status)`), or maintain a denormalized counter updated in the same transaction as the RSVP write — do **not** run repeated unindexed `COUNT(*)`.
- Cache the count at the edge with `revalidate` ≤5 min where shown (P0.2) — see [frontend/data-fetching.md](../frontend/data-fetching.md).

## Transactions & counters

- Update seat/headcount counters with an **atomic SQL `UPDATE`** (`… SET taken = taken + 1 WHERE …`) inside the allocation transaction — never read-modify-write in app code. This is the same lock scope that keeps seat allocation race-safe ([concurrency-and-workers.md](./concurrency-and-workers.md)).
- Keep transactions **short**: do validation/computation before `BEGIN`; hold locks only for the write. Long transactions block promotion and inflate contention.

## Connections & types

- One `PrismaService` singleton (Nest provider); size the connection pool for the container host. If pool exhaustion appears under load, front Postgres with PgBouncer rather than raising limits blindly.
- Store instants as `timestamptz` (UTC); store the event's display `timezone` separately. Use appropriate numeric types for `capacity`/window minutes.

## Measure, don't guess

- Diagnose slow queries with `EXPLAIN (ANALYZE, BUFFERS)` before adding indexes or rewriting. On large tables, create indexes `CONCURRENTLY` via a dedicated migration to avoid long write locks. Never edit an applied migration — add a new one ([git-workflow.md](../git-workflow.md)).
