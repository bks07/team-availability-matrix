# Edit public holiday

## STORY

**IN ORDER TO** keep the public holidays of a given location accurate and up to date
**AS** admin user
**I WANT TO** edit an existing public holiday for a given location

## ACCEPTANCE CRITERIA

1. An admin user can edit the date, name, or location of an existing public holiday.
2. The updated date must be a valid calendar date.
3. The updated name must not be empty or consist only of whitespace.
4. Changing a public holiday to a date and location combination that already exists is rejected with a clear error message.
5. After a successful edit, the updated public holiday is reflected in the list of public holidays for the relevant location.
6. Non-admin users cannot edit public holidays.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Editing the date, name, or location of an existing public holiday.
- Validation of updated inputs (valid date, non-empty name, no duplicate for that location and date).
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or removing public holidays.
- Bulk editing of public holidays.
- Recurring public holidays that repeat automatically each year.
- Public holidays that span multiple days as a single entry.
- Location management (covered by its own stories).

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Public holidays already exist and can be selected for editing.
- A public holiday is uniquely identified by its date and location combination.

### Dependencies

- Admin role and permission model are available.
- Location management is available so that locations can be referenced.
- Public holidays exist and can be retrieved for editing.

### Validation scenarios

1. Admin edits a public holiday with a valid date, name, and location — public holiday is updated successfully.
2. Admin attempts to change a public holiday to a date and location that already exists — operation is rejected with an error message.
3. Admin attempts to set a public holiday name to empty or whitespace-only — operation is rejected with an error message.
4. Admin attempts to set a public holiday date to an invalid date — operation is rejected with an error message.
5. Non-admin user attempts to edit a public holiday — operation is denied.
