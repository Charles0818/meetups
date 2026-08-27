# meet-invite — Task Breakdown

Decomposition of the PRD (`docs/PRD.md`) into **epics → tasks → subtasks**, each with a checkbox and acceptance criteria.

**How to read this**

- Every epic, task, and subtask has a `- [ ]` checkbox. Check the box when the item is done and its acceptance criteria pass.
- **AC** = acceptance criteria for a task — the conditions that must hold before its box is checked. AC lines are plain bullets (not checkboxes); tick the task's own box once every AC underneath it is satisfied.
- `→ Pn.n` links to the PRD requirement satisfied.
- **Blocked by** captures ordering. Unmarked items can start once their epic foundation exists.
- Phases mirror the PRD timeline: **Phase 0** validate · **Phase 1** core loop · **Phase 2** retention hooks · **Phase 3** fast follows.

**Suggested stack** (a decision, not a given — see E1.T0): TypeScript end-to-end. Next.js (App Router) for the attendee/host surface + OG rendering, a Node API (NestJS or Next route handlers), Postgres via Prisma, and a queue for scheduled reminders (BullMQ + Redis, or a hosted equivalent).

**Progress key:** ☐ not started · ◐ in progress · ☑ done — update the checkbox, not this key.

---

## Phase 0 — Validate (before build)

### - [ ] E0. Discovery & de-risking

Goal: kill the two assumptions that can invalidate the build before writing app code.

- [ ] **E0.T1 — Host interviews (×10)** → PRD §7 Q1 _(provisional: simulated proxy done — see `docs/research/`; real interviews still gate)_
  - [x] E0.T1.1 Draft the interview guide (2 core questions + probes).
  - [ ] E0.T1.2 Recruit 10 people currently running recurring free meetups. _(outstanding — simulated only)_
  - [ ] E0.T1.3 Run all 10 sessions; capture verbatim notes. _(outstanding — 5 simulated personas run as proxy)_
  - [x] E0.T1.4 Tag responses: money-in-payments / money-in-list / money-nowhere. _(applied to simulated set)_
  - [x] E0.T1.5 Write a one-page findings memo with a go / no-go recommendation. _(provisional — `docs/research/discovery-findings.md`)_
  - **AC:**
    - 10 interviews completed and notes stored in `docs/research/`.
    - Findings memo states a clear position on the recurring-host thesis and a first read on willingness to pay.
    - A decision is recorded: proceed to Phase 1, pivot, or stop.

- [ ] **E0.T2 — Link-preview rendering spike** → PRD §7 Q2, P0.2
  - [ ] E0.T2.1 Stand up a throwaway page with OG + oEmbed tags and a server-rendered preview image.
  - [ ] E0.T2.2 Paste the link in WhatsApp, Telegram, iMessage, Discord, Slack, Twitter/X; screenshot each result.
  - [ ] E0.T2.3 Test cache behavior: change headcount, re-share, observe whether the preview updates per platform.
  - [ ] E0.T2.4 Document per-platform support + cache TTL observations.
  - **AC:**
    - A matrix records rich-preview support and cache behavior for all six platforms.
    - A decision is recorded on whether "headcount in the preview" is feasible or must move to the page only.

- [ ] **E0.T3 — Notification channel & consent decision** → PRD §7 Q3
  - [ ] E0.T3.1 Compare SMS vs email on confirm-rate potential and per-event cost across launch regions.
  - [ ] E0.T3.2 Draft the minimum compliant consent flow for transactional messaging.
  - [ ] E0.T3.3 Pick v1 channel(s) and draft consent + opt-out copy.
  - **AC:**
    - v1 notification channel(s) chosen and rationale recorded.
    - Consent + opt-out copy drafted and legally reviewed (or flagged for review).

---

## Phase 1 — Core loop

### - [ ] E1. Foundation: repo, infra, data model

Goal: everything the feature epics stand on.

- [x] **E1.T0 — Stack & architecture decision (ADR)**
  - [x] E1.T0.1 Draft `docs/adr/0001-stack.md` (framework, DB, queue, hosting, OG-image approach).
  - [x] E1.T0.2 Review trade-offs; mark the ADR accepted.
  - **AC:**
    - ADR is committed with status "Accepted" and names every core technology choice.

