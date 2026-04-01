# Delete Permission Profile

## Story
- **IN ORDER TO** remove obsolete or incorrect profiles
- **AS** an administrator
- **I WANT TO** delete permission profiles from the system

## Acceptance Criteria
- Admins can delete a profile.
- A confirmation dialog is displayed before deletion.
- The system prevents deletion if the profile is assigned to any user.

## In-Scope
- Confirmation dialog for deletion.
- Backend checks for profile assignments.

## Out-of-Scope
- Reassigning users to other profiles (covered in separate stories).

## Additional Information
- Deleting a profile should not affect historical data.