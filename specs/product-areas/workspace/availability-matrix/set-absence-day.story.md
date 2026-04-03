---
status: DONE
---

# Set absence day

## STORY

**IN ORDER TO** inform my team that I will not be available due to a general absence
**AS** an authenticated employee
**I WANT TO** mark a specific day as "A" (Absence) in the availability matrix

## ACCEPTANCE CRITERIA

1. An employee can set the status "A" on any day that is a defined working day in her schedule.
2. Setting "A" replaces any previously stored status for that day.
3. The change is immediately visible in the availability matrix for all users.
4. An employee can only modify her own column in the matrix.
5. The employee receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Setting the "A" status on a single day at a time.
- Overwriting any previously stored status (W, V) with "A".
- Restricting modification to the employee's own column.
- Immediate visual feedback after the status change.

## OUT-OF-SCOPE

- Categorising or labelling the reason for the absence.
- Setting absence for a date range in a single action.
- Approval workflows for absences.
- Setting statuses on behalf of another employee.
- Bulk status updates across multiple days.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the availability matrix.
- "Absence" is a general-purpose status; no further breakdown (sick leave, personal leave, etc.) is required.
- Days without any explicitly stored status display the computed default based on the employee's work schedule.

### Dependencies

- Authentication and session management are available.
- The availability matrix is accessible to authenticated users.

### Validation scenarios

1. Employee clicks on a day in her own column and sets "A" — the cell updates to show "A" immediately.
2. Employee sets "A" on a day that previously had "W" — the cell changes from "W" to "A".
3. Employee attempts to set "A" on another employee's day — the operation is denied.
4. Employee sets "A" and refreshes the page — the "A" status persists.
