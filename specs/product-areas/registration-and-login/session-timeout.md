---
status: DONE
---

# Session Timeout

## Story
- **IN ORDER TO** enhance account security
- **AS** a system
- **I WANT TO** automatically log out users after a period of inactivity

## Acceptance Criteria
- Users are logged out after 30 minutes of inactivity.
- A warning is displayed 5 minutes before the session expires.
- Users can extend their session by interacting with the system.

## In-Scope
- Session timeout logic in the frontend and backend.
- Warning dialog for session expiration.

## Out-of-Scope
- Persistent sessions (covered in a separate story).

## Additional Information
- Timeout duration should be configurable by admins.