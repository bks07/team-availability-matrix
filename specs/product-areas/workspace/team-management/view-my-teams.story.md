---
status: CHANGED
---

# View my teams

## STORY

**IN ORDER TO** quickly access, manage, and navigate the teams I belong to
**AS** an authenticated employee
**I WANT TO** see a table of all my teams with key details inside the My Teams tab

## ACCEPTANCE CRITERIA

### Tab context

1. This content is rendered inside the **My Teams** tab of the tabbed layout described in `my-teams-tabbed-layout.story.md`.

### Table layout

2. The employee sees their teams in a table following the same visual pattern as the Administration // User Management table.
3. The table contains the following columns in order: Favorite, Name, Description, Members, Owner, Created, Actions.
4. **Favorite** column displays a clickable star icon per row — a gray star when the team is not a favorite, a yellow (filled) star when it is a favorite.
5. **Name** column shows the team name. If the current user holds the **admin** role on that team, a coloured badge/tag reading "Admin" is displayed immediately after the team name.
6. **Description** column shows the team description, truncated with an ellipsis if the text exceeds the available space.
7. **Members** column shows the numeric count of team members.
8. **Owner** column shows the display name of the team owner. If the current user is the owner, the name is visually highlighted (e.g. bold or accent colour).
9. **Created** column shows the date the team was created, formatted as a locale-aware short date.
10. **Actions** column shows a set of icon buttons whose composition depends on the current user's role on that team (see Role-based actions below).

### Role-based actions

11. If the current user is the **owner** of a team, the Actions column shows:
    - **Configure** — navigates to the team detail/configuration page.
    - **Invite** — opens the invite-to-team modal (reuses the existing invite modal from the team detail page).
    - **Delete** — opens a confirmation modal; on confirm the team is deleted, on cancel no change occurs.
12. If the current user is a **team admin**, the Actions column shows:
    - **Configure** — navigates to the team detail/configuration page.
    - **Invite** — opens the invite-to-team modal.
    - **Leave** — opens a confirmation modal; on confirm the user leaves the team, on cancel no change occurs.
13. If the current user is a regular **member**, the Actions column shows:
    - **Leave** — opens a confirmation modal; on confirm the user leaves the team, on cancel no change occurs.
14. All action buttons are icon buttons with tooltips describing the action.

### Empty state

15. If the employee has no teams, a helpful empty state is shown with a prompt to create a team.

### Sorting

16. The table supports client-side sorting by clicking column headers for: Name, Members, Owner, and Created.
17. Clicking a column header toggles between ascending, descending, and default order.
18. The currently active sort column and direction are indicated visually (e.g. an arrow icon).

### Pagination

19. Below the table, a pagination bar displays the current page, total pages, and a page-size dropdown with options: **10**, **25**, **50**.
20. The default page size is 25.
21. Changing the page size resets to page 1.
22. Navigation controls include: first page, previous page, next page, last page buttons.
23. Buttons for unavailable navigation (e.g. previous on page 1) are disabled.
24. Pagination is applied after search filtering and sorting.

### General

25. The "Create Team" action remains accessible from a button in the page header.
26. The table updates immediately after any mutation (create, delete, leave, favourite toggle).

## IN-SCOPE

- Table inside the My Teams tab panel.
- All table columns described above.
- Role-based action buttons per row.
- Confirmation modals for destructive actions (delete, leave).
- Reuse of the existing invite-to-team modal.
- Column sorting.
- Client-side pagination with page-size dropdown.
- Empty state.

## OUT-OF-SCOPE

- Server-side sorting or pagination (client-side only).
- Bulk actions on multiple teams.
- Inline editing of team details from the table.
- Drag-and-drop reordering of teams.
- Pending invitations display (moved to the Received Invites tab — see `received-invites-tab.story.md`).

## ADDITIONAL INFORMATION

### Assumptions

- The backend `GET /teams` endpoint returns `ownerName`, `createdAt`, and `isFavorite` fields alongside existing fields.
- The favorite feature is specified separately in `favorite-team.story.md`.
- The search and filter toolbar is specified separately in `search-and-filter-teams.story.md`.

### Dependencies

- Existing specs: create-team, delete-team, invite-to-team, leave-team, team-owner-role, team-administrator-role.
- New specs: favorite-team, search-and-filter-teams, my-teams-tabbed-layout.

### Validation scenarios

1. Employee with three teams sees all three rows with correct columns and data.
2. Employee is owner of Team A — Actions show Configure, Invite, Delete.
3. Employee is admin of Team B — Actions show Configure, Invite, Leave; "Admin" tag appears after team name.
4. Employee is member of Team C — Actions show Leave only.
5. Employee clicks Delete on an owned team — confirmation modal appears; confirming deletes the team and removes the row.
6. Employee clicks Leave — confirmation modal appears; confirming removes the employee and the row disappears.
7. Employee has 30 teams with page size 10 — 3 pages shown, navigation works correctly.
8. Employee changes page size from 25 to 10 — resets to page 1, shows 10 rows per page.
