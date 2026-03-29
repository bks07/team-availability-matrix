# Clear day status

## STORY

**IN ORDER TO** revert a day back to its schedule-based default
**AS** an authenticated employee
**I WANT TO** remove any explicitly stored status from a specific day in the availability matrix

## ACCEPTANCE CRITERIA

1. An employee can clear the stored status on any day in her own column that currently holds an explicit value (W, V, or A).
2. After clearing, the day no longer holds a stored value and reverts to the computed default based on the employee's work schedule configuration.
3. The change is immediately visible in the availability matrix for all users.
4. An employee can only clear statuses in her own column.
5. The employee receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Removing a single day's explicitly stored status at a time.
- Reverting the cell to the schedule-based computed default after clearing.
- Restricting modification to the employee's own column.
- Immediate visual feedback after the status is cleared.

## OUT-OF-SCOPE

- Clearing statuses for a date range in a single action.
- Clearing statuses on behalf of another employee.
- Bulk clearing across multiple days.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the availability matrix.
- A cleared day displays whatever the employee's work schedule configuration dictates (a default "W" on a configured working weekday, or no value on a non-working day).
- Clearing a day that already has no stored status has no effect.

### Dependencies

- Authentication and session management are available.
- The availability matrix is accessible to authenticated users.
- Employee work schedule configuration is available (determines the computed default shown after clearing).

### Validation scenarios

1. Employee clears a day that had "V" — the cell reverts to the schedule-based default.
2. Employee clears a day that had "A" — the cell reverts to the schedule-based default.
3. Employee attempts to clear a day on another employee's column — the operation is denied.
4. Employee clears a day and refreshes the page — the day still shows the computed default, not the previously stored value.
