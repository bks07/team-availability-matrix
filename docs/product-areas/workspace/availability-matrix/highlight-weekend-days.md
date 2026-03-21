# Highlight weekend days

## STORY

**IN ORDER TO** have a better orientation when using the availability matrix
**AS** team member
**I WANT TO** see the rows of weekend days in a highlighted form

## ACCEPTANCE CRITERIA

1. When weekend days (Saturday and Sunday) are part of the displayed matrix period, those days are clearly and consistently highlighted in the matrix.
2. All weekend days within the displayed period are highlighted, not just individual ones.
3. If the displayed matrix period contains no weekend days, no weekend highlighting is applied.
4. The highlighted state is visually distinct from regular weekdays and easy to notice in normal usage.
5. Weekend highlighting is visually distinguishable from the current-day highlight when both apply to the same row.
6. Existing matrix capabilities continue to work as before, including viewing and updating availability statuses where permitted.
7. The highlighted weekend days remain identifiable while navigating the matrix (for example during scrolling).

## IN-SCOPE

- User-facing matrix behavior to make weekend days easier to identify.
- Visual treatment of weekend day rows in the displayed matrix.
- Verification that this behavior works in common usage scenarios.

## OUT-OF-SCOPE

- Changes to authentication, permissions, or status business rules.
- New filtering, sorting, or period-selection behavior.
- Broad visual redesign beyond highlighting weekend days.
- Configurable definitions of "weekend" (e.g. locale-specific weekends).
- New user settings unrelated to this story.

## ADDITIONAL INFORMATION

### Assumptions

- "Weekend days" means Saturday and Sunday.
- Weekend highlighting coexists with the current-day highlight without conflict.

### Dependencies

- A matrix period/date range is already available and can include or exclude weekend days.

### Validation scenarios

1. Weekend days are inside the displayed period.
2. Displayed period contains no weekend days.
3. A weekend day coincides with the current day (both highlights apply).
4. User can still perform normal matrix interactions after the change.

