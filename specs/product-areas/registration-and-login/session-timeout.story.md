---
status: DONE
---

# Session timeout

## STORY

**IN ORDER TO** protect my account from unauthorised access when I step away from my desk
**AS** an authenticated employee
**I WANT TO** have the application automatically end my session after a period of inactivity, with a warning before it happens

## ACCEPTANCE CRITERIA

1. The system tracks user activity by listening to mouse movements, keyboard inputs, scrolling, and touch events.
2. After 30 minutes of no detected activity, the session is considered expired.
3. A warning dialog is displayed 5 minutes before the session expires (i.e. after 25 minutes of inactivity).
4. The warning dialog clearly states that the session is about to expire and offers the user a way to stay logged in.
5. Any user interaction (mouse move, key press, scroll, touch) while the warning is showing resets the inactivity timer and dismisses the warning.
6. If no interaction occurs during the 5-minute warning period, the session token and user data are cleared from localStorage.
7. After the session is cleared, the user is redirected to the login page.
8. The inactivity timer starts fresh after each detected user activity event.
9. JWT tokens remain valid on the server for their full 7-day lifetime; the session timeout is a client-side safety measure only.

## IN-SCOPE

- Client-side inactivity detection via DOM event listeners.
- Configurable-in-code timeout duration (30 minutes) and warning period (5 minutes).
- Warning dialog before session expiry.
- Clearing session data from localStorage on timeout.
- Redirect to login page on timeout.

## OUT-OF-SCOPE

- Server-side session revocation or token blacklisting.
- User-configurable timeout duration.
- Admin-configurable timeout duration.
- Notifications outside the browser (email, push).
- "Remember me" or persistent session options.

## ADDITIONAL INFORMATION

### Assumptions

- The timeout durations (30 minutes idle, 5 minutes warning) are hardcoded constants.
- Activity detection covers all common input types: mouse, keyboard, scroll, and touch.
- The client-side timeout does not invalidate the JWT on the server; a user who manually re-attaches a non-expired token could still make API calls.

### Dependencies

- Authentication and session management are available.
- localStorage stores the session data under the `availability-matrix.session` key.

### Validation scenarios

1. User remains active for 30 minutes — no warning dialog is shown, session stays active.
2. User is inactive for 25 minutes, then moves the mouse — the inactivity timer resets, no warning is shown.
3. User is inactive for 25 minutes — a warning dialog appears informing them the session will expire in 5 minutes.
4. User interacts during the warning period — the warning dismisses, the timer resets.
5. User does not interact during the warning period — after 5 more minutes, the session is cleared and the user is redirected to the login page.
6. User logs in again after a timeout — authentication succeeds normally and a new session is established.