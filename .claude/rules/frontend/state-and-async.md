# Frontend State & Async Rules

**Scope:** Client state, optimistic UI, and async handling in `apps/web`. **Consult when** adding interactivity, forms, or mutations.
**Authority:** [TASKS E4.T2, E4.T3, E5](../../../docs/TASKS.md).

## Prefer server state

- Default to **server state + revalidation** over client-side stores. Most screens are server components; re-fetch/`revalidate` after a mutation rather than mirroring server data in React state.
- Reach for a global store only when there is genuinely shared cross-component client state — and justify it. For local UI concerns, `useState`/`useReducer` is enough.

## Mutations (RSVP)

- RSVP submit MUST complete in ≤2 taps (P0.3). Use **optimistic UI**: reflect In/Out/Maybe immediately, then reconcile with the server response; **roll back on failure** and show why.
- Changing a response is **idempotent** — it never creates a duplicate RSVP (E4.T3). The client sends the same intent; the API mutates the single row. Disable the control while a request is in flight to prevent double-submit.
- Guard against races: ignore stale responses (e.g. track the latest request), and never apply a resolved response after the component unmounted.

## Async hygiene

- Wrap async UI in Suspense and error boundaries so one failed fetch doesn't blank the page.
- Debounce/throttle rapid inputs; cancel in-flight requests that are superseded.
- No `setState` after unmount; clean up timers, intervals (polling), and subscriptions in effect cleanups.

## Forms

- Show clear submitting / success / error states. Validate with the shared Zod schema for fast feedback, but the server remains the source of truth — see [security.md](./security.md) and [typescript-type.md](./typescript-type.md).
