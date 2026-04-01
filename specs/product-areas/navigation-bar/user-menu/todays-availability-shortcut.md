---
status: DONE
---

# Today's availability shortcut

## STORY

**IN ORDER TO** quickly update my availability for today without opening the matrix or calendar
**AS** an authenticated employee
**I WANT TO** see and change my current day's status directly from the user menu

## ACCEPTANCE CRITERIA

1. The user-menu dropdown includes a "Today" section that shows the employee's status for the current date (W, V, A, or schedule-based default).
2. The section displays the current status as a coloured badge or pill matching the colours used in the matrix.
3. The employee can click the status to cycle through the available values (W → V → A → clear) or pick from a small inline button group.
4. Changing the status sends the update to the backend immediately using the same endpoint as the matrix (PUT or DELETE `/api/statuses/:date`).
5. On success the badge updates in place and no page navigation occurs.
6. On failure the employee sees a brief error message inside the dropdown and the badge reverts to the previous value.
7. The dropdown remains open after the status change so the employee can make further adjustments or close it manually.

## IN-SCOPE

- Displaying today's status in the user-menu dropdown.
- Inline status change (set W, V, A, or clear) without navigation.
- Immediate persistence via the existing status endpoints.

## OUT-OF-SCOPE

- Changing status for days other than today from the user menu.
- Bulk status changes from the user menu.
- Showing the statuses of other employees.

## ADDITIONAL INFORMATION

### Assumptions

- The current date is determined client-side.
- The employee's current status for today can be derived from the session or fetched with a lightweight API call.

### Dependencies

- User menu core feature is implemented.
- Single-day status update and clear endpoints are available.

### Validation scenarios

1. Employee opens the dropdown on a regular working day with no stored status — badge shows "W" (default).
2. Employee clicks the badge and selects "V" — badge changes to "V", change is persisted.
3. Employee selects "clear" — badge reverts to the schedule-based default.
4. Network error during update — error message shown, badge stays at its previous value.
