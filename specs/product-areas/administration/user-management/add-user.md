# Add user

## STORY

**IN ORDER TO** grant new employees access to the availability matrix
**AS** admin user
**I WANT TO** add users to the system

## ACCEPTANCE CRITERIA

1. An admin user can add a new user by providing an email address, a display name, and optionally a location.
2. The email address must be a valid, non-empty email and is stored in lowercase.
3. The display name must not be empty or consist only of whitespace.
4. Email addresses must be unique; adding a duplicate email is rejected with a clear error message.
5. An initial password must be set for the new user.
6. After successful creation, the new user appears in the list of users.
7. Non-admin users cannot add users.
8. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Creating a new user with email, display name, password, and optional location.
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

1. Admin adds a user with a valid email, display name, and password — user is created successfully.
2. Admin attempts to add a user with a duplicate email — operation is rejected with an error message.
3. Admin attempts to add a user with an empty or whitespace-only display name — operation is rejected with an error message.
4. Admin attempts to add a user with an invalid or empty email — operation is rejected with an error message.
5. Non-admin user attempts to add a user — operation is denied.
