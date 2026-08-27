# Discovery Findings — E0.T1 (Simulated Proxy)

> **Status: PROVISIONAL — simulated, not real field data.** This memo synthesizes a simulated
> discovery pass (`host-interviews-simulated.md`). It sharpens the thesis and gives a provisional
> go/no-go, but it does **not** close E0.T1. Ten real interviews remain the gate before committing
> engineering to a paid tier. It also does **not** touch E0.T2 (link-preview spike) or E0.T3
> (notification/consent) — those are technical spikes this exercise cannot answer.

**Date:** 2026-08-27 · **Question under test:** will a recurring meetup host value (and pay for) this?

---

## Headline

The money is **in the list**, secondarily in the **no-show fix**, and **payments is real but narrow**.
The recurring-host retention thesis survives contact. **Provisional GO.**

## Themes

**1. The list is the asset they'd pay to keep.**
Every recurring host answered "what would you hate to lose" with the _group / the list_, not a feature.
For higher-volume hosts (Priya, Marta) it was emphatic. This is exactly what the second-event
re-invite (P0.6 / E7) creates — the list is the retention product, not a bolt-on.

**2. Payments is a feature for a sub-segment, not the revenue engine.**
Only the capacity-capped / cost-recovery hosts (Deng, Sam) genuinely wanted money-collection, at low
volume. "Take a cut when money moves" is accepted as _fair_ but will not carry revenue. **Validates
keeping payments at P2.** Do not build a ticketing rail for v1 on the strength of one enthusiastic host.

**3. The no-show fix is universally wanted; the deposit is segment-specific.**
Everyone wants "a real number the day before." Confirm-or-release is welcome across the board. A
**deposit is only acceptable when capacity is scarce and attendees are strangers** (Deng); among
friends or in free open groups it suppresses turnout and reads as unfriendly (Marta, Sam, Priya).
→ **Refines E6:** confirm-or-release ON by default; deposits **opt-in, off by default**.

**4. Chat-native is a genuine moat — but not against tech hosts.**
WhatsApp-first hosts (Marta, Priya, Sam) would adopt _because_ it lives in the chat. The Luma-using
tech host (Tobi) is nearly immovable. → **Retarget the beachhead to WhatsApp-first, non-tech
recurring communities** (run clubs, community/faith groups, supper/hobby clubs), not dev meetups.

**5. Willingness to pay is modest, real, and clustered where the thesis predicts.**
Nobody pays for the event or cosmetics. 3/5 would pay a small monthly fee, clustered on the
**list + no-show bundle**. Their attachment to their lists and monthly reliability make a sub-15%
second-event rate (the PRD kill-signal) look unlikely to trip.

## Provisional recommendation — GO

- Ship the free core loop (E1→E2→E4→E5 + E3).
- Make the **persistent, messageable list** the eventual paid tier (bundle the no-show fix into its value story).
- Keep **payments at P2**, serving the cost-recovery sub-segment — not a revenue pillar.
- **Beachhead:** WhatsApp-first non-tech recurring communities.
- **E6 default:** confirm-or-release ON; deposits opt-in only.

## Residual risk NOT retired by this exercise

- **Real willingness-to-pay numbers.** Simulated hosts say "I'd pay something small" far more easily
  than real hosts open a wallet. This is the one number that still requires real mouths.
- **E0.T2 / E0.T3 remain open** — link-preview feasibility and notification/consent are untouched.

## What this closes

Demand-side reasoning for E0.T1 (provisional). Discovery is **not** fully closed until (a) real
interviews confirm willingness to pay and (b) the two technical spikes complete.