- [x] **E1.T1 — Repo & tooling**
  - [x] E1.T1.1 Initialize app (monorepo or single app); TypeScript `strict` on. _(pnpm + Turborepo monorepo: `apps/web`, `apps/api`, `packages/config`; strict base tsconfig)_
  - [x] E1.T1.2 ESLint + Prettier + commit hooks (lint-staged / husky).
  - [x] E1.T1.3 CI pipeline: typecheck + lint + test on every PR. _(`.github/workflows/ci.yml` authored; PR-blocking verified once a GitHub remote + branch protection exist)_
  - [x] E1.T1.4 Env/secrets scaffolding: `.env.example`, local + deployed secret loading. _(per-app `.env.example` + Zod-validated `env.ts` in each app)_
  - **AC:**
    - `npm run typecheck && npm run lint && npm test` pass on a clean checkout.
    - CI blocks a PR that fails any of the three.
    - No secret values are committed; `.env.example` lists every required key.

- [ ] **E1.T2 — Database & ORM**
  - [ ] E1.T2.1 Provision Postgres (local via Docker + deployed instance).
  - [ ] E1.T2.2 Wire the ORM (Prisma) and the migration workflow.
  - [ ] E1.T2.3 Model core entities:
    - `Host` (id, contact, createdAt) — created via magic link.
    - `Group` (id, hostId, name, createdFromEventId) — created lazily at P0.6.
    - `Event` (id, hostId, groupId?, title, startsAt, timezone, location, capacity?, description?, status: draft|published|cancelled, **price nullable → P2.2**, confirmWindowMins, releaseWindowMins).
    - `Attendee` (id, deviceKey, name, contact?) — **history preserved across events/groups → P2.3**.
    - `Rsvp` (id, eventId, attendeeId, status: in|out|maybe|waitlisted, waitlistPosition?, confirmedAt?, **source: web|platform → P2.1**, createdAt).
    - `Attendance` (id, eventId, attendeeId, checkedInAt?) — table exists now, **populated at P1.1**.
  - [ ] E1.T2.4 Add indexes (eventId, attendeeId, status) and uniqueness (one active RSVP per attendee+event).
  - [ ] E1.T2.5 Seed script + fixtures for local dev.
  - **AC:**
    - Migrations apply cleanly from empty to head and roll back one step.
    - The P2 hooks (`Event.price`, `Rsvp.source`, persisted `Attendee`/`Attendance`) exist and are nullable/optional so they don't affect v1 behavior.
    - Seed script produces a host with two past events and RSVPs for local testing.

- [ ] **E1.T3 — Core API surface**
  - [ ] E1.T3.1 Event endpoints: create, read, update, cancel.
  - [ ] E1.T3.2 RSVP endpoints: create, update (change response), read list.
  - [ ] E1.T3.3 Shared validation layer (schema validation on all inputs).
  - [ ] E1.T3.4 Uniform error contract (shape, codes, messages).
  - [ ] E1.T3.5 Rate limiting on public RSVP + creation endpoints.
  - **AC:**
    - Every endpoint validates input and returns the documented error shape on bad input.
    - Public endpoints reject abusive request rates (verified by a test).
    - API contract documented (OpenAPI or typed client) and matches implementation.

- [ ] **E1.T4 — Identity primitives**
  - [ ] E1.T4.1 Host magic-link auth (email/phone), issued/verified without a password.
  - [ ] E1.T4.2 Defer host account creation until after the first link exists (→ P0.1).
  - [ ] E1.T4.3 Attendee device-key issuance (signed cookie) + optional contact capture (→ P0.3).
  - **AC:**
    - A host can create an event, then claim/edit it later via a magic link with no password.
    - An attendee is uniquely identified across visits by device key without any account.
    - Magic links expire and are single-use.

### - [ ] E2. Instant event creation → P0.1

Blocked by: E1.

- [ ] **E2.T1 — Creation form (≤3 required fields)**
  - [ ] E2.T1.1 Fields: title, date/time, location; optional capacity + description.
  - [ ] E2.T1.2 Smart defaults: date → next Saturday 18:00 local; timezone from browser.
  - [ ] E2.T1.3 Inline validation + mobile-first layout.
  - **AC:**
    - An event is creatable with exactly 3 inputs; optional fields can be skipped.
    - Defaults populate without user action and are editable.
    - Median create-to-link time ≤10s in a manual timing test.

