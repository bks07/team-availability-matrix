# Configure employee working weekdays

## STORY

**IN ORDER TO** reflect which days of the week an employee actually works
**AS** admin user
**I WANT TO** select which weekdays each employee is scheduled to work

## ACCEPTANCE CRITERIA

1. An admin user can select one or more weekdays (Monday through Sunday) as working days for a given employee.
2. The default selection for a new employee is Monday to Friday.
3. The selection can be changed at any time by an admin user.
4. The configured weekdays are persisted and visible when revisiting the employee's schedule settings.
5. Non-admin users cannot change another employee's working weekdays.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Per-employee selection of working weekdays (Monday through Sunday).
- Default selection of Monday to Friday for new employees.
- Persisting and displaying the current selection.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Setting different weekdays for different weeks or periods within a year.
- Location-wide or system-wide weekday defaults.
- Configuring weekly hours (separate story).
- Configuring ignore-weekends or ignore-public-holidays options (separate stories).

## ADDITIONAL INFORMATION

### Assumptions

- Every employee has a working weekday configuration, even if it is the default (Monday to Friday).
- The weekday selection applies uniformly across the entire year.

### Dependencies

- User management is available.
- Admin role and permission model are available.

### Validation scenarios

1. Admin selects Monday, Wednesday, and Friday as working days for an employee — selection is saved and displayed correctly.
2. Admin opens the working weekday configuration for a new employee — Monday to Friday are pre-selected.
3. Admin deselects all weekdays — operation is rejected or a warning is shown, as at least one working day is expected.
4. Non-admin user attempts to change another employee's working weekdays — operation is denied.
