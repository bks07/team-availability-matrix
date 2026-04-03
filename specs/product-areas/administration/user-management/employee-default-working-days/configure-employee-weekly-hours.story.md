---
status: DONE
---

# Configure employee weekly hours

## STORY

**IN ORDER TO** record how many hours per week each employee is expected to work
**AS** admin user
**I WANT TO** set the weekly working hours for each employee

## ACCEPTANCE CRITERIA

1. An admin user can set the number of weekly working hours for a given employee.
2. The weekly hours value must be a positive number.
3. The configured value is persisted and visible when revisiting the employee's schedule settings.
4. The value can be changed at any time by an admin user.
5. Non-admin users cannot change another employee's weekly hours.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Per-employee configuration of weekly working hours.
- Validation that the value is a positive number.
- Persisting and displaying the current value.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Daily hour breakdowns or per-weekday hour distribution.
- Overtime tracking or enforcement.
- Historical tracking of weekly-hours changes over time.
- Calculating or displaying hourly rates or costs.

## ADDITIONAL INFORMATION

### Assumptions

- Weekly working hours apply uniformly across the year for each employee.
- The value is informational and does not directly alter the availability matrix cell values.

### Dependencies

- User management is available.
- Admin role and permission model are available.

### Validation scenarios

1. Admin sets 40 hours per week for an employee — value is saved and displayed correctly.
2. Admin sets 20 hours per week for a part-time employee — value is saved and displayed correctly.
3. Admin attempts to set a negative or zero value — operation is rejected with an error message.
4. Non-admin user attempts to change another employee's weekly hours — operation is denied.