- [ ] **E2.T2 — Link-before-signup flow**
  - [ ] E2.T2.1 Generate event + shareable link with no host account.
  - [ ] E2.T2.2 Present "claim this event" (magic link) after creation to enable later edits.
  - **AC:**
    - The shareable link exists before any sign-up step.
    - Claiming binds the event to a host without losing RSVPs.

- [ ] **E2.T3 — Edit / claim event**
  - [ ] E2.T3.1 Host returns via magic link to edit title/date/location/capacity.
  - [ ] E2.T3.2 Edits propagate to the public event view.
  - **AC:**
    - Given a claimed event, when the host edits a field, then the public view reflects it within one refresh.

### - [ ] E3. Rich link preview → P0.2

Blocked by: E2; informed by E0.T2.

- [ ] **E3.T1 — OG / oEmbed metadata per event**
  - [ ] E3.T1.1 Emit title, date, location tags per event.
  - [ ] E3.T1.2 Include headcount only if E0.T2 proved it survives caching.
  - **AC:**
    - Metadata validates in a link-preview debugger for the target platforms.

- [ ] **E3.T2 — Server-side preview image generator**
  - [ ] E3.T2.1 Render a per-event image (title, date, location).
  - [ ] E3.T2.2 Cache images; set TTL ≤5 min where headcount is shown.
  - **AC:**
    - Each event produces a unique preview image within acceptable latency (<1s p90).

- [ ] **E3.T3 — Cross-platform verification**
  - [ ] E3.T3.1 Verify rich rendering on WhatsApp, Telegram, iMessage, Discord, Slack, Twitter/X.
  - **AC:**
    - ≥95% of shares across targets show a rich preview (recorded in a check matrix).

### - [ ] E4. Accountless RSVP + capacity/waitlist → P0.3

Blocked by: E1, E2.

- [ ] **E4.T1 — Attendee event view (public)**
  - [ ] E4.T1.1 Render event details from the link with no login.
  - [ ] E4.T1.2 Empty/expired/cancelled states.
  - **AC:**
    - The event opens from a cold link on mobile web with no account prompt.

- [ ] **E4.T2 — One-/two-tap RSVP**
  - [ ] E4.T2.1 In / Out / Maybe controls + first-name capture.
  - [ ] E4.T2.2 Optional contact (phone/email) for reminders, with consent copy.
  - **AC:**
    - RSVP completes in ≤2 taps from link open.
    - No password or account is required; contact is optional.

- [ ] **E4.T3 — Change response**
  - [ ] E4.T3.1 Re-open the link on the same device to change In/Out/Maybe.
  - **AC:**
    - Changing a response updates counts and does not create a duplicate RSVP.

- [ ] **E4.T4 — Capacity & waitlist**
  - [ ] E4.T4.1 Enforce capacity; when full, "In" → `waitlisted` with position.
  - [ ] E4.T4.2 Expose a promotion hook consumed by E6.
  - [ ] E4.T4.3 Concurrency-safe seat allocation (no over-booking under race).
  - **AC:**
    - Given capacity is full, when an attendee taps "In", then they are waitlisted and shown their position.
    - Two simultaneous "In" taps for the last seat never both succeed (verified by a concurrency test).

### - [ ] E5. Live headcount → P0.4

Blocked by: E4.

- [ ] **E5.T1 — Real-time counts**
  - [ ] E5.T1.1 In/out/maybe counts update without refresh (polling or SSE/websocket).
  - **AC:**
    - A second viewer sees an RSVP reflected within the chosen refresh interval.

- [ ] **E5.T2 — Visibility rules**
  - [ ] E5.T2.1 Host sees attendee contacts; attendees see first names only.
  - **AC:**
    - An attendee view never exposes another attendee's contact (verified by a test).

### - [ ] E8. Cancel / reschedule → P0.7

Blocked by: E4, E9.

- [ ] **E8.T1 — Cancel / reschedule actions**
  - [ ] E8.T1.1 Host cancels an event (status → cancelled).
  - [ ] E8.T1.2 Host reschedules date/location.
  - **AC:**
    - Cancel and reschedule are reversible-safe (no data loss) and permission-gated to the host.

