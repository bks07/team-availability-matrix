---
status: NEW
---

# Received Invites tab

## STORY

**IN ORDER TO** review and act on team invitations I have received
**AS** an authenticated employee
**I WANT TO** see a table of all pending invitations sent to me and accept or reject each one

## ACCEPTANCE CRITERIA

### Table layout

1. The Received Invites tab displays a table following the same visual pattern as the Administration // User Management table.
2. The table contains the following columns in order: **Team**, **Invited by**, **Date invited**, **Actions**.
3. **Team** column shows the name of the team the invitation is for.
4. **Invited by** column shows the display name of the user who sent the invitation.
5. **Date invited** column shows the date the invitation was created, formatted as a locale-aware short date.
6. **Actions** column shows two buttons: **Accept** (green/primary) and **Reject** (red/danger).

### Actions

7. Clicking **Accept** marks the invitation as accepted, adds the employee to the team as a regular member, and refreshes the table.
8. Clicking **Reject** marks the invitation as rejected and removes the row from the table.
9. While an action is processing, both buttons on that row are disabled and show a loading indicator.
10. After a successful action, a success message is displayed (e.g. "Invitation accepted" or "Invitation rejected").
11. If an action fails, an error message is displayed and no row change occurs.

### Toolbar

12. A toolbar card is displayed above the table, following the same visual style as the Administration // User Management toolbar.
13. The toolbar contains a single text search input and a clear/reset control.
14. The search input filters rows in real time (debounced, ~300 ms) across **Team** and **Invited by** columns (case-insensitive, substring match).
15. If no rows match, a "No invitations match your search" empty state is shown.
16. A clear button removes the search term and restores the full list.

### Pagination

17. Below the table, a pagination bar displays the current page, total pages, and a page-size dropdown with options: **10**, **25**, **50**.
18. The default page size is 25.
19. Changing the page size resets to page 1.
20. Navigation controls include: first page, previous page, next page, last page buttons.
21. Buttons for unavailable navigation (e.g. previous on page 1) are disabled.

### Empty state

22. If the employee has no pending received invitations, the tab panel shows a friendly empty state: "You have no pending invitations."

### Data source

23. The tab uses the existing `GET /api/teams/invitations` endpoint, which returns pending invitations for the authenticated user.
24. Filtering and pagination are performed client-side on the loaded data set.

## IN-SCOPE

- Received invitations table with accept/reject actions.
- Toolbar with search filtering.
- Client-side pagination with page-size dropdown.
- Empty state.
- Loading and error states.

## OUT-OF-SCOPE

- Server-side filtering or pagination (client-side only).
- Bulk accept/reject of multiple invitations.
- Sorting by column headers (invitations are shown newest-first from the API).
- Invitation expiry or auto-decline.

## ADDITIONAL INFORMATION

### Assumptions

- The existing `GET /api/teams/invitations` endpoint returns only pending invitations for the authenticated user with fields: `id`, `teamId`, `teamName`, `inviterName`, `status`, `createdAt`.
- The existing `POST /api/teams/invitations/:id/accept` and `POST /api/teams/invitations/:id/reject` endpoints remain unchanged.
- Data volume per user is small enough for client-side pagination.

### Dependencies

- my-teams-tabbed-layout (provides the tab container for this panel)
- invite-to-team (backend invitation model and endpoints)

### Validation scenarios

1. Employee has 3 pending invitations — all 3 rows appear with correct columns.
2. Employee accepts an invitation — success message shown, row removed, badge count decreases.
3. Employee rejects an invitation — success message shown, row removed.
4. Employee searches "backend" — only invitations where team name or inviter name contains "backend" are shown.
5. Employee clears search — full list restored.
6. Employee with no invitations sees empty state message.
7. Employee has 30 invitations with page size 10 — 3 pages shown, navigation works correctly.
