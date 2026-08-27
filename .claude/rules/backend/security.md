# Backend Security Rules

**Scope:** AuthN/Z, secrets, input safety, and PII on the NestJS API. **Consult when** touching auth, cookies, data access, logging, or handling contact info.
**Authority:** [PRD §7, §3](../../../docs/PRD.md), [TASKS E1.T4, X4](../../../docs/TASKS.md). Pairs with [pen-testing-and-threat-model.md](./pen-testing-and-threat-model.md).

## Identity & sessions

- **Host magic-link:** passwordless, single-use, expiring. Store only a **hash** of the token (never the raw token); mark used on redemption; enforce expiry server-side. One active token supersedes older ones.
- **Attendee device-key:** a signed cookie (`httpOnly`, `Secure` in prod, `SameSite=Lax`), **first-party on the web origin** via the BFF — the Nest API signs/owns it; Next relays `Set-Cookie`. The key is opaque; it grants no host privileges.
- Host-only actions (edit/cancel/reschedule/check-in) MUST verify the caller owns the event before mutating. Default-deny.

## Secrets & config

- Secrets come only from validated env (`env.ts`); never hardcoded, never committed. `.env*` is gitignored; `.env.example` documents keys.
- Next→Nest server-to-server calls are authenticated with `INTERNAL_API_SECRET`; CORS on the API is locked to the known web origin(s) with credentials — no wildcard.

## Input & data access

- Use Prisma's parameterized queries. NEVER build SQL by string interpolation; avoid `$queryRawUnsafe`. Validate all input with Zod before it reaches a service.
- Enforce the same-object authorization on every read that can expose another user's data (IDOR): scope queries by owner/device, don't filter in application code after over-fetching.

## PII & consent (X4)

- Contact (phone/email) is **optional** and captured only with explicit consent copy (E4.T2). Store the minimum needed for reminders; record consent and honor opt-out everywhere — an opted-out attendee receives no further messages (E9.T4), proven by a test.
- Re-invite messaging (E7) targets only attendees who stored contact + consent (E7.T3). Document retention and purpose for stored contacts.

## Logging & dependencies

- Never log secrets, tokens, full contact details, or raw request bodies containing PII. Log identifiers, not payloads.
- Keep the lockfile frozen in CI; run `pnpm audit` on dependency changes; apply security-relevant updates promptly.
- Set standard security headers (HSTS, `X-Content-Type-Options`, sensible `Referrer-Policy`) at the API/edge.
