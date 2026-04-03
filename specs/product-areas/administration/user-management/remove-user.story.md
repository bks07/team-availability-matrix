---
status: DONE
---

# Remove user

## STORY

**IN ORDER TO** remove obsolete accounts and keep the user list maintainable
**AS** admin user
**I WANT TO** remove a user from the system

## ACCEPTANCE CRITERIA

1. An admin user can remove an existing user from the system.
2. The admin user is asked to confirm before a user is permanently removed.
3. Removing a user also removes their associated availability data.
4. After successful removal, the user no longer appears in the list of users or the availability matrix.
5. Non-admin users cannot remove users.
6. An admin user cannot remove their own account.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Removing an existing user from the system.
- Confirmation step before removal.
- Cascading deletion of the user's availability entries.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.
- Preventing self-deletion.

## OUT-OF-SCOPE

- Adding or editing users.
- Managing user permissions as part of removal.
- Bulk removal of users.
- Archiving, deactivating, or soft-deleting users.
- Reassigning the user's data to another user.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Removing a user is a permanent, irreversible action.
- An admin user should not be able to remove themselves to avoid accidental lockout.

### Dependencies

- Admin role and permission model are available.
- Users and their associated availability data exist.

### Validation scenarios

1. Admin removes a user — user and their availability data are removed successfully.
2. Admin is prompted for confirmation before removal proceeds.
3. Admin attempts to remove their own account — operation is rejected with an error message.
4. Non-admin user attempts to remove a user — operation is denied.
