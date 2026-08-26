# PRD: Chat-Native Meetup RSVP

**Status:** Draft v0.1
**Working name:** TBD
**Scope:** v1 — link-first, platform-agnostic

---

## 1. Problem Statement

Meetup hosts run their events out of a group chat — announcing, nagging for RSVPs, reposting the link, asking "who's actually coming tonight?" — but every RSVP tool makes them send people *away* from the chat to a page. The result is a split brain: the headcount lives on Luma or a Google Form, the conversation lives in WhatsApp/Telegram/Discord, and the host manually reconciles the two. Worse, free-event RSVPs are unreliable: 30–50% no-show rates are typical, so the number on the page is never the number in the room.

**Who:** People who organize free or low-cost in-person gatherings — hobby groups, tech meetups, run clubs, book clubs, dinners — both one-off ("I'm organizing a thing") and recurring (same group, monthly).

**Cost of not solving:** Hosts under-book or over-book venues, burn out on chasing people, and lose their attendee list between events because it never lived anywhere.

---

## 2. Goals

1. **Ten-second event creation.** A host can go from "I want to organize a thing" to a link pasted in their chat in under 10 seconds, with no attendee account required.
2. **The headcount is trustworthy.** Attendees who say "in" show up. Target: hosts using the confirm-before-event flow see ≥75% attendance against confirmed RSVPs.
3. **One-off hosts become recurring hosts without deciding to.** By their second event, a host is offered their previous attendees as a re-invite list. Target: ≥40% of hosts who create a second event use the re-invite.
4. **The link works wherever the chat is.** A pasted link unfurls into a rich, RSVP-able preview in WhatsApp, Telegram, iMessage, Discord, and Slack.

**Business goal:** Prove that recurring hosts return monthly (≥50% of hosts who run a second event run a third), which is the precondition for any paid tier.

---

## 3. Non-Goals

- **Native chat bots (WhatsApp/Telegram/Discord/Slack).** v1 is a link with a rich preview. Bots are the v2 bet once we know which platform hosts actually live in — building four integrations before that is guesswork.
- **Paid ticketing and payments.** Meetup hosts are overwhelmingly running free events. We do not yet know whether they will pay for anything; adding a payment rail before that is answered is premature. Designed for, not built (see P2).
- **Event discovery / public feed.** Hosts already have distribution (their chat). A feed is a different product with a different cold-start problem.
- **Church, community-org, and workshop personas.** Different jobs-to-be-done (registration + follow-up; getting paid). Parked as separate initiatives.
- **Rich event pages, themes, custom domains.** Competing on cosmetics against a free incumbent is a losing position. The page is a byproduct of the link, not the product.

---

## 4. User Stories

### One-off host
- As a one-off host, I want to create an event and get a link in seconds so that I can paste it into my group chat before the conversation moves on.
- As a one-off host, I want to see a live headcount (in / out / maybe) without opening an app so that I can answer "who's coming?" from the chat.
- As a one-off host, I want maybes to be nudged automatically before the event so that I don't have to chase people myself.
- As a one-off host, I want to set a capacity and have a waitlist fill automatically so that I don't over-book the venue.

