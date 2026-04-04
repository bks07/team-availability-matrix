---
status: NEW
---

# Calendar Virtual Value Computation Inconsistency

## CURRENT BEHAVIOR
The `MyCalendarPage.statusFor()` function computes virtual values (schedule-derived defaults for days without explicit entries) differently than `WorkspaceLayout.statusFor()`:

1. **Calendar always returns 'A' for public holidays** — regardless of the user's `ignorePublicHolidays` work-schedule flag. The matrix correctly checks this flag and only shows 'A' on public holidays when `ignorePublicHolidays` is `true`.

2. **Calendar does not check `ignoreWeekends`** — The matrix checks the `ignoreWeekends` flag: when `true` and the day is Saturday/Sunday, it returns 'A' even if the per-weekday flag says working. The calendar relies only on the per-weekday flags, missing this override.

## EXPECTED BEHAVIOR
The My Calendar view should compute virtual values using the exact same logic as the Availability Matrix:
1. Check per-weekday flags from the work schedule
2. If `ignoreWeekends` is true and it's a weekend day → return 'A' (even if the weekday flag says working)
3. If `ignorePublicHolidays` is true and the day is a public holiday for the user's location → return 'A'
4. Otherwise → return 'W'

## IMPACT
Users with non-default work schedule settings (e.g., `ignorePublicHolidays = false` to keep public holidays as working days, or custom weekend schedules with `ignoreWeekends`) see different virtual values in the calendar vs. the matrix.

## STEPS TO REPRODUCE
1. Create or find a user with a work schedule where `ignorePublicHolidays` is `false` (public holidays should show as 'W', not 'A').
2. Assign the user to a location that has public holidays.
3. Open the Availability Matrix — the user's column shows virtual 'W' on public holidays.
4. Open My Calendar — the same public holidays incorrectly show virtual 'A'.

Or:
1. Create or find a user with a work schedule where Saturday is flagged as a working day AND `ignoreWeekends` is `true`.
2. Open the Availability Matrix — Saturdays show virtual 'A' (because `ignoreWeekends` overrides).
3. Open My Calendar — Saturdays show virtual 'W' (because the calendar only checks the per-weekday flag).

## ADDITIONAL INFORMATION
TBD