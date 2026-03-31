# Clear status from calendar

## STORY

**IN ORDER TO** revert a day back to its schedule-based default without leaving my personal calendar
**AS** an authenticated employee
**I WANT TO** remove the explicitly stored status for a specific day directly from the calendar view

## ACCEPTANCE CRITERIA

1. Each day cell that holds an explicit status (W, V, or A) provides a way for the employee to clear it.
2. After clearing, the day reverts to the computed default based on the employee's work schedule configuration.
3. The change is immediately reflected in the calendar view without a page reload.
4. The change persists across page refreshes and is reflected in the team availability matrix.
5. The employee receives clear visual feedback confirming the status was cleared.
6. Clearing a day that already has no stored status has no effect and does not produce an error.

## IN-SCOPE

- Clearing a single day's stored status from the calendar view.
- Reverting the cell to the schedule-based computed default.
- Immediate visual feedback on success or failure.
- Consistency with the team availability matrix (same backend endpoint).

## OUT-OF-SCOPE

- Clearing statuses for multiple days at once from the calendar.
- Clearing statuses on behalf of another employee.

## ADDITIONAL INFORMATION

### Assumptions

- The monthly calendar view is loaded and displaying the employee's current month.
- The same DELETE /api/statuses/:date endpoint is used as in the availability matrix.
- A cleared day displays whatever the employee's work schedule dictates.

### Dependencies

- View my calendar feature is implemented.
- Single-day status clear endpoint is available.

### Validation scenarios

1. Employee clears a day that had "V" — the cell reverts to the schedule-based default.
2. Employee clears a day that had no stored status — nothing changes, no error shown.
3. Employee clears a status in the calendar, then opens the team matrix — the change is visible there too.
4. A network error occurs during clear — an error message is shown and the cell keeps its original value.
