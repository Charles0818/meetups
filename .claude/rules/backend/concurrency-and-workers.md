# Backend Concurrency & Workers Rules

**Scope:** Race-safety for seat allocation and correctness of scheduled/queued jobs. **Consult when** touching capacity/waitlist, the confirm/release flow, or any BullMQ processor.
**Authority:** [TASKS E4.T4, E6, E9](../../../docs/TASKS.md).

## Seat allocation must be race-safe (E4.T4)

- Capacity enforcement and waitlist placement MUST run inside a **single database transaction** with the affected rows locked (`SELECT … FOR UPDATE` on the event's seat count / an atomic conditional `UPDATE … WHERE taken < capacity`). Use Prisma interactive transactions with `Serializable` (or explicit row locks) where a read-then-write decision is made.
- Invariant: **two simultaneous "In" taps for the last seat never both succeed** — one gets the seat, the other is waitlisted with a position. This MUST be proven by a concurrency test (X2.2), not assumed.
- Waitlist position is derived under the same lock; promotion (E6.T3) re-runs the allocation atomically. Never compute "next in line" from a stale read.

## Jobs must be idempotent (E9.T3)

- Every queued/scheduled job MUST be safe to run more than once (at-least-once delivery + retries). Use a deterministic **idempotency key** (e.g. `confirm:{eventId}:{attendeeId}`) and/or a delivery-log check so a retry never double-sends (E9.T5).
- Configure sensible retry with backoff; a job that fails MUST NOT corrupt state or send duplicate notifications.

## Time-window correctness (E6)

- Confirm (default 24h) and release (default 6h) windows are scheduled as **BullMQ delayed jobs** relative to `event.startsAt` in the event's timezone. Re-issue/replace jobs on reschedule (E6.T5.2); cancel them on event cancel.
- Clamp or skip windows for same-day events where 24h/6h don't fit — never schedule a job in the past (E6.T5.1).
- Do all time math in UTC; convert only for display. Inject a clock so tests are deterministic — see [testing.md](./testing.md).

## Worker execution model

- Processors run **in-process** in `apps/api`. Keep them thin: validate the job payload, call the same domain service the HTTP path uses, record the delivery result. No business logic duplicated in the processor.
- Handle graceful shutdown: let in-flight jobs drain; don't accept new work during shutdown.
- Contactless "In" attendees are never auto-released (E6.T4) — encode that as an explicit guard in the release job, not an emergent behavior.
