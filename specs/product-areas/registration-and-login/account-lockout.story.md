---
status: NEW
---

# Account Lockout

## Story
- **IN ORDER TO** protect accounts from brute force attacks
- **AS** a system
- **I WANT TO** lock accounts after multiple failed login attempts

## Acceptance Criteria
- Accounts are locked after 5 consecutive failed login attempts.
- Users receive an email notification when their account is locked.
- Locked accounts can be unlocked via a password reset or admin intervention.

## In-Scope
- Lockout logic in the backend.
- Email notifications for locked accounts.

## Out-of-Scope
- Captcha implementation (covered in a separate story).

## Additional Information
- Lockout thresholds should be configurable by admins.