# Backend Threat Model & (Authorized) Pen-Testing Rules

**Scope:** Threats against the accountless RSVP surface and how we test defensively. **Consult when** designing a public endpoint, an abuse control, or a pre-launch security pass.
**Authority:** [PRD §7](../../../docs/PRD.md). Mitigations live in [security.md](./security.md).

> **Defensive only.** Security testing here means authorized testing of _our own_ system (this repo, our staging/prod, our accounts). Do not use these notes to target third parties.

## Attack surface

The product is opened by strangers inside chat webviews, mostly without accounts. Treat every public input as hostile.

## STRIDE-lite by surface

- **Spoofing** — forged device-key cookies; magic-link replay/interception. _Mitigate:_ signed cookies, hashed single-use expiring tokens.
- **Tampering** — manipulating RSVP status/waitlist position; editing another host's event. _Mitigate:_ server-side state machine, ownership checks, transactional allocation.
- **Repudiation** — untraceable actions. _Mitigate:_ delivery + action logging (no PII).
- **Information disclosure** — **event-ID enumeration** and attendee-data scraping. _Mitigate:_ unguessable IDs (cuid/uuid); public responses expose first names only; rate-limit list endpoints.
- **Denial of service / abuse** — fake RSVPs inflating headcount; **notification bombing** via re-invite; brute-forcing magic links. _Mitigate:_ rate limits + `429`, consent-scoped messaging (E7.T3), per-contact send caps, throttled token issuance.
- **Elevation** — IDOR to host-only data/actions. _Mitigate:_ owner-scoped queries, default-deny authorization.

## Specific abuse cases to design against

- CSRF on cookie-authenticated mutations → SameSite cookies + CSRF token on state-changing requests.
- Waitlist gaming / double-booking under races → the transactional allocation in [concurrency-and-workers.md](./concurrency-and-workers.md).
- Spam via free-text fields (name, description) → length limits, sanitize on render (see [frontend/security.md](../frontend/security.md)).
- Rate-limit bypass via header spoofing → key limits on a trusted client identifier, not just `X-Forwarded-For`.

## Pre-launch checklist

- [ ] IDs unguessable; no sequential exposure.
- [ ] Rate limits on create + RSVP + list, with tests.
- [ ] AuthZ checks on every host action (IDOR review).
- [ ] Consent + opt-out enforced; per-contact send caps.
- [ ] No PII/secrets in logs or error responses.
- [ ] CORS locked; internal secret required for Next→Nest.
- [ ] `pnpm audit` clean of known-exploitable highs.
