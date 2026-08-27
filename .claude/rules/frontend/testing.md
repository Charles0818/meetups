# Frontend Testing Rules

**Scope:** How `apps/web` is tested. **Consult when** adding a component, page, or flow.
**Authority:** [TASKS X2, X3](../../../docs/TASKS.md). Runner: **Vitest + React Testing Library**.

## Approach

- Test **behavior, not implementation.** Query by role/label/text (`getByRole`, `getByLabelText`) — this aligns tests with accessibility (see [accessibility.md](./accessibility.md)) and survives refactors. Avoid testing internal state or snapshotting large trees.
- Prefer testing **client components and presentational logic**. Server-side data functions are covered by backend integration tests and E2E; don't reach into server internals from unit tests.

## What to cover

- The RSVP flow's states: **empty, expired, cancelled, full→waitlisted**, and successful In/Out/Maybe including the change-response (no duplicate) path (E4).
- Optimistic update + rollback on failure; disabled control while submitting.
- Accessibility assertions where cheap (roles, labels, focus move after submit).

## Isolation

- **No real network.** Mock the BFF/API layer (e.g. MSW or a fetch mock); assert the component's behavior given API responses and errors. Tests MUST be deterministic and independent of order.

## End-to-end (later)

- The happy-path E2E — **create → share → RSVP → confirm → cancel** (X2.3) — runs in CI once built (Playwright is the intended tool; note it, don't scaffold prematurely). Keep it to the critical path.
