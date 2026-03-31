# Configure ignore public holidays

## STORY

**IN ORDER TO** control whether public holidays are treated as non-working by default for a specific employee
**AS** admin user
**I WANT TO** enable or disable the option to ignore public holidays for each employee

## ACCEPTANCE CRITERIA

1. An admin user can toggle the "ignore public holidays" option for a given employee.
2. When enabled, days that are public holidays for the employee's location are never assigned a default "W" status in the availability matrix, even if they fall on a configured working weekday.
3. When disabled, public holidays are treated like any other day and may receive a default "W" status if they fall on a configured working weekday.
4. The option is enabled by default for new employees (public holidays are ignored).
5. The configured setting is persisted and visible when revisiting the employee's schedule settings.
6. Non-admin users cannot change another employee's ignore-public-holidays setting.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Per-employee toggle for ignoring public holidays.
- Default value of enabled (public holidays ignored) for new employees.
- Effect on which days receive a default "W" in the availability matrix.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Managing public holidays themselves (handled by public holiday management).
- Location-wide or system-wide ignore-public-holidays defaults.
- Changing the visual highlighting of public holiday rows in the matrix (handled separately).

## ADDITIONAL INFORMATION

### Assumptions

- Public holidays are already defined per location in the system.
- Each employee is assigned to a location, which determines their applicable public holidays.
- The ignore-public-holidays option works in combination with the employee's configured working weekdays.

### Dependencies

- Employee working weekday configuration is available.
- Public holiday management is available.
- Employee-to-location assignment is available.
- Availability matrix is available.
- Admin role and permission model are available.

### Validation scenarios

1. Admin enables "ignore public holidays" for an employee — a day that is a public holiday for the employee's location no longer receives a default "W" in the matrix.
2. Admin disables "ignore public holidays" for an employee — a public holiday that falls on a configured working weekday now receives a default "W" in the matrix.
3. Admin opens the setting for a new employee — "ignore public holidays" is enabled by default.
4. Non-admin user attempts to change the setting — operation is denied.
