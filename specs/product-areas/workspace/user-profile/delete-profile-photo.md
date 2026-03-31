# Delete profile photo

## STORY

**IN ORDER TO** revert to the default avatar when I no longer want a custom profile image
**AS** an authenticated user
**I WANT TO** delete my profile photo

## ACCEPTANCE CRITERIA

1. An authenticated user who has a profile photo can delete it.
2. After deletion, the application shows the default avatar (initials derived from first name and last name) wherever the photo was previously displayed.
3. The delete action requires explicit confirmation before proceeding (e.g. a confirmation dialog).
4. After successful deletion, the photo file is removed from storage and the user's `photoUrl` is cleared.
5. The deletion applies only to the authenticated user's own profile photo.
6. The user receives clear feedback on success or failure of the operation.
7. If the user has no profile photo, the delete option is not shown.

## IN-SCOPE

- Deleting the authenticated user's own profile photo.
- Confirmation prompt before deletion.
- Clearing the photo reference in the database.
- Removing the photo file from storage.
- Falling back to the initials-based default avatar.

## OUT-OF-SCOPE

- Uploading or editing a profile photo (covered by "Manage profile photo").
- Deleting another user's profile photo.
- Photo history or undo of deletion.

## ADDITIONAL INFORMATION

### Assumptions

- The backend already exposes a photo deletion endpoint.
- The default avatar (initials) is rendered client-side from the user's first and last name.

### Dependencies

- "Manage profile photo" story is implemented.
- "Display name derivation" story defines how initials are computed from structured name fields.

### Validation scenarios

1. Authenticated user with a profile photo clicks "Delete photo" and confirms — photo is removed and default avatar is shown.
2. Authenticated user cancels the confirmation dialog — photo remains unchanged.
3. User without a profile photo — delete option is not visible.
