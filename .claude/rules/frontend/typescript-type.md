# TypeScript & Typing Rules

**Scope:** TypeScript usage across the monorepo (both apps + packages). **Consult when** writing types, DTOs, or touching `tsconfig`.
**Authority:** base config `packages/config/tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `isolatedModules`).

## Strictness

- `strict` is on everywhere and stays on. Respect `noUncheckedIndexedAccess` — handle the `undefined` from indexed access; don't assert it away.
- **No `any`.** ESLint flags it (`@typescript-eslint/no-explicit-any`). Use `unknown` at boundaries and **narrow** before use. No implicit `any` on params/returns for exported functions.
- No non-null assertions (`!`) or `@ts-ignore` without a justified, commented `@ts-expect-error`. Prefer fixing the type.

## Zod as the source of truth

- Request/response and env shapes are **Zod schemas in `packages/shared`**; derive TypeScript types with `z.infer`. Do not hand-write a parallel `interface` that can drift from the schema.
- Both apps import the same schemas — the API validates with them, the web validates forms with them, and the typed client is built from them.

## Domain modeling

- Model `Event.status` (`draft|published|cancelled`) and `Rsvp.status` (`in|out|maybe|waitlisted`) as **discriminated unions / literal types** aligned with the Prisma enums. Handle them with exhaustive `switch` + a `never` default so a new status is a compile error.
- Keep Prisma-generated types inside the API (service layer); expose only the shared DTO types across the boundary — the web never imports Prisma types.

## Modules

- Use `import type { … }` for type-only imports (required under `isolatedModules`; keeps bundles clean). Prefer named exports.
