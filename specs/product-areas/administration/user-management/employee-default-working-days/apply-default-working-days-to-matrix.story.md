---
status: DONE
---

# Apply default working days to matrix

## STORY

**IN ORDER TO** see an accurate availability overview without requiring every working day to be explicitly marked
**AS** a team member or manager viewing the availability matrix
**I WANT TO** see a "W" (Working) status on each day that falls on an employee's configured working weekday, unless that day is excluded by the ignore-weekends or ignore-public-holidays options, or an explicit status has already been set

## ACCEPTANCE CRITERIA

1. For each employee, any day in the availability matrix that matches one of her configured working weekdays displays a default "W" status when no explicit status has been set.
2. If the "ignore weekends" option is enabled for the employee, Saturday and Sunday never receive a default "W", even if they are configured as working weekdays.
3. If the "ignore public holidays" option is enabled for the employee, days that are public holidays for the employee's location never receive a default "W", even if they are configured working weekdays.
4. An explicit status set by the user or a manager always takes precedence over the default "W".
5. When an employee's working schedule configuration changes, the matrix reflects the updated defaults immediately.
6. Days that do not match any configured working weekday (and are not covered by an explicit status) do not display "W" by default.

## IN-SCOPE

- Deriving the default "W" status from the employee's working weekday configuration.
- Respecting the ignore-weekends setting when determining defaults.
- Respecting the ignore-public-holidays setting when determining defaults.
- Explicit statuses always overriding the computed default.
- Immediately reflecting configuration changes in the matrix view.

## OUT-OF-SCOPE

- Modifying how explicit statuses (W, V, A) are set by users or managers.
- Changing the visual design of the availability matrix.
- Retroactively inserting or deleting stored status entries when the configuration changes.
- Generating reports or summaries based on default working days.

## ADDITIONAL INFORMATION

### Assumptions

- The availability matrix already treats absent entries as "W" today; this story refines that behaviour to respect the per-employee schedule.
- No stored record is created for a default "W" — it is derived at display time from the configuration.

### Dependencies

- Employee working weekday configuration is available.
- Ignore-weekends option is available.
- Ignore-public-holidays option is available.
- Public holiday data per location is available.
- Availability matrix is available.

### Validation scenarios

1. An employee is configured to work Monday to Friday with ignore-weekends and ignore-public-holidays enabled — only Monday to Friday (excluding public holidays) show a default "W".
2. An employee is configured to work Monday to Saturday with ignore-weekends disabled — Monday to Saturday show a default "W".
3. An employee is configured to work Monday to Friday with ignore-public-holidays disabled — a public holiday falling on a Wednesday still shows a default "W".
4. A user sets an explicit "V" on a Wednesday — the matrix shows "V" regardless of the working weekday configuration.
5. An admin changes an employee's working weekdays from Mon–Fri to Mon–Thu — Friday no longer shows a default "W" in the matrix.
