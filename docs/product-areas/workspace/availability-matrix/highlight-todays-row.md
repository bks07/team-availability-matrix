# Highlight the row of the current day

## STORY

**IN ORDER TO** have a better orientation when using the availability matrix
**AS** team member
**I WANT TO** see the row of the current day in a highlighted form

## ACCEPTANCE CRITERIA

1. When today's date is part of the displayed matrix period, that day is clearly and consistently highlighted in the matrix.
2. Only the current day is highlighted.
3. If today's date is not part of the displayed matrix period, no day is highlighted.
4. The highlighted state is visually distinct and easy to notice in normal usage.
5. Existing matrix capabilities continue to work as before, including viewing and updating availability statuses where permitted.
6. The highlighted day remains identifiable while navigating the matrix (for example during scrolling).

## IN-SCOPE

- User-facing matrix behavior to make the current day easier to identify.
- Visual treatment of the current day in the displayed matrix.
- Verification that this behavior works in common usage scenarios.

## OUT-OF-SCOPE

- Changes to authentication, permissions, or status business rules.
- New filtering, sorting, or period-selection behavior.
- Broad visual redesign beyond highlighting the current day.
- New user settings unrelated to this story.

## ADDITIONAL INFORMATION

### Assumptions

- "Current day" means the day the user is currently in when viewing the matrix.

### Dependencies

- A matrix period/date range is already available and can include or exclude the current day.

### Validation scenarios

1. Current day is inside the displayed period.
2. Current day is outside the displayed period.
3. User can still perform normal matrix interactions after the change.
