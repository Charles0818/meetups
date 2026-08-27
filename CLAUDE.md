# meet-invite — Claude working guide

Chat-native meetup RSVP tool. A host creates an event in seconds, drops a link into a group chat, and RSVPs happen in the chat's in-app browser. See [`docs/PRD.md`](docs/PRD.md) and the task breakdown in [`docs/TASKS.md`](docs/TASKS.md).

## Stack (see [ADR-0001](docs/adr/0001-stack.md))

- **Monorepo:** pnpm workspaces + Turborepo.
- **`apps/api`** — NestJS. **Sole owner of the database**; Prisma lives only here. Also runs BullMQ producers + consumers in-process.
- **`apps/web`** — Next.js (App Router). Thin frontend/BFF; **never touches the DB** — it calls the API. The browser reaches Nest only through same-origin Next route handlers (first-party device-key cookie).
- **`packages/config`** — shared tsconfig/eslint. `packages/database` (Prisma) and `packages/shared` (Zod DTOs + typed client) are added in E1.T2 / E1.T3.
- Postgres · Redis · Zod validation · OpenAPI via `@nestjs/swagger` · Vercel (web) + container host (api).

## Key commands (run from repo root)

- `pnpm dev` — run both apps (web :3000, api :3001).
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` — Turbo pipelines; all must be green before pushing.
- `pnpm format` — Prettier across the repo.

## Commit policy

Conventional Commits, and **no AI attribution** — commit messages and PR bodies MUST NOT include `Co-authored-by:` trailers naming AI agents (Claude, Codex, Cursor, …) or "🤖 Generated with …" signatures. The `commit-msg` hook enforces both. Human co-authors are allowed. See [.claude/rules/git-workflow.md](.claude/rules/git-workflow.md).

## Rules — consult the relevant file before working in that area

These are authoritative. Open the file that matches the task; don't guess.

| When you are…                                                           | Read                                                                                                           |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Structuring the API — modules, controllers, services, where logic lives | [.claude/rules/backend/architecture.md](.claude/rules/backend/architecture.md)                                 |
| Adding/changing an endpoint, request/response, or error shape           | [.claude/rules/backend/api-design.md](.claude/rules/backend/api-design.md)                                     |
| Touching capacity/waitlist, confirm/release, or any BullMQ job          | [.claude/rules/backend/concurrency-and-workers.md](.claude/rules/backend/concurrency-and-workers.md)           |
| Optimizing queries, indexes, or the headcount read path                 | [.claude/rules/backend/database-optimization.md](.claude/rules/backend/database-optimization.md)               |
| Handling auth, cookies, secrets, PII/consent, or logging (API)          | [.claude/rules/backend/security.md](.claude/rules/backend/security.md)                                         |
| Designing a public surface / abuse control / pre-launch security pass   | [.claude/rules/backend/pen-testing-and-threat-model.md](.claude/rules/backend/pen-testing-and-threat-model.md) |
| Writing API tests (services, integration, jobs)                         | [.claude/rules/backend/testing.md](.claude/rules/backend/testing.md)                                           |
| Structuring the web app — routes, server vs client, the BFF boundary    | [.claude/rules/frontend/architecture.md](.claude/rules/frontend/architecture.md)                               |
| Fetching data, caching/revalidation, or the live headcount              | [.claude/rules/frontend/data-fetching.md](.claude/rules/frontend/data-fetching.md)                             |
| Adding interactivity, forms, optimistic RSVP, or client state           | [.claude/rules/frontend/state-and-async.md](.claude/rules/frontend/state-and-async.md)                         |
| Rendering user content, cookies, CSRF, links/redirects (web)            | [.claude/rules/frontend/security.md](.claude/rules/frontend/security.md)                                       |
| Building any UI, form, or interactive control                           | [.claude/rules/frontend/accessibility.md](.claude/rules/frontend/accessibility.md)                             |
| Writing web tests                                                       | [.claude/rules/frontend/testing.md](.claude/rules/frontend/testing.md)                                         |
| Writing types, DTOs, or touching tsconfig                               | [.claude/rules/frontend/typescript-type.md](.claude/rules/frontend/typescript-type.md)                         |
| Committing, opening a PR, or managing migrations                        | [.claude/rules/git-workflow.md](.claude/rules/git-workflow.md)                                                 |

## Status

Phase 1 foundation (E1). Done: E1.T0 (ADR), E1.T1 (repo & tooling). Next: E1.T2 (Postgres + Prisma). Update `docs/TASKS.md` checkboxes as tasks complete.
