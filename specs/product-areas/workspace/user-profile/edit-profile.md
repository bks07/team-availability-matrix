# Edit profile

## STORY

**IN ORDER TO** keep my personal account information accurate
**AS** authenticated user
**I WANT TO** edit my user profile information

## ACCEPTANCE CRITERIA

1. An authenticated user can view and edit their own profile information.
2. The user can update all profile fields that are user-managed, including display name, email address, and location.
3. The email address must be valid, non-empty, and stored in lowercase.
4. The display name must not be empty or consist only of whitespace.
5. If location is editable by the user, the user can only select from existing locations.
6. The updated email address must remain unique; changing it to an email address already used by another user is rejected with a clear error message.
7. Changes apply only to the authenticated user's own profile and cannot be used to edit another user's information.
8. After a successful update, the changed profile information is reflected wherever the user's profile details are shown.
9. The user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Viewing the current profile information of the authenticated user.
- Editing user-managed profile fields such as display name, email, and location.
- Validation of updated fields (email format, non-empty display name, unique email, valid location selection).
- Saving changes to the authenticated user's own profile.
- Feedback to the user on success or failure.

## OUT-OF-SCOPE

- Changing the user's password.
- Uploading or editing a profile photo.
- Editing administrative properties such as permissions or roles.
- Editing another user's profile.
- Bulk profile updates.

## ADDITIONAL INFORMATION

### Assumptions

- An authenticated user can access a dedicated user profile area.
- A user is uniquely identified by their email address.
- Locations, if user-editable, already exist in the system.
- Administrative permissions and roles are managed separately.

### Dependencies

- Authentication flow is available.
- User profile data can be retrieved and updated for the authenticated user.
- Location management is available if location is editable by the user.

### Validation scenarios

1. Authenticated user updates display name, email, and location with valid values — profile is updated successfully.
2. Authenticated user attempts to save an invalid or empty email address — operation is rejected with an error message.
3. Authenticated user attempts to save an empty or whitespace-only display name — operation is rejected with an error message.
4. Authenticated user attempts to change email address to one already used by another user — operation is rejected with an error message.
5. Authenticated user attempts to edit another user's profile information — operation is denied.