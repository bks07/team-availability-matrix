# Set status from calendar

## STORY

**IN ORDER TO** quickly update my availability for a specific day without leaving my personal calendar
**AS** an authenticated employee
**I WANT TO** set a day's status to W (Working), V (Vacation), or A (Absence) directly from the calendar view

## ACCEPTANCE CRITERIA

1. Each day cell in the calendar provides a way for the employee to choose a status (W, V, or A).
2. Setting a status replaces any previously stored value for that day.
3. The change is immediately reflected in the calendar view without a page reload.
4. The change persists across page refreshes and is reflected in the team availability matrix.
5. The employee receives clear visual feedback confirming the status was saved.
6. If the save fails, the employee receives an error message and the cell reverts to its previous state.

## IN-SCOPE

- Setting W, V, or A on a single day from the calendar view.
- Overwriting any previously stored status.
- Immediate visual feedback on success or failure.
- Consistency with the team availability matrix (same backend endpoint).

## OUT-OF-SCOPE

- Setting statuses for multiple days in a single action from the calendar.
- Setting statuses on behalf of another employee.
- Approval workflows.

## ADDITIONAL INFORMATION

### Assumptions

- The monthly calendar view is loaded and displaying the employee's current month.
- The same PUT /api/statuses/:date endpoint is used as in the availability matrix.

### Dependencies

- View my calendar feature is implemented.
- Single-day status update endpoint is available.

### Validation scenarios

1. Employee clicks on a day showing the schedule default and sets "V" — the cell updates to "V".
2. Employee changes a day from "V" to "A" — the cell updates to "A".
3. A network error occurs during save — an error message is shown and the cell keeps its original value.
4. Employee sets a status in the calendar, then opens the team matrix — the change is visible there too.
