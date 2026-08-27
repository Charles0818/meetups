# Frontend Architecture Rules

**Scope:** How the Next.js app (`apps/web`) is structured. **Consult when** adding a route, component, or deciding server vs client.
**Authority:** [ADR-0001](../../../docs/adr/0001-stack.md), [TASKS X3](../../../docs/TASKS.md).

## The BFF boundary (non-negotiable)

- `apps/web` **never touches the database** and never imports Prisma. All data comes from the NestJS API. See [backend/architecture.md](../backend/architecture.md).
- **Mutations and cookie-bearing requests go browser → Next (same-origin route handler) → Nest API.** The client MUST NOT call the Nest API cross-origin directly; the Next route handler forwards the request and **relays Nest's `Set-Cookie`** so the device-key stays first-party (survives in-app chat browsers). See [data-fetching.md](./data-fetching.md).
- Server-to-server reads (SSR, OG) may call the Nest API directly from server components.

## Server-first components

- **Server Components by default.** Add `'use client'` only for genuine interactivity (RSVP controls, forms, live updates) and keep client components as small leaves.
- Server-only modules — `src/config/env.ts`, the API client with secrets — MUST NOT be imported into client components. Mark them `import 'server-only'` where appropriate; never expose `INTERNAL_API_SECRET` or `API_BASE_URL` internals to the bundle.

## Mobile-web first

- Primary surface is a phone inside a chat webview (X3.1). Design and build mobile-first; verify the RSVP path on a narrow viewport. Accessibility is a hard requirement — see [accessibility.md](./accessibility.md).

## Layout & structure

- `app/` for routes (App Router); route handlers under `app/api/**` act as the BFF proxy. Reusable UI in `components/`; helpers, the typed API client, and server utilities in `lib/`.
- Keep presentation separate from data access: a server component fetches and passes plain props to presentational components. State/async patterns follow [state-and-async.md](./state-and-async.md); types follow [typescript-type.md](./typescript-type.md).
