# Backend API Design Rules

**Scope:** REST conventions for the NestJS API. **Consult when** adding or changing an endpoint, request/response shape, or error.
**Authority:** [TASKS E1.T3](../../../docs/TASKS.md), [PRD §5](../../../docs/PRD.md).

## Resources & routing

- Version every route under `/v1`. Resource nouns, plural: `/v1/events`, `/v1/events/:id/rsvps`.
- Use HTTP semantics: `POST` create, `GET` read, `PATCH` partial update, `DELETE`/status-change for cancel. Cancel is a state transition (`status: cancelled`), not a hard delete.
- IDs in URLs MUST be unguessable (cuid/uuid), never sequential integers — see [pen-testing-and-threat-model.md](./pen-testing-and-threat-model.md).

## Validation

- Validate **every** input at the controller edge with Zod schemas from `packages/shared` (via `nestjs-zod`). No unvalidated body/query/param reaches a service.
- Reject unknown fields (`strict` objects) on write paths. Coerce and bound numbers (capacity, window minutes).

## Uniform error contract

- All errors return exactly:
  ```json
  { "error": { "code": "SNAKE_CASE_CODE", "message": "human readable", "details": [] } }
  ```
- `code` comes from a **documented, exhaustive enum** (e.g. `EVENT_NOT_FOUND`, `EVENT_FULL`, `RSVP_INVALID_STATE`, `VALIDATION_FAILED`, `RATE_LIMITED`, `UNAUTHORIZED`). Implement via a global Nest exception filter — controllers/services throw typed exceptions, never hand-format responses.
- Never leak stack traces, SQL, or internal messages to clients. Log the detail server-side (no PII/secrets — see [security.md](./security.md)).

## Idempotency & state

- Changing an RSVP response (In/Out/Maybe) MUST be idempotent: it mutates the single `(eventId, attendeeId)` row, never inserts a duplicate (E4.T3).
- Timestamps are ISO-8601 UTC on the wire; store `timestamptz`. Event display time is derived from the event's stored `timezone`.

## Visibility rules (authorization at the response layer)

- **Host-authenticated** responses may include attendee contact details. **Public/attendee** responses expose first names only — never another attendee's phone/email (P0.4, E5.T2). Enforce by separate serializers/DTOs, not by hoping the client hides fields.
- Host-only actions (edit, cancel, reschedule, check-in) are permission-gated to the owning host.

## Rate limiting

- Public creation and RSVP endpoints MUST be rate-limited (`@nestjs/throttler`, Redis store) and covered by a test that proves abusive rates get `429` + `RATE_LIMITED` (E1.T3.5).

## Contract sync

- Keep the OpenAPI doc (`@nestjs/swagger`) in sync with the implementation; the shared typed client in `packages/shared` is the single source clients use.
