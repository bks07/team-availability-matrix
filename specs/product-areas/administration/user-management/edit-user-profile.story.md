---
status: DONE
---

# Edit User Profile

## Story
- **IN ORDER TO** update user details
- **AS** an administrator
- **I WANT TO** edit user profiles via a modal window

## Acceptance Criteria
- Admins can open a modal window to edit user profiles by clicking an "Edit" button in the user management table.
- The modal includes fields for all user profile details (e.g., name, email, role, etc.).
- The system validates the input fields (e.g., unique email, valid role).
- A success message is displayed upon successful update.

## In-Scope
- Modal window for editing user profiles.
- Backend validation for input fields.

## Out-of-Scope
- Password reset (covered in a separate story).

## Additional Information
- This replaces the inline editing workflow currently used in the user management table.