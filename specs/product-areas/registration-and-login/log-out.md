---
status: DONE
---

# Log out

## STORY

**IN ORDER TO** end my session and prevent unauthorised access on a shared device
**AS** a logged-in employee
**I WANT TO** log out of the application

## ACCEPTANCE CRITERIA

1. A log-out action is accessible from the navigation bar while the user is logged in.
2. Triggering the log-out clears the session from client-side storage.
3. After log-out the user is redirected to the login page.
4. After log-out any subsequent API requests fail with an authentication error until the user logs in again.
5. The log-out action does not require confirmation.

## IN-SCOPE

- Log-out button or menu item in the navigation bar.
- Clearing the stored session (token and user data) from local storage.
- Redirecting to the login page.

## OUT-OF-SCOPE

- Server-side token revocation or blacklisting.
- Logging out all sessions across devices.
- Automatic session expiry warnings.
