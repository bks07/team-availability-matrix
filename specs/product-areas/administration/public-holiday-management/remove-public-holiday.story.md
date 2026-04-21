---
status: CHANGED
---

# Remove public holiday

## STORY

**IN ORDER TO** keep public holidays accurate and up to date
**AS** admin user
**I WANT TO** remove a public holiday entirely

## ACCEPTANCE CRITERIA

1. An admin user can remove an existing public holiday entirely, including all of its location associations.
2. The admin user is asked to confirm before a public holiday is permanently removed.
3. After successful removal, the public holiday no longer appears in the list of all public holidays.
4. Non-admin users cannot remove public holidays.
5. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Removing an existing public holiday entity, including all of its location associations.
- Confirmation step before removal.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or editing public holidays.
- Bulk removal of public holidays.
- Archiving or soft-deleting public holidays.
- Removing a single location from a public holiday without deleting the holiday entity (covered by a dedicated story).

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Public holidays already exist and can be selected for removal.
- A public holiday is uniquely identified by its date and name combination.

### Dependencies

- Admin role and permission model are available.
- Public holidays exist and can be retrieved for removal.

### Validation scenarios

1. Admin removes a public holiday — the public holiday is removed successfully.
2. Admin is prompted for confirmation before removal proceeds.
3. Non-admin user attempts to remove a public holiday — the operation is denied.
