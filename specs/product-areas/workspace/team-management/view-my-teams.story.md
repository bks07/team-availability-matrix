---
status: CHANGED
---

# View my teams

## STORY

**IN ORDER TO** quickly access, manage, and navigate the teams I belong to
**AS** an authenticated employee
**I WANT TO** see a table of all my teams with key details, along with pending invitations

## ACCEPTANCE CRITERIA

### Table layout

1. The employee sees their teams in a table following the same visual pattern as the Administration // User Management table.
2. The table contains the following columns in order: Favorite, Name, Description, Members, Owner, Created, Actions.
3. **Favorite** column displays a clickable star icon per row — a gray star when the team is not a favorite, a yellow (filled) star when it is a favorite.
4. **Name** column shows the team name. If the current user holds the **admin** role on that team, a coloured badge/tag reading "Admin" is displayed immediately after the team name.
5. **Description** column shows the team description, truncated with an ellipsis if the text exceeds the available space.
6. **Members** column shows the numeric count of team members.
7. **Owner** column shows the display name of the team owner. If the current user is the owner, the name is visually highlighted (e.g. bold or accent colour).
8. **Created** column shows the date the team was created, formatted as a locale-aware short date.
9. **Actions** column shows a set of icon buttons whose composition depends on the current user's role on that team (see Role-based actions below).

### Role-based actions

10. If the current user is the **owner** of a team, the Actions column shows:
    - **Configure** — navigates to the team detail/configuration page.
    - **Invite** — opens the invite-to-team modal (reuses the existing invite modal from the team detail page).
    - **Delete** — opens a confirmation modal; on confirm the team is deleted, on cancel no change occurs.
11. If the current user is a **team admin**, the Actions column shows:
    - **Configure** — navigates to the team detail/configuration page.
    - **Invite** — opens the invite-to-team modal.
    - **Leave** — opens a confirmation modal; on confirm the user leaves the team, on cancel no change occurs.
12. If the current user is a regular **member**, the Actions column shows:
    - **Leave** — opens a confirmation modal; on confirm the user leaves the team, on cancel no change occurs.
13. All action buttons are icon buttons with tooltips describing the action.

### Pending invitations

14. Above or below the table, the employee sees a separate section for pending invitations (unchanged from the current behaviour).
15. Each pending invitation shows the team name, who sent the invitation, and the invitation date.
16. The employee can accept or reject each pending invitation; the table data refreshes afterward.

### Empty state

17. If the employee has no teams and no pending invitations, a helpful empty state is shown with a prompt to create a team.

### Sorting

18. The table supports client-side sorting by clicking column headers for: Name, Members, Owner, and Created.
19. Clicking a column header toggles between ascending, descending, and default order.
20. The currently active sort column and direction are indicated visually (e.g. an arrow icon).

### General

21. The "Create Team" action remains accessible from a button in the page header.
22. The table updates immediately after any mutation (create, delete, leave, favourite toggle, invitation response).

## IN-SCOPE

- Replacing the card-based team list with a table.
- All table columns described above.
- Role-based action buttons per row.
- Confirmation modals for destructive actions (delete, leave).
- Reuse of the existing invite-to-team modal.
- Column sorting.
- Pending invitations section.
- Empty state.

## OUT-OF-SCOPE

- Server-side sorting or pagination (client-side only for now).
- Bulk actions on multiple teams.
- Inline editing of team details from the table.
- Drag-and-drop reordering of teams.

## ADDITIONAL INFORMATION

### Assumptions

- The backend `GET /teams` endpoint will be extended to return `ownerName`, `createdAt`, and `isFavorite` fields alongside existing fields.
- The favorite feature is specified separately in `favorite-team.story.md`.
- The search and filter toolbar is specified separately in `search-and-filter-teams.story.md`.

### Dependencies

- Existing specs: create-team, delete-team, invite-to-team, leave-team, team-owner-role, team-administrator-role.
- New specs: favorite-team, search-and-filter-teams.

### Validation scenarios

1. Employee with three teams sees all three rows with correct columns and data.
2. Employee is owner of Team A — Actions show Configure, Invite, Delete.
3. Employee is admin of Team B — Actions show Configure, Invite, Leave; "Admin" tag appears after team name.
4. Employee is member of Team C — Actions show Leave only.
5. Employee clicks Delete on an owned team — confirmation modal appears; confirming deletes the team and removes the row.
6. Employee clicks Leave — confirmation modal appears; confirming removes the employee and the row disappears.
7. Employee clicks Invite — the invite modal opens (same as team detail page).
8. Owner column shows current user's name highlighted when the user is the owner.
9. Created column shows a formatted date.
10. Clicking the Name column header sorts the table alphabetically; clicking again reverses; clicking a third time resets.
11. Employee has no teams — empty state with "Create your first team" prompt is shown.
12. Employee has one pending invitation — it appears in the invitations section with accept/reject buttons.
