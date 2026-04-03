---
status: DONE
---

---
status: DONE
---
# Edit user

## STORY

**IN ORDER TO** keep user information up to date
**AS** admin user
**I WANT TO** edit an existing user

## ACCEPTANCE CRITERIA

1. An admin user can edit the display name, email, and location of an existing user.
2. The updated email must be valid and non-empty, and is stored in lowercase.
3. The updated display name must not be empty or consist only of whitespace.
4. The updated email must remain unique; changing it to an email that already exists is rejected with a clear error message.
5. The admin user can optionally reset the user's password.
6. After a successful edit, the updated information is reflected everywhere the user appears.
7. Non-admin users cannot edit other users.
8. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Editing the display name, email, and location of an existing user.
- Optional password reset.
- Validation of updated fields (email format, non-empty display name, unique email).
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or removing users.
- Managing user permissions.
- Users editing their own profile (handled separately).
- Bulk editing of users.
- Changing the user's availability data.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A user is uniquely identified by their email address.
- Locations, if assigned, already exist in the system.

### Dependencies

- Admin role and permission model are available.
- Users already exist and can be selected for editing.
- Location management is available for optional assignment.

### Validation scenarios

1. Admin edits a user with a valid, unique new email and non-empty display name — user is updated successfully.
2. Admin attempts to change a user's email to one that already exists — operation is rejected with an error message.
3. Admin attempts to set a display name to empty or whitespace-only — operation is rejected with an error message.
4. Admin attempts to set an invalid or empty email — operation is rejected with an error message.
5. Non-admin user attempts to edit another user — operation is denied.
