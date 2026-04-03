---
status: NEW
---

# Forgot Password

## Story
- **IN ORDER TO** regain access to my account
- **AS** a user
- **I WANT TO** reset my password if I forget it

## Acceptance Criteria
- Users can request a password reset via email.
- The system sends a reset link to the registered email.
- Users can set a new password using the reset link.

## In-Scope
- Password reset request form.
- Backend logic for generating and validating reset tokens.

## Out-of-Scope
- Multi-factor authentication (covered in a separate story).

## Additional Information
- Reset links should expire after a configurable time.