---
status: DONE
---

# Add public holiday

## STORY

**IN ORDER TO** maintain the public holidays in the system
**AS** admin user
**I WANT TO** add a public holiday by providing a date and a name

## ACCEPTANCE CRITERIA

1. An admin user can add a public holiday by providing a date and a name.
2. The date must be a valid calendar date.
3. The name must not be empty or consist only of whitespace.
4. A duplicate public holiday (same date and same name) is rejected with a clear error message.
5. After successful creation, the new public holiday appears in the list of all public holidays.
6. Non-admin users cannot add public holidays.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Creating a new public holiday with a date and name.
- Validation of inputs (valid date, non-empty name, no duplicate (date, name) combination).
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Editing or removing existing public holidays.
- Bulk import of public holidays.
- Recurring public holidays that repeat automatically each year.
- Public holidays that span multiple days as a single entry.
- Assigning or removing locations from a public holiday (covered by dedicated stories).
- Location management (covered by its own stories).

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A public holiday is uniquely identified by its date and name combination.

### Dependencies

- Admin role and permission model are available.

### Validation scenarios

1. Admin adds a public holiday with a valid date and name — public holiday is created successfully.
2. Admin attempts to add a public holiday with a date and name that already exists — operation is rejected with an error message.
3. Admin attempts to add a public holiday with an empty or whitespace-only name — operation is rejected with an error message.
4. Admin attempts to add a public holiday with an invalid date — operation is rejected with an error message.
5. Non-admin user attempts to add a public holiday — operation is denied.

