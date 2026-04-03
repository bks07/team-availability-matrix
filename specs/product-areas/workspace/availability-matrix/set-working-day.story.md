---
status: DONE
---

# Set working day

## STORY

**IN ORDER TO** explicitly confirm that I will be working on a specific day
**AS** an authenticated employee
**I WANT TO** mark a specific day as "W" (Working) in the availability matrix

## ACCEPTANCE CRITERIA

1. An employee can set the status "W" on any day that is a defined working day in her schedule.
2. Setting "W" replaces any previously stored status for that day.
3. The change is immediately visible in the availability matrix for all users.
4. An employee can only modify her own column in the matrix.
5. The employee receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Setting the "W" status on a single day at a time.
- Overwriting any previously stored status (V, A) with "W".
- Restricting modification to the employee's own column.
- Immediate visual feedback after the status change.

## OUT-OF-SCOPE

- Setting working status for a date range in a single action.
- Setting statuses on behalf of another employee.
- Bulk status updates across multiple days.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the availability matrix.
- Days without any explicitly stored status already display a computed default based on the employee's work schedule; setting "W" explicitly stores the value and overrides future schedule changes for that day.

### Dependencies

- Authentication and session management are available.
- The availability matrix is accessible to authenticated users.

### Validation scenarios

1. Employee clicks on a day in her own column and sets "W" — the cell updates to show "W" immediately.
2. Employee sets "W" on a day that previously had "V" — the cell changes from "V" to "W".
3. Employee attempts to set "W" on another employee's day — the operation is denied.
4. Employee sets "W" and refreshes the page — the "W" status persists.