### Recurring host
- As a recurring host, I want my previous attendees offered as a re-invite list when I create my next event so that I don't rebuild my audience every month.
- As a recurring host, I want to see who attended (not just who RSVP'd) across my events so that I know who my real regulars are.
- As a recurring host, I want my group to have a subscribable calendar so that regulars get future events without me posting each one.

### Attendee
- As an attendee, I want to RSVP with one tap and no account so that responding takes less effort than ignoring the message.
- As an attendee, I want to confirm or release my spot close to the event so that I'm not silently holding a seat I won't use.
- As an attendee, I want the event in my calendar with one tap so that I don't forget.

### Edge cases
- As a host, I want to cancel or reschedule and have every RSVP'd attendee notified so that nobody shows up to a cancelled event.
- As an attendee who was waitlisted, I want to be promoted automatically when a spot opens and told clearly so that I know whether I'm in.

---

## 5. Requirements

### P0 — Must-Have

**P0.1 Instant event creation**
Host enters title, date/time, location, optional capacity. Optional description. Account creation for hosts is deferred until *after* the first link is generated (magic link via email or phone).
- [ ] Event creatable in ≤3 fields with sensible defaults (date defaults to next Saturday 6pm local)
- [ ] Link generated before any host sign-up is required
- [ ] Host can claim/edit the event later via magic link

**P0.2 Rich link preview (Open Graph / oEmbed)**
The link unfurls in chat with title, date, location, and current headcount.
- [ ] Preview renders correctly in WhatsApp, Telegram, iMessage, Discord, Slack, Twitter/X
- [ ] Headcount in the preview refreshes (cache TTL ≤5 min)
- [ ] Preview image is generated server-side per event

**P0.3 One-tap accountless RSVP**
Attendee taps the link, sees the event, chooses In / Out / Maybe, enters a first name (and optionally a phone or email for reminders).
- [ ] RSVP completes in ≤2 taps from link open
- [ ] No password, no account; identity is device-cookie + optional contact
- [ ] Attendee can change their response from the same link
- [ ] Given capacity is set and full, when an attendee taps "In," then they are placed on the waitlist and told their position

**P0.4 Live headcount**
Host and attendees see the in/out/maybe counts and the "in" list (first names).
- [ ] Counts update without page refresh
- [ ] Host sees contact details; attendees see first names only

**P0.5 Confirm-your-spot flow (the no-show fix)**
At a host-set interval before the event (default 24h), "In" attendees who left a contact are asked to confirm. Unconfirmed spots are released to the waitlist at a second interval (default 6h).
- [ ] Host can enable/disable and set both intervals
- [ ] Confirmation is one tap from the reminder
- [ ] Given an "In" attendee has not confirmed by the release deadline and a waitlist exists, when the deadline passes, then their spot is released, the next waitlisted attendee is promoted and notified, and the original attendee is told
- [ ] Attendees with no contact on file are not silently dropped — they remain "In (unconfirmed)" and are counted separately

**P0.6 Second-event re-invite**
When a host who has run ≥1 event creates a new one, they are offered "Invite the N people from [last event]" — sending a message to attendees who left contact details.
- [ ] Offer appears at creation time, one tap to accept
- [ ] Only attendees who opted into contact are messaged
- [ ] Accepting this creates a persistent group for the host (name defaults to the host's name; editable)

**P0.7 Cancel / reschedule with notification**
- [ ] Host can cancel or change date/location; all RSVP'd attendees with contact are notified
- [ ] Link preview updates to reflect cancellation

### P1 — Nice-to-Have (fast follow)

**P1.1 Attendance check-in.** Host marks who actually showed. Feeds "real regulars" and the no-show metric.
**P1.2 Group calendar subscription.** ICS feed per group; "add to calendar" per event.
**P1.3 Host dashboard.** Past events, attendance rate per event, regulars list.
**P1.4 Copy-ready chat message.** Pre-written announcement text with the link, for platforms with weak previews.
**P1.5 Attendee "my events" view.** Everything a device has RSVP'd to.

### P2 — Future Considerations (design for, don't build)

**P2.1 Native chat bots.** Data model must support RSVPs originating from a platform identity (Telegram user ID, Discord ID) rather than a device cookie.
**P2.2 Payments.** Event model should carry a nullable price and a payment-provider-agnostic order record. Do not build the rail.
**P2.3 Deposits / attendee reputation.** Attendance history per contact must be preserved across events and groups from day one.
**P2.4 Paid tier for groups.** Group entity exists from P0.6; gate features on it later.

---

## 6. Success Metrics

**Leading (1–4 weeks post-launch)**
- Creation-to-link time: median ≤10s, p90 ≤30s
- RSVP conversion: ≥40% of unique link opens result in an RSVP
- Preview render success: ≥95% of shares on the five target platforms show a rich preview
- Confirm-flow adoption: ≥50% of events with capacity enable it

**Lagging (1–3 months)**
- Attendance vs confirmed RSVPs: ≥75% (measured via P1.1 check-in; proxy via host survey until then)
- Second-event rate: ≥30% of hosts create a second event within 60 days
- Re-invite acceptance: ≥40% of second-event hosts accept the re-invite
- Third-event rate: ≥50% of second-event hosts run a third

**Kill signal:** if the second-event rate is below 15% at 90 days, the one-off-to-recurring thesis is wrong and the product is a utility, not a business.

---

## 7. Open Questions

**Blocking**
- **[Stakeholder]** Will meetup hosts pay for anything? Ten host interviews before build: "What did you do the last time you needed to collect money for an event?" and "What would you be most upset to lose if your current tool vanished?"
- **[Engineering]** Which platforms render Open Graph previews reliably, and does WhatsApp cache previews aggressively enough to make a live headcount in the preview impractical? Determines whether P0.2's headcount claim survives.
- **[Design/Legal]** Accountless RSVP with a phone number for reminders — what is the minimum consent flow that's compliant across likely launch regions (GDPR/PECR-style rules on transactional SMS)?

**Non-blocking**
- **[Engineering]** Reminder channel for v1: SMS, email, or both? SMS has higher confirm rates but non-trivial cost per event.
- **[Design]** Should "Maybe" exist? It's what hosts hate most. Alternative: In / Out only, with "Out" being low-friction.
- **[Data]** How to attribute attendance when the host never checks anyone in (most won't)? Survey prompt post-event vs. accept the gap until P1.1.
- **[Product]** Naming and default for the confirm window — 24h/6h may be wrong for weekday-evening events created the same day.

---

## 8. Timeline & Phasing

**Phase 0 — Validate (2 weeks, before build).** Ten host interviews. Preview-rendering spike across the five platforms. Decide reminder channel.

**Phase 1 — Core loop (4–6 weeks).** P0.1–P0.4, P0.7. Ship to a handful of friendly hosts. Success = hosts paste the link without being asked to.

**Phase 2 — Retention hooks (3–4 weeks).** P0.5 confirm flow, P0.6 re-invite. This is the phase that tests the actual thesis.

**Phase 3 — Fast follows (ongoing).** P1 in order of host demand, P1.1 first because it unlocks the attendance metric.

**Dependencies:** SMS/email provider selection (Phase 0); OG image rendering service (Phase 1).

**Hard deadlines:** none. Do not add one until Phase 0 says the thesis is worth a deadline.
