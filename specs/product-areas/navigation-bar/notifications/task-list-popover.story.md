---
status: NEW
---

# Task list popover

## STORY

**IN ORDER TO** review and act on pending tasks without leaving my current page
**AS** an authenticated employee
**I WANT TO** click the notification bell and see a list of all open tasks with inline actions

## ACCEPTANCE CRITERIA

### Popover layout

1. The task list popover appears anchored below the notification bell icon, right-aligned so that the popover's right edge aligns with the bell icon.
2. The popover has a header row showing the title "Notifications" and the total pending task count.
3. The popover body has a maximum height of approximately 400 px and scrolls vertically when tasks exceed the visible area.
4. The popover has a fixed width of approximately 360 px. On viewports narrower than 400 px, the popover expands to near-full width with small horizontal margins.
5. The popover has a subtle drop shadow and rounded corners consistent with the existing dropdown components (e.g. user menu dropdown).

### Task row — pending team invitation

6. Each pending team invitation returned by `GET /api/teams/invitations` is rendered as a task row.
7. The task row displays, from left to right: a mail / envelope icon, a description block, a relative time label, and an action button group.
8. The description block shows the team name on the first line and "Invited by {inviter name}" on the second line, both truncated with an ellipsis if they overflow.
9. The relative time label shows a human-readable elapsed time since the invitation was created (e.g. "2h ago", "3d ago", "just now"). The label updates only when the popover is opened, not in real time.
10. The action button group contains two icon buttons side by side: **Accept** (green checkmark) and **Reject** (red X).
11. Each action button has a tooltip: "Accept invitation" and "Reject invitation", respectively.
12. Each action button has an accessible label: "Accept invitation to {Team name}" and "Reject invitation to {Team name}".

### Inline actions

13. Clicking **Accept** sends `POST /api/teams/invitations/:id/accept`.
14. Clicking **Reject** sends `POST /api/teams/invitations/:id/reject`.
15. While the API call is in-flight, both action buttons on that row are disabled and replaced by a small loading spinner.
16. On success, the task row slides out of the list with a brief animation (approximately 200 ms), and the notification bell badge count decrements.
17. If the action fails, an inline error indicator appears on the row (e.g. a red outline and short "Failed — retry" text), and the row remains in the list.
18. Clicking anywhere on the task row outside the action buttons navigates the user to `/teams` with the Received Invitations tab active and closes the popover.

### Empty state

19. When there are no pending tasks, the popover body shows a centred, friendly empty state: a small illustration or muted icon and the text "All caught up — no pending tasks."

### Data fetching

20. Opening the popover fetches the full task list from `GET /api/teams/invitations` to ensure the displayed data is current.
21. Tasks are sorted by creation date, newest first.
22. If the fetch fails, the popover shows a non-blocking error message "Could not load notifications. Tap to retry." with the ability to retry.

### Keyboard accessibility

23. When the popover is open, focus is moved into the popover.
24. Arrow-Up and Arrow-Down move focus between task rows.
25. When a task row is focused, Tab moves focus between the row itself and its action buttons.
26. Enter or Space on a focused task row (not on an action button) triggers the navigation to `/teams`.
27. Enter or Space on a focused action button triggers that action.
28. Escape closes the popover and returns focus to the bell icon.

### Live region

29. When a task is resolved (accepted or rejected), a visually hidden ARIA live region announces the outcome (e.g. "Invitation to {Team name} accepted").

## IN-SCOPE

- Popover component anchored to the notification bell.
- Rendering pending team invitations as task rows.
- Inline accept and reject actions with optimistic row removal and animation.
- Navigation to the Teams page Received Invitations tab on row click.
- Empty state.
- Error and loading states.
- Keyboard navigation inside the popover.
- ARIA live region announcements for resolved tasks.
- Relative time display for task age.
- Slide-out animation on task removal.

## OUT-OF-SCOPE

- Task types other than pending team invitations. The component structure should be extensible, but only the invitation type is implemented in this story.
- Server-side notification storage or read / unread tracking.
- Bulk actions (e.g. accept all, reject all).
- Filtering or searching within the popover.
- Pagination within the popover — all pending invitations are shown in a scrollable list.

## ADDITIONAL INFORMATION

### Extensibility

Task rows are rendered from a unified list. Each task type provides its own row renderer (icon, description, action buttons). For this story only the "pending invitation" renderer is implemented, but the component design should make it straightforward to register additional renderers in the future.

### Dependencies

- notification-bell.story.md — the bell icon that triggers this popover.
- Existing `GET /api/teams/invitations` endpoint returns pending invitations with fields: `id`, `teamId`, `teamName`, `inviterName`, `status`, `createdAt`.
- Existing `POST /api/teams/invitations/:id/accept` endpoint.
- Existing `POST /api/teams/invitations/:id/reject` endpoint.
- Teams page with Received Invitations tab (received-invites-tab.story.md, status DONE).

### Creative UX additions

- Slide-out animation when a task is resolved, providing satisfying visual feedback.
- Relative time stamps ("2h ago", "yesterday") for a modern, glanceable feel.
- Smooth count-down animation on the bell badge when tasks are resolved.
- Friendly "all caught up" empty state to reinforce a sense of completion.
- Retry affordance on fetch failure instead of a blocking error dialog.
