# meet-invite — Task Breakdown

Decomposition of the PRD (`docs/PRD.md`) into epics → tasks → subtasks.

**Legend**
- Priority mirrors the PRD: **P0** (must-have), **P1** (fast follow), **P2** (design-for, don't build).
- `→ Pn.n` links a task to the PRD requirement it satisfies.
- **Blocks / Blocked by** capture ordering. Anything unmarked can start once its epic's foundation exists.
- Phase mirrors the PRD timeline: **Phase 0** validate, **Phase 1** core loop, **Phase 2** retention hooks, **Phase 3** fast follows.

Suggested stack (a decision, not a given — see E1.T0): TypeScript end-to-end. Next.js (App Router) for the attendee/host web surface and OG rendering, a Node service (NestJS or Next route handlers) for the API, Postgres via Prisma, a queue for scheduled reminders (e.g. BullMQ + Redis, or a hosted cron/queue).

---

## Phase 0 — Validate (before build)

### E0. Discovery & de-risking
Goal: kill the two assumptions that can invalidate the build before writing app code.

- **E0.T1 — Host interviews (×10).** → PRD §7 blocking Q1
  - E0.T1.1 Recruit 10 people currently running recurring free meetups.
  - E0.T1.2 Run the guide: "what did you do the last time you needed to collect money for an event?" / "what would you be most upset to lose if your current tool vanished?"
  - E0.T1.3 Synthesize: is the money in payments, in the list, or nowhere? Write a one-page findings doc.
  - **Exit criteria:** a go / no-go on the recurring-host thesis and a first read on willingness to pay.
- **E0.T2 — Link-preview rendering spike.** → PRD §7 blocking Q2, P0.2
  - E0.T2.1 Stand up a throwaway page with OG/oEmbed tags + a server-rendered preview image.
  - E0.T2.2 Paste the link in WhatsApp, Telegram, iMessage, Discord, Slack, Twitter/X; record which render richly.
  - E0.T2.3 Measure preview cache behavior per platform — does a live headcount in the preview survive caching, or must headcount live on the page only?
  - **Exit criteria:** a decision on whether P0.2's "headcount in the preview" claim is feasible or must be softened.
- **E0.T3 — Notification channel & consent decision.** → PRD §7 blocking Q3, non-blocking Q1
  - E0.T3.1 Compare SMS vs email for confirm-rate vs per-event cost.
  - E0.T3.2 Draft the minimum compliant consent flow for transactional SMS/email in launch regions.
  - **Exit criteria:** chosen channel(s) for v1 and a consent copy draft.

---

## Phase 1 — Core loop

### E1. Foundation: repo, infra, data model
Goal: everything the feature epics stand on.

- **E1.T0 — Stack & architecture decision (ADR).**
  - Confirm framework, DB, queue, hosting, OG-image approach. Record as `docs/adr/0001-stack.md`.
- **E1.T1 — Repo & tooling.**
  - E1.T1.1 Init monorepo or single app; TypeScript strict, ESLint/Prettier, commit hooks.
  - E1.T1.2 CI: typecheck + lint + test on PR.
  - E1.T1.3 Env config & secrets scaffolding (local `.env`, deployed secrets).
- **E1.T2 — Database & ORM.**
  - E1.T2.1 Provision Postgres; wire Prisma (or chosen ORM); migration workflow.
  - E1.T2.2 Schema — core entities and relations:
    - `Host` (id, contact, created via magic link)
    - `Group` (id, hostId, name, createdFrom eventId) — created lazily at P0.6
    - `Event` (id, hostId, groupId?, title, startsAt, location, capacity?, description?, status: draft|published|cancelled, **price nullable → P2.2**, confirmWindowMins, releaseWindowMins)
    - `Rsvp` (id, eventId, attendeeId, status: in|out|maybe|waitlisted, confirmedAt?, contact?, source: web **| platform → P2.1**, createdAt)
    - `Attendee` (id, deviceKey, name, contact?) — **attendance history preserved across events/groups → P2.3**
    - `Attendance` (id, eventId, attendeeId, checkedInAt?) — **populated at P1.1**, table exists now
  - E1.T2.3 Seed script + fixtures for local dev.
  - **Note:** nullable `price`, `Rsvp.source`, and persisted `Attendee`/`Attendance` are the P2 hooks — cheap to add now, expensive to retrofit.
- **E1.T3 — Core API surface.**
  - E1.T3.1 Event CRUD endpoints.
  - E1.T3.2 RSVP create/update endpoints.
  - E1.T3.3 Validation, error contract, rate limiting on public RSVP endpoints.
- **E1.T4 — Identity primitives.**
  - E1.T4.1 Host magic-link auth (email/phone), deferred until after first link (→ P0.1).
  - E1.T4.2 Attendee device-key issuance (cookie) + optional contact capture (→ P0.3).

### E2. Instant event creation → P0.1
Blocked by: E1.

- **E2.T1 — Creation form (≤3 fields).**
  - E2.T1.1 Title, date/time, location; optional capacity & description.
  - E2.T1.2 Smart defaults (date → next Saturday 18:00 local; timezone from browser).
  - E2.T1.3 Inline validation, mobile-first layout.
- **E2.T2 — Link-before-signup flow.**
  - E2.T2.1 Generate event + shareable link with no host account.
  - E2.T2.2 Post-create "claim this event" via magic link to edit later.
- **E2.T3 — Edit/claim event.** Host returns via magic link to edit.
- **Acceptance:** creation → link in ≤10s median; no sign-up required before the link exists.

### E3. Rich link preview → P0.2
Blocked by: E2, E0.T2 outcome.

- **E3.T1 — OG/oEmbed metadata** per event (title, date, location, headcount if E0.T2 allows).
- **E3.T2 — Server-side preview image generator** (per-event, cached).
- **E3.T3 — Cross-platform verification** on the five target platforms + Twitter/X; cache TTL ≤5 min for headcount if feasible.
- **Acceptance:** ≥95% rich-preview render across targets.

### E4. Accountless RSVP + capacity/waitlist → P0.3
Blocked by: E1, E2.

- **E4.T1 — Attendee event view** (public, from link).
- **E4.T2 — One-/two-tap RSVP** (In/Out/Maybe) + first name; optional contact for reminders.
- **E4.T3 — Change response** from the same link/device.
- **E4.T4 — Capacity & waitlist.**
  - E4.T4.1 When full, "In" → waitlisted with position shown.
  - E4.T4.2 Promotion logic hook (consumed by E6).
- **Acceptance:** RSVP in ≤2 taps; full-capacity path yields waitlist position.

### E5. Live headcount → P0.4
Blocked by: E4.

- **E5.T1 — Real-time counts** (in/out/maybe) without refresh (polling or SSE/websocket).
- **E5.T2 — Visibility rules:** host sees contacts; attendees see first names only.
- **Acceptance:** counts update live; correct visibility split.

### E8. Cancel / reschedule → P0.7
Blocked by: E4, E9.

- **E8.T1 — Cancel/reschedule actions** on the event.
- **E8.T2 — Notify all RSVP'd attendees with contact.**
- **E8.T3 — Preview + page reflect cancellation.**
- **Acceptance:** no attendee is left uninformed of a cancel/reschedule.

### E9. Notification infrastructure (cross-cutting)
Blocked by: E0.T3 decision. Feeds E6, E8.

- **E9.T1 — Provider integration** (SMS and/or email per E0.T3).
- **E9.T2 — Templated messages** (reminder, confirm request, promotion, cancel/reschedule).
- **E9.T3 — Scheduled-job runner** (queue/cron) for time-based sends.
- **E9.T4 — Consent capture + unsubscribe/opt-out** handling.
- **E9.T5 — Delivery logging** (for debugging + future metrics).

---

## Phase 2 — Retention hooks (tests the thesis)

### E6. Confirm-your-spot flow (the no-show fix) → P0.5
Blocked by: E4 (waitlist), E9 (notifications).

- **E6.T1 — Host config:** enable/disable; set confirm window (default 24h) and release window (default 6h).
- **E6.T2 — Confirm request send** to "In" attendees with contact at confirm window; one-tap confirm.
- **E6.T3 — Release + promote logic** at release deadline: release unconfirmed, promote next waitlisted, notify both parties.
- **E6.T4 — No-contact handling:** remain "In (unconfirmed)", counted separately, never silently dropped.
- **E6.T5 — Edge cases:** same-day events where 24h/6h windows don't fit (clamp/skip); re-confirm after reschedule.
- **Acceptance:** each Given/When/Then in PRD P0.5 passes.

### E7. Second-event re-invite + groups → P0.6
Blocked by: E1 (Group entity), E9.

- **E7.T1 — Detect repeat host** at creation time (host has ≥1 prior event).
- **E7.T2 — "Invite the N from [last event]" offer**, one tap to accept.
- **E7.T3 — Message only opted-in contacts.**
- **E7.T4 — Lazy group creation:** accepting creates a persistent `Group` (name defaults to host's name; editable) and links past + new events.
- **Acceptance:** repeat host sees the offer; accepting materializes a group without an explicit "create group" step.

---

## Phase 3 — Fast follows (P1)

### E10. P1 features (order by host demand; P1.1 first — unlocks the attendance metric)
- **E10.T1 — Attendance check-in** → P1.1. Host marks who showed; populates `Attendance`; feeds no-show metric + "real regulars."
- **E10.T2 — Group calendar subscription** → P1.2. ICS feed per group; per-event add-to-calendar.
- **E10.T3 — Host dashboard** → P1.3. Past events, attendance rate, regulars list.
- **E10.T4 — Copy-ready announcement** → P1.4. Pre-written message + link for weak-preview platforms.
- **E10.T5 — Attendee "my events" view** → P1.5. Everything a device has RSVP'd to.

---

## Deferred (P2 — design for, do not build)
Tracked so no P1 decision accidentally forecloses them. Hooks already placed in E1.T2.
- **P2.1 Native chat bots** — `Rsvp.source` supports a platform identity.
- **P2.2 Payments** — nullable `Event.price` + a provider-agnostic order record (add record type when built).
- **P2.3 Deposits / attendee reputation** — `Attendee`/`Attendance` history persisted from day one.
- **P2.4 Paid group tier** — `Group` exists from P0.6; gate later.

---

## Cross-cutting (applies across Phase 1–2)
- **X1 — Metrics instrumentation** → PRD §6. Event/RSVP funnel events; creation-to-link timing; preview render success; confirm-flow adoption. Wire the **kill signal** (second-event rate) into a dashboard.
- **X2 — Testing.** Unit (release/promote logic, waitlist), integration (RSVP + capacity), E2E (create → share → RSVP → confirm). See `engineering:testing-strategy` if a formal plan is wanted.
- **X3 — Accessibility & mobile.** Attendee flow is mobile-web first; WCAG AA on the RSVP path.
- **X4 — Privacy/compliance.** Consent for contact + reminders; data retention for attendee contacts; opt-out.

---

## Critical path (shortest route to a testable core loop)
E1 → E2 → E4 → E5 (+ E3 for shareability) = the Phase 1 loop a host can actually use.
Then E9 → E6 + E7 = Phase 2, which is where the recurring-host thesis is proven or killed.
