---
status: DONE
---

# Add user

## STORY

**IN ORDER TO** grant new employees access to the availability matrix
**AS** admin user
**I WANT TO** add users to the system via a modal window

## ACCEPTANCE CRITERIA

1. An admin user can add a new user by clicking a `Create User` button that opens a modal window.
2. The modal includes fields for email address, display name, password, and optional location.
3. The email address must be a valid, non-empty email and is stored in lowercase.
4. The display name must not be empty or consist only of whitespace.
5. Email addresses must be unique; adding a duplicate email is rejected with a clear error message.
6. An initial password must be set for the new user.
7. After successful creation, the new user appears in the list of users.
8. Non-admin users cannot add users.
9. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Creating a new user with email, display name, password, and optional location via a modal.
- Validation of required fields (email format, non-empty display name, password requirements).
- Uniqueness check on email address.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Editing or removing existing users.
- Managing user permissions.
- Self-registration by the user.
- Bulk import of users.
- Email verification or welcome email sending.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A user is uniquely identified by their email address.
- Locations, if assigned, already exist in the system.

### Dependencies

- Admin role and permission model are available.
- Location management is available for optional assignment.

### Validation scenarios

1. Admin clicks `Create User` and fills out valid details — user is created successfully.
2. Admin attempts to add a user with a duplicate email — operation is rejected with an error message.
3. Admin attempts to add a user with an empty or whitespace-only display name — operation is rejected with an error message.
4. Admin attempts to add a user with an invalid or empty email — operation is rejected with an error message.
5. Non-admin user attempts to add a user — operation is denied.