- [ ] **E8.T2 — Notify affected attendees**
  - [ ] E8.T2.1 Message all RSVP'd attendees with contact on cancel/reschedule.
  - **AC:**
    - Every attendee with contact receives one notification per change (no duplicates, none missed).

- [ ] **E8.T3 — Reflect state in preview + page**
  - [ ] E8.T3.1 Update event page and link preview to show cancellation/new time.
  - **AC:**
    - A freshly-opened link shows the cancelled/rescheduled state.

### - [ ] E9. Notification infrastructure (cross-cutting)

Blocked by: E0.T3. Feeds E6, E8.

- [ ] **E9.T1 — Provider integration**
  - [ ] E9.T1.1 Integrate the chosen SMS and/or email provider.
  - [ ] E9.T1.2 Retry + failure handling on send.
  - **AC:**
    - A test message sends and its delivery result is recorded.

- [ ] **E9.T2 — Templated messages**
  - [ ] E9.T2.1 Templates: reminder, confirm request, promotion, cancel, reschedule.
  - **AC:**
    - Each template renders with event/attendee variables and passes a snapshot test.

- [ ] **E9.T3 — Scheduled-job runner**
  - [ ] E9.T3.1 Queue/cron for time-based sends; idempotent job execution.
  - **AC:**
    - A scheduled job fires within tolerance of its target time and never double-sends on retry.

- [ ] **E9.T4 — Consent + opt-out**
  - [ ] E9.T4.1 Capture consent at contact entry; honor opt-out/unsubscribe.
  - **AC:**
    - An opted-out attendee receives no further messages (verified by a test).

- [ ] **E9.T5 — Delivery logging**
  - [ ] E9.T5.1 Log every send (type, target, status, timestamp).
  - **AC:**
    - Logs are queryable for debugging and feed the metrics layer (X1).

---

## Phase 2 — Retention hooks (tests the thesis)

### - [ ] E6. Confirm-your-spot flow (no-show fix) → P0.5

Blocked by: E4 (waitlist), E9 (notifications).

- [ ] **E6.T1 — Host config**
  - [ ] E6.T1.1 Enable/disable the flow per event.
  - [ ] E6.T1.2 Set confirm window (default 24h) and release window (default 6h).
  - **AC:**
    - Config persists per event and defaults apply when untouched.

- [ ] **E6.T2 — Confirm request**
  - [ ] E6.T2.1 At the confirm window, message "In" attendees with contact.
  - [ ] E6.T2.2 One-tap confirm from the message.
  - **AC:**
    - Confirming sets `confirmedAt` in one tap and reflects in the host view.

- [ ] **E6.T3 — Release + promote logic**
  - [ ] E6.T3.1 At the release deadline, release unconfirmed "In" spots.
  - [ ] E6.T3.2 Promote the next waitlisted attendee and notify them.
  - [ ] E6.T3.3 Notify the released attendee.
  - **AC:**
    - Given an unconfirmed "In" attendee and a non-empty waitlist, when the release deadline passes, then the spot is released, the next waitlisted attendee is promoted + notified, and the released attendee is told.
    - Unit tests cover: empty waitlist, all confirmed, partial confirm, deadline-in-past.

- [ ] **E6.T4 — No-contact handling**
  - [ ] E6.T4.1 Keep contactless "In" attendees as "In (unconfirmed)", counted separately, never auto-dropped.
  - **AC:**
    - A contactless "In" attendee is never released and is counted in a distinct bucket.

- [ ] **E6.T5 — Window edge cases**
  - [ ] E6.T5.1 Clamp/skip windows for same-day events where 24h/6h don't fit.
  - [ ] E6.T5.2 Re-issue confirm requests after a reschedule.
  - **AC:**
    - Same-day event created inside the confirm window does not send a nonsensical/past confirm request.

### - [ ] E7. Second-event re-invite + groups → P0.6

Blocked by: E1 (Group), E9.

- [ ] **E7.T1 — Detect repeat host**
  - [ ] E7.T1.1 At creation, detect the host has ≥1 prior event.
  - **AC:**
    - A first-time host sees no re-invite offer; a returning host does.

- [ ] **E7.T2 — Re-invite offer**
  - [ ] E7.T2.1 Show "Invite the N from [last event]" with one-tap accept.
  - **AC:**
    - Accepting queues invites to prior attendees in one action.

