---
status: NEW
---

# Pending Invites tab

## STORY

**IN ORDER TO** track and manage invitations I have sent to other employees
**AS** a team owner or team administrator
**I WANT TO** see a table of all pending outbound invitations and cancel any that are no longer needed

## ACCEPTANCE CRITERIA

### Table layout

1. The Pending Invites tab displays a table following the same visual pattern as the Administration // User Management table.
2. The table contains the following columns in order: **User**, **Team**, **Date invited**, **Actions**.
3. **User** column shows the display name of the invited user.
4. **Team** column shows the name of the team for which the invitation was sent.
5. **Date invited** column shows the date the invitation was created, formatted as a locale-aware short date.
6. **Actions** column shows a **Delete** button (icon button with trash icon and tooltip "Cancel invitation").

### Actions

7. Clicking **Delete** opens a confirmation dialog: "Cancel invitation for {User} to {Team}?"
8. On confirm, the invitation is cancelled via the existing API and the row is removed from the table.
9. On cancel, no change occurs.
10. While the cancellation is processing, the Delete button is disabled and shows a loading indicator.
11. After a successful cancellation, a success message is displayed (e.g. "Invitation cancelled").
12. If the cancellation fails, an error message is displayed and no row change occurs.

### Toolbar

13. A toolbar card is displayed above the table, following the same visual style as the Administration // User Management toolbar.
14. The toolbar contains a single text search input and a clear/reset control.
15. The search input filters rows in real time (debounced, ~300 ms) across **User** and **Team** columns (case-insensitive, substring match).
16. If no rows match, a "No invitations match your search" empty state is shown.
17. A clear button removes the search term and restores the full list.

### Pagination

18. Below the table, a pagination bar displays the current page, total pages, and a page-size dropdown with options: **10**, **25**, **50**.
19. The default page size is 25.
20. Changing the page size resets to page 1.
21. Navigation controls include: first page, previous page, next page, last page buttons.
22. Buttons for unavailable navigation (e.g. previous on page 1) are disabled.

### Empty state

23. If the employee has no pending sent invitations, the tab panel shows a friendly empty state: "You have no pending outbound invitations."

### Data source — new backend endpoint

24. A new endpoint `GET /api/teams/invitations/sent` returns all pending invitations where the authenticated user is the inviter.
25. The response is an array of objects with fields: `id`, `teamId`, `teamName`, `inviteeName`, `inviteeEmail`, `createdAt`.
26. Results are ordered by `createdAt` descending (newest first).
27. The endpoint requires authentication but no special permission — any authenticated user can view their own sent invitations.
28. Filtering and pagination are performed client-side on the loaded data set.

### Frontend model

29. A new TypeScript interface `SentInvitation` is added to the API models: `{ id: number; teamId: number; teamName: string; inviteeName: string; inviteeEmail: string; createdAt: string }`.
30. A new service method `getSentInvitations(): Promise<SentInvitation[]>` is added to the team service.

## IN-SCOPE

- Pending sent invitations table with cancel action.
- Confirmation dialog before cancellation.
- Toolbar with search filtering.
- Client-side pagination with page-size dropdown.
- New backend endpoint `GET /api/teams/invitations/sent`.
- New frontend model and service method.
- Empty state.
- Loading and error states.

## OUT-OF-SCOPE

- Server-side filtering or pagination.
- Bulk cancellation of multiple invitations.
- Sorting by column headers.
- Re-sending or editing an existing invitation.

## ADDITIONAL INFORMATION

### Assumptions

- The `team_invitations` table already stores `inviter_id` — the new endpoint filters on this column with `status = 'pending'`.
- The existing `DELETE /api/teams/invitations/:id` (cancel) endpoint is reused for the Delete action.
- Data volume per user is small enough for client-side pagination.

### Dependencies

- my-teams-tabbed-layout (provides the tab container for this panel)
- invite-to-team (backend invitation model, cancel endpoint)

### Validation scenarios

1. Employee who sent 3 pending invitations sees all 3 rows with correct columns.
2. Employee clicks Delete on a row — confirmation dialog appears; confirming cancels the invitation and removes the row.
3. Employee cancels the confirmation dialog — no change.
4. Employee searches "alice" — only rows where User or Team contains "alice" are shown.
5. Employee with no sent invitations sees empty state message.
6. Employee has 60 pending invitations with page size 25 — 3 pages shown with correct navigation.
7. Non-owner/non-admin employee who has never invited anyone sees an empty table.
