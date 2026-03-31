# Bulk change of day values

## STORY

**IN ORDER TO** efficiently update my availability for a range of days without repeating the same action for each day individually
**AS** an authenticated employee
**I WANT TO** select multiple days in the availability matrix and apply a single status (W, V, A) or clear them all at once

## ACCEPTANCE CRITERIA

1. An employee can select a contiguous date range within her own column in the availability matrix.
2. The employee can apply a single status value (W, V, or A) to every selected day in one action.
3. The employee can clear the stored status from every selected day in one action, reverting them to their schedule-based defaults.
4. All changes are immediately visible in the availability matrix for all users.
5. An employee can only bulk-modify days in her own column.
6. The employee receives clear feedback indicating how many days were updated or cleared.
7. If the operation fails, none of the selected days are modified (all-or-nothing).
8. The employee can choose to skip weekend days (Saturday and Sunday) so they are excluded from the bulk operation.
9. The employee can choose to skip public holidays for her assigned location so they are excluded from the bulk operation.

## IN-SCOPE

- Selecting a contiguous date range for bulk update.
- Applying W, V, or A to the entire selection.
- Clearing the entire selection (removing stored statuses).
- Option to skip weekend days (Saturday and Sunday) within the selected range.
- Option to skip public holidays for the employee's assigned location within the selected range.
- Restricting bulk modification to the employee's own column.
- Immediate visual feedback after the bulk operation.
- Feedback indicating the number of days affected.

## OUT-OF-SCOPE

- Selecting non-contiguous (scattered) days in a single operation.
- Bulk-modifying days on behalf of another employee.
- Different statuses for different days within the same bulk operation.
- Undo/redo functionality for bulk changes.
- Recurring or repeating patterns (e.g., every Monday for a month).

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the availability matrix.
- Single-day status setting and clearing are already available and working.
- The date range selection is intuitive (e.g., click the start day, then shift-click the end day, or use a start/end date picker).
- Days outside the employee's own column cannot be included in a selection.
- Skipping weekends and public holidays are opt-in options; by default all days in the range are included.
- Public holidays are determined by the employee's assigned location.

### Dependencies

- Authentication and session management are available.
- The availability matrix is accessible to authenticated users.
- Single-day status update and clear functionality are implemented.
- Employee work schedule configuration is available (determines the computed default shown after clearing).

### Validation scenarios

1. Employee selects a five-day range and applies "V" — all five cells update to "V" immediately.
2. Employee selects a range that includes days with mixed statuses (W, V, A) and applies "A" — all cells in the range change to "A".
3. Employee selects a range and clears — all cells revert to their schedule-based defaults.
4. Employee attempts to select days in another employee's column — the selection is denied.
5. Employee performs a bulk update and refreshes the page — all changes persist.
6. A network error occurs mid-operation — no days are changed (all-or-nothing).
7. Employee selects a two-week range with "skip weekends" enabled and applies "V" — only weekday cells are updated; Saturday and Sunday cells remain unchanged.
8. Employee selects a range containing a public holiday with "skip public holidays" enabled and applies "A" — the public holiday cell is not modified.
9. Employee enables both "skip weekends" and "skip public holidays" — both weekend days and public holidays are excluded from the operation.
