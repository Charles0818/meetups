# Frontend Data-Fetching Rules

**Scope:** How `apps/web` reads and writes data. **Consult when** fetching event/RSVP data, caching, or wiring the live headcount.
**Authority:** [PRD P0.2, P0.4](../../../docs/PRD.md), [TASKS E3, E5](../../../docs/TASKS.md).

## Where fetching happens

- Read data in **server components / server code**, calling the Nest API via the typed client from `packages/shared`. Do not fetch on the client what can be fetched on the server.
- All writes and any cookie-bearing read go through the **same-origin BFF route handler** (see [architecture.md](./architecture.md)) — the browser never calls Nest directly. The route handler forwards the device-key cookie and relays `Set-Cookie` back.

## Caching & revalidation

- Use Next's fetch cache deliberately. Where a **headcount or OG preview** is shown, set `revalidate` ≤ **5 minutes** (P0.2) — never cache live counts indefinitely.
- The per-event **OG image** route fetches event data server-side and is cached with the same TTL; it must render in <1s p90 (E3.T2).
- Cancelled/rescheduled state MUST invalidate the relevant cache so a freshly opened link shows current state (E8.T3).

## Live headcount (E5)

- Update in/out/maybe counts without a full refresh via **polling with revalidation** (default) or SSE if justified. A second viewer should see an RSVP within the chosen interval. Announce updates accessibly (`aria-live`) — see [accessibility.md](./accessibility.md).

## States & errors

- Every data view handles **loading / empty / expired / cancelled / full-and-waitlisted** explicitly (E4.T1). No silent blank screens.
- On fetch failure, show a recoverable error, not a crash; surface the API's `error.code` meaningfully. Never render another attendee's contact — the API already scopes this, but the UI must not request or display it.

## Privacy

- Never put PII (names, phone, email) or tokens in URLs/query strings. Pass identifiers via the path (unguessable IDs) or the cookie.
