# Frontend Accessibility Rules

**Scope:** Accessibility of `apps/web`, especially the RSVP path. **Consult when** building any UI, form, or interactive control.
**Authority:** [TASKS X3](../../../docs/TASKS.md). Target: **WCAG 2.1 AA**. Related skill: `design:accessibility-review`.

## Baseline

- The RSVP path MUST meet **WCAG 2.1 AA** and pass both an automated a11y check (in CI/test) and a manual keyboard + contrast review (X3 AC).
- Build with **semantic HTML** first (`button`, `nav`, `main`, `label`, `fieldset`/`legend`). Reach for ARIA only to fill gaps, never to paper over non-semantic markup.

## Touch & mobile (chat webviews)

- Interactive targets ≥ **44×44px** with adequate spacing — the primary user is one-thumbing inside a chat browser.
- Layout is responsive/mobile-first; content reflows without horizontal scroll; respects `prefers-reduced-motion`.

## Forms (RSVP: name, contact, In/Out/Maybe)

- Every control has a programmatic **label**; group the In/Out/Maybe choice as a labelled radio group.
- Errors are associated with their field (`aria-describedby`), announced, and phrased in plain language — not color-only.
- Consent copy for contact capture is readable and associated with its input.

## Dynamic content

- Announce **live headcount** changes with a polite `aria-live` region — but keep it calm (don't spam the screen reader on every poll; announce meaningful deltas).
- Manage focus on route/state changes (e.g. after RSVP, move focus to the confirmation). Modals/dialogs trap focus and restore it on close.

## Visuals

- Meet AA contrast (4.5:1 text / 3:1 large text & UI). Never convey state by color alone (In vs waitlisted needs text/icon too). Provide a visible focus indicator; never remove focus outlines without a replacement.
