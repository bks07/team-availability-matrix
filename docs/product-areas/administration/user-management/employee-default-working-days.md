# Employee default working days

## STORY

**IN ORDER TO** accurately reflect each employee's individual work schedule in the availability matrix
**AS** admin user
**I WANT TO** define per employee which weekdays she works, how many hours per week she works, and whether weekends and public holidays should be considered

## ACCEPTANCE CRITERIA

1. An admin user can configure the default working schedule for each employee.
2. The working schedule includes which weekdays the employee works, weekly working hours, and options for ignoring weekends and public holidays.
3. The default working schedule for every employee is Monday to Friday, with weekends and public holidays ignored.
4. The configured schedule determines which days receive a "W" (Working) status by default in the availability matrix when no explicit status has been set by the user or a manager.

## IN-SCOPE

- Per-employee configuration of default working weekdays.
- Per-employee configuration of weekly working hours.
- Per-employee option to ignore weekends.
- Per-employee option to ignore public holidays.
- Effect on the availability matrix default "W" values.

## OUT-OF-SCOPE

- Editing individual availability statuses (handled by the matrix interaction).
- Location-wide or system-wide schedule defaults.
- Overtime tracking or time-sheet functionality.
- Approval workflows for schedule changes.

## ADDITIONAL INFORMATION

### Assumptions

- The admin role exists and can be distinguished from regular users.
- The availability matrix already displays "W" as the default status for days without an explicit entry.

### Dependencies

- User management is available.
- Public holiday management is available (for the ignore-public-holidays option).
- Availability matrix is available.

### Related stories

- [Configure employee working weekdays](employee-default-working-days/configure-employee-working-weekdays.md)
- [Configure employee weekly hours](employee-default-working-days/configure-employee-weekly-hours.md)
- [Configure ignore weekends](employee-default-working-days/configure-ignore-weekends.md)
- [Configure ignore public holidays](employee-default-working-days/configure-ignore-public-holidays.md)
- [Apply default working days to matrix](employee-default-working-days/apply-default-working-days-to-matrix.md)