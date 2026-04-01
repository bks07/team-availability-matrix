---
status: DONE
---

# Enrich calendar with week numbers and status provenance

## STORY

**IN ORDER TO** quickly identify which calendar week I am looking at and understand whether a day's status was explicitly set or derived from my schedule
**AS** an authenticated employee
**I WANT TO** see ISO week numbers on each row and a visual distinction between explicitly stored and schedule-default statuses

## ACCEPTANCE CRITERIA

1. Each week row in the monthly calendar displays the ISO calendar week number on its left side.
2. Days with an explicitly stored status (W, V, or A) are visually distinguishable from days showing the schedule-based default.
3. The distinction is subtle enough to avoid clutter but clear enough to notice at a glance (e.g. a different font weight, a small indicator, or a background variation).
4. Adjacent-month filler days also show the correct week number for their row.

## IN-SCOPE

- ISO calendar week numbers alongside each week row.
- Visual distinction between explicitly set statuses and schedule-derived defaults.

## OUT-OF-SCOPE

- Changes to the calendar grid layout or navigation (covered by "View my calendar").
- Changes to status editing behavior (covered by "Set status from calendar" and "Clear status from calendar").
- Tooltip or popover explaining the distinction — the visual cue alone is sufficient.

## ADDITIONAL INFORMATION

### Assumptions

- The monthly calendar view is already implemented.
- The matrix API response already distinguishes between explicit entries and absent entries (cells absent from the entries map are schedule defaults).

### Dependencies

- "View my calendar" story is implemented.

### Validation scenarios

1. A month is displayed — every week row shows the correct ISO week number on the left.
2. An employee has explicitly set "V" on a Tuesday and has a schedule default of "W" on Wednesday — the Tuesday cell looks visually different from the Wednesday cell.
3. The employee clears the Tuesday status — the cell reverts to the schedule default and now looks the same as Wednesday.
4. A row that begins with filler days from the previous month shows the ISO week number for those dates.
