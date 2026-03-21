# Remove public holiday

## STORY

**IN ORDER TO** keep the public holidays of a given location accurate and up to date
**AS** admin user
**I WANT TO** remove a public holiday from a given location

## ACCEPTANCE CRITERIA

1. An admin user can remove an existing public holiday from a location.
2. The admin user is asked to confirm before a public holiday is permanently removed.
3. After successful removal, the public holiday no longer appears in the list of public holidays for that location.
4. Non-admin users cannot remove public holidays.
5. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Removing an existing public holiday from a location.
- Confirmation step before removal.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or editing public holidays.
- Bulk removal of public holidays.
- Archiving or soft-deleting public holidays.
- Location management (covered by its own stories).

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Public holidays already exist and can be selected for removal.
- A public holiday is uniquely identified by its date and location combination.

### Dependencies

- Admin role and permission model are available.
- Location management is available so that locations can be referenced.
- Public holidays exist and can be retrieved for removal.

### Validation scenarios

1. Admin removes a public holiday — public holiday is removed successfully.
2. Admin is prompted for confirmation before removal proceeds.
3. Non-admin user attempts to remove a public holiday — operation is denied.
