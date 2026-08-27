# Frontend Security Rules

**Scope:** Client-side safety in `apps/web`. **Consult when** rendering user content, handling cookies, submitting forms, or following links.
**Authority:** [PRD §3, §7](../../../docs/PRD.md), [TASKS X4](../../../docs/TASKS.md). Pairs with [backend/security.md](../backend/security.md).

## XSS & untrusted content

- Event titles, descriptions, and attendee names are **user-supplied and untrusted.** Render them as text (React escapes by default). NEVER use `dangerouslySetInnerHTML` with such data. If rich text is ever needed, sanitize with a vetted allowlist library.
- Do not build DOM from strings or inject untrusted values into `href`/`src`/inline styles.

## Cookies, tokens, storage

- The device-key cookie is `httpOnly` and set by the server — it is **not readable from JS**, and that is intentional. Do not attempt to mirror it into `localStorage`.
- MUST NOT store secrets, magic-link tokens, or API secrets in the client, `localStorage`, or the bundle. `INTERNAL_API_SECRET` / `API_BASE_URL` live only server-side (see [architecture.md](./architecture.md)).

## CSRF & requests

- State-changing requests are cookie-authenticated through the BFF → protect with `SameSite` cookies **plus** a CSRF token on mutations. The client sends only to same-origin route handlers.
- Validate inputs client-side with the shared Zod schema for UX, but the server re-validates and is authoritative — never trust client validation for security.

## Links & redirects

- Guard the magic-link/claim and any post-action redirect against **open redirects**: only redirect to same-origin/allowlisted paths.
- External links use `rel="noopener noreferrer"`. Treat any URL derived from user/event content as untrusted.

## Consent & privacy

- Contact capture (phone/email) shows explicit **consent copy** and is optional (E4.T2). Never pre-check consent. No PII in URLs, analytics events, or logs.
- Decline non-essential cookies/trackers by default.