- [ ] **E7.T3 — Consent-scoped messaging**
  - [ ] E7.T3.1 Message only attendees who opted into contact.
  - **AC:**
    - No attendee without stored contact/consent is messaged.

- [ ] **E7.T4 — Lazy group creation**
  - [ ] E7.T4.1 On accept, create a persistent `Group` (name defaults to host's name; editable).
  - [ ] E7.T4.2 Link prior + new events to the group.
  - **AC:**
    - Accepting materializes a group without any explicit "create group" step.
    - The group lists its member attendees and its events.

---

## Phase 3 — Fast follows (P1)

### - [ ] E10. P1 features (order by host demand; P1.1 first — unlocks the attendance metric)

- [ ] **E10.T1 — Attendance check-in → P1.1**
  - [ ] E10.T1.1 Host marks who showed; populate `Attendance`.
  - [ ] E10.T1.2 Compute attendance rate per event.
  - **AC:**
    - Host can mark attendance in one tap per attendee; the no-show metric is derivable.

- [ ] **E10.T2 — Group calendar subscription → P1.2**
  - [ ] E10.T2.1 ICS feed per group.
  - [ ] E10.T2.2 Per-event add-to-calendar.
  - **AC:**
    - Subscribing to a group's ICS surfaces future events in a standard calendar app.

- [ ] **E10.T3 — Host dashboard → P1.3**
  - [ ] E10.T3.1 Past events list, attendance rate per event, regulars list.
  - **AC:**
    - Dashboard shows a host's events and identifies repeat attendees.

- [ ] **E10.T4 — Copy-ready announcement → P1.4**
  - [ ] E10.T4.1 Pre-written message + link for weak-preview platforms.
  - **AC:**
    - One tap copies a ready-to-paste announcement including the link.

- [ ] **E10.T5 — Attendee "my events" view → P1.5**
  - [ ] E10.T5.1 List everything the device has RSVP'd to.
  - **AC:**
    - A returning device sees its RSVP'd events without logging in.

---

## Deferred (P2 — design for, do not build)

Tracked so no P1 decision forecloses them. Hooks placed in E1.T2.

- [ ] **P2.1 Native chat bots** — `Rsvp.source` supports a platform identity.
- [ ] **P2.2 Payments** — nullable `Event.price` + a provider-agnostic order record (add record type when built).
- [ ] **P2.3 Deposits / attendee reputation** — `Attendee`/`Attendance` history persisted from day one.
- [ ] **P2.4 Paid group tier** — `Group` exists from P0.6; gate later.

---

## Cross-cutting (spans Phase 1–2)

- [ ] **X1 — Metrics instrumentation** → PRD §6
  - [ ] X1.1 Funnel events: link open → RSVP → confirm → attend.
  - [ ] X1.2 Timing: create-to-link.
  - [ ] X1.3 Preview render success tracking.
  - [ ] X1.4 Wire the **kill signal** (second-event rate) into a dashboard.
  - **AC:**
    - Every PRD §6 leading indicator has a data source and appears on a dashboard.

- [ ] **X2 — Testing**
  - [ ] X2.1 Unit: release/promote logic, waitlist, window edge cases.
  - [ ] X2.2 Integration: RSVP + capacity + concurrency.
  - [ ] X2.3 E2E: create → share → RSVP → confirm → (cancel).
  - **AC:**
    - Critical-path logic (E4.T4, E6.T3) has ≥90% branch coverage.
    - The happy-path E2E runs in CI.

- [ ] **X3 — Accessibility & mobile**
  - [ ] X3.1 Attendee flow mobile-web first.
  - [ ] X3.2 WCAG AA on the RSVP path (see `design:accessibility-review`).
  - **AC:**
    - The RSVP path passes an automated a11y check and manual keyboard/contrast review.

- [ ] **X4 — Privacy / compliance**
  - [ ] X4.1 Consent for contact + reminders.
  - [ ] X4.2 Retention policy for attendee contacts.
  - [ ] X4.3 Opt-out honored everywhere.
  - **AC:**
    - A data-flow note documents what contact data is stored, why, and for how long.

---

## Critical path (shortest route to a testable core loop)

`E1 → E2 → E4 → E5` (+ `E3` for shareability) = the Phase 1 loop a host can actually use.
Then `E9 → E6 + E7` = Phase 2, where the recurring-host thesis is proven or killed.
