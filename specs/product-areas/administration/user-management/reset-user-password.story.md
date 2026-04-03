---
status: DONE
---

# Reset User Password

## Story
- **IN ORDER TO** securely reset user passwords
- **AS** an administrator
- **I WANT TO** reset user passwords via a dedicated modal window

## Acceptance Criteria
- Admins can open a "Change Password" modal by clicking a key symbol button in the user management table.
- The modal includes:
  - Title: "Change Password"
  - User's name and email address displayed below the title.
  - A password input field for entering the new password.
  - A confirmation button to apply the change.
- The system validates the new password (e.g., minimum length, complexity).
- A success message is displayed upon successful password reset.

## In-Scope
- Modal window for resetting user passwords.
- Backend validation for password input.

## Out-of-Scope
- Editing other user profile details (covered in a separate story).

## Additional Information
- This ensures administrators can verify user details before applying sensitive changes like password resets.