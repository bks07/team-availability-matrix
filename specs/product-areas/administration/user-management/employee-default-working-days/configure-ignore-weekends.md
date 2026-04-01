---
status: DONE
---

---
status: DONE
---
# Configure ignore weekends

## STORY

**IN ORDER TO** control whether weekend days are treated as non-working by default for a specific employee
**AS** admin user
**I WANT TO** enable or disable the option to ignore weekends for each employee

## ACCEPTANCE CRITERIA

1. An admin user can toggle the "ignore weekends" option for a given employee.
2. When enabled, Saturday and Sunday are never assigned a default "W" status in the availability matrix, regardless of the employee's configured working weekdays.
3. When disabled, Saturday and Sunday are treated like any other weekday and may receive a default "W" status if they are part of the employee's configured working weekdays.
4. The option is enabled by default for new employees (weekends are ignored).
5. The configured setting is persisted and visible when revisiting the employee's schedule settings.
6. Non-admin users cannot change another employee's ignore-weekends setting.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Per-employee toggle for ignoring weekends.
- Default value of enabled (weekends ignored) for new employees.
- Effect on which days receive a default "W" in the availability matrix.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Defining custom weekend days beyond Saturday and Sunday.
- Location-wide or system-wide ignore-weekends defaults.
- Changing the visual highlighting of weekend rows in the matrix (handled separately).

## ADDITIONAL INFORMATION

### Assumptions

- The availability matrix already visually highlights weekend days.
- The ignore-weekends option works in combination with the employee's configured working weekdays.

### Dependencies

- Employee working weekday configuration is available.
- Availability matrix is available.
- Admin role and permission model are available.

### Validation scenarios

1. Admin enables "ignore weekends" for an employee whose working weekdays include Saturday — Saturday no longer receives a default "W" in the matrix.
2. Admin disables "ignore weekends" for an employee whose working weekdays include Saturday — Saturday now receives a default "W" in the matrix.
3. Admin opens the setting for a new employee — "ignore weekends" is enabled by default.
4. Non-admin user attempts to change the setting — operation is denied.
