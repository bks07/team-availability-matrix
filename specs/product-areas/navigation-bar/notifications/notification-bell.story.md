---
status: NEW
---

# Notification bell

## STORY

**IN ORDER TO** immediately know when there are pending tasks requiring my attention
**AS** an authenticated employee
**I WANT TO** see a notification icon in the navigation bar that is visually highlighted when open tasks exist

## ACCEPTANCE CRITERIA

### Placement and appearance

1. A bell icon is displayed in the navigation bar header, positioned to the left of the user menu trigger (between the logo and the user avatar area).
2. The bell icon uses a simple, universally recognised bell glyph consistent with the existing navigation bar design language.
3. When the user has no pending tasks, the bell icon is displayed in a muted / default state without a badge.

### Badge

4. When the user has one or more pending tasks, a small circular badge is displayed overlapping the top-right corner of the bell icon.
5. The badge shows the total count of pending tasks. Counts above 9 are displayed as "9+".
6. The badge uses the application's primary accent colour with white text.
7. When a task is resolved (accepted or rejected) from the task list popover, the badge count decrements in real time without a full page refresh.
8. A brief count-down animation is applied to the badge number when it decrements.

### Highlight animation

9. When the badge count transitions from 0 to a positive number during the current session (e.g. after a background refresh detects new invitations), the bell icon plays a single, subtle pulse animation (scale / glow) lasting no more than 600 ms.
10. The animation does not repeat continuously; it fires once per zero-to-positive transition.

### Interaction

11. Clicking the bell icon opens the task list popover (see task-list-popover.story.md).
12. Clicking the bell icon while the popover is open closes the popover.
13. Clicking outside the popover closes it.

### Data fetching

14. The pending task count is fetched on initial page load after authentication.
15. The count is refreshed automatically every 60 seconds while the user is authenticated.
16. Opening the popover triggers an immediate refresh of the full task list and badge count.

### Keyboard accessibility

17. The bell icon is focusable via Tab in the normal tab order of the navigation bar.
18. Pressing Enter or Space while the bell is focused toggles the popover open / closed.
19. Pressing Escape while the popover is open closes it and returns focus to the bell icon.

### Responsive behaviour

20. On mobile viewports the bell icon remains visible in the navigation bar and is not collapsed into the burger menu.

## IN-SCOPE

- Bell icon placement in the navigation bar.
- Badge with pending task count (capped at "9+").
- Pulse animation on zero-to-positive transition.
- Count-down animation on badge decrement.
- Periodic background refresh of the pending task count.
- Keyboard accessibility for the bell trigger.
- Mobile-responsive positioning.

## OUT-OF-SCOPE

- The task list popover content and layout (see task-list-popover.story.md).
- Push notifications or WebSocket-based real-time updates.
- Sound or vibration notifications.
- Task type definitions beyond the current invitation source.

## ADDITIONAL INFORMATION

### Task count source

The badge count is derived from the number of pending team invitations for the authenticated user, using `GET /api/teams/invitations`. The component should accept the count as a prop or context value so that adding future task types (e.g. approval requests) only requires updating the count source, not the bell component itself.

### Dependencies

- Navigation bar is implemented and rendered for all authenticated routes.
- `GET /api/teams/invitations` endpoint exists and returns pending invitations.

### Design notes

- Consider a CSS custom property for the badge colour so it inherits from the design-token system documented in `docs/design-system/design-tokens.md`.
