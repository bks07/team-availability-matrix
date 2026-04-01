---
status: DONE
---

# Set vacation day

## STORY

**IN ORDER TO** inform my team that I will not be available due to vacation
**AS** an authenticated employee
**I WANT TO** mark a specific day as "V" (Vacation) in the availability matrix

## ACCEPTANCE CRITERIA

1. An employee can set the status "V" on any day that is a defined working day in her schedule.
2. Setting "V" replaces any previously stored status for that day.
3. The change is immediately visible in the availability matrix for all users.
4. An employee can only modify her own column in the matrix.
5. The employee receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Setting the "V" status on a single day at a time.
- Overwriting any previously stored status (W, A) with "V".
- Restricting modification to the employee's own column.
- Immediate visual feedback after the status change.

## OUT-OF-SCOPE

- Setting vacation for a date range in a single action.
- Approval workflows for vacation requests.
- Vacation balance or allowance tracking.
- Setting statuses on behalf of another employee.
- Bulk status updates across multiple days.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the availability matrix.
- The availability matrix displays the current year's days and all employees.
- Days without any explicitly stored status display the computed default based on the employee's work schedule.

### Dependencies

- Authentication and session management are available.
- The availability matrix is accessible to authenticated users.

### Validation scenarios

1. Employee clicks on a day in her own column and sets "V" — the cell updates to show "V" immediately.
2. Employee sets "V" on a day that previously had "A" — the cell changes from "A" to "V".
3. Employee attempts to set "V" on another employee's day — the operation is denied.
4. Employee sets "V" and refreshes the page — the "V" status persists.