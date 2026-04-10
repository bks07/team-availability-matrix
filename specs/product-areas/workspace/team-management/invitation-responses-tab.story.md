---
status: DONE
---

# Invitation Responses tab

## STORY

**IN ORDER TO** see how other employees responded to my team invitations
**AS** a team owner or team administrator
**I WANT TO** view a table of all resolved invitation responses with their acceptance or rejection status

## ACCEPTANCE CRITERIA

### Table layout

1. The Responses tab displays a table following the same visual pattern as the Administration // User Management table.
2. The table contains the following columns in order: **User**, **Team**, **Date invited**, **Date responded**, **Response**.
3. **User** column shows the display name of the invited user.
4. **Team** column shows the name of the team the invitation was for.
5. **Date invited** column shows the date the invitation was created, formatted as a locale-aware short date.
6. **Date responded** column shows the date the invitee accepted or rejected the invitation, formatted as a locale-aware short date.
7. **Response** column shows a coloured tag/badge:
   - **Accepted**: green background, white text, reading "Accepted".
   - **Rejected**: red background, white text, reading "Rejected".

### Toolbar

8. A toolbar card is displayed above the table, following the same visual style as the Administration // User Management toolbar.
9. The toolbar contains a text search input, a response-status filter dropdown, and a clear/reset control.
10. The search input filters rows in real time (debounced, ~300 ms) across **User** and **Team** columns (case-insensitive, substring match).
11. The response-status filter dropdown has options: **All**, **Accepted**, **Rejected**. Default is **All**.
12. Search and status filter are applied together (logical AND).
13. If no rows match the combined filters, a "No responses match your filters" empty state is shown.
14. A clear/reset button removes the search term, resets the status filter to All, and restores the full list.

### Pagination

15. Below the table, a pagination bar displays the current page, total pages, and a page-size dropdown with options: **10**, **25**, **50**.
16. The default page size is 25.
17. Changing the page size resets to page 1.
18. Navigation controls include: first page, previous page, next page, last page buttons.
19. Buttons for unavailable navigation (e.g. previous on page 1) are disabled.

### Empty state

20. If the employee has no resolved invitation responses, the tab panel shows a friendly empty state: "No invitation responses yet."

### Data source — new backend endpoint

21. A new endpoint `GET /api/teams/invitations/responses` returns all non-pending invitations where the authenticated user is the inviter.
22. The response is an array of objects with fields: `id`, `teamId`, `teamName`, `inviteeName`, `inviteeEmail`, `status` (`"accepted"` or `"rejected"`), `createdAt`, `respondedAt`.
23. Results are ordered by `respondedAt` descending (newest first).
24. The endpoint requires authentication but no special permission — any authenticated user can view responses to their own invitations.
25. Cancelled invitations (cancelled by the inviter) are excluded from this endpoint.
26. Filtering and pagination are performed client-side on the loaded data set.

### Frontend model

27. A new TypeScript interface `InvitationResponse` is added to the API models: `{ id: number; teamId: number; teamName: string; inviteeName: string; inviteeEmail: string; status: string; createdAt: string; respondedAt: string }`.
28. A new service method `getInvitationResponses(): Promise<InvitationResponse[]>` is added to the team service.

## IN-SCOPE

- Invitation responses table with status tags.
- Toolbar with search input and status filter dropdown.
- Client-side pagination with page-size dropdown.
- New backend endpoint `GET /api/teams/invitations/responses`.
- New frontend model and service method.
- Empty state.
- Loading and error states.

## OUT-OF-SCOPE

- Server-side filtering or pagination.
- Sorting by column headers.
- Actions on resolved invitations (re-invite, delete history).
- Notification or mark-as-read functionality for new responses.
- Export of invitation response data.

## ADDITIONAL INFORMATION

### Assumptions

- The `team_invitations` table stores `updated_at` which serves as the response timestamp when status changes from `pending` to `accepted` or `rejected`.
- Cancelled invitations are excluded because they represent inviter-initiated withdrawals, not invitee responses.
- Data volume per user is small enough for client-side pagination.

### Dependencies

- my-teams-tabbed-layout (provides the tab container for this panel)
- invite-to-team (backend invitation model)

### Validation scenarios

1. Employee who sent invitations sees rows for accepted and rejected responses with correct columns.
2. An accepted response shows a green "Accepted" tag; a rejected response shows a red "Rejected" tag.
3. Employee filters by "Rejected" status — only rejected responses are shown.
4. Employee searches "alice" while "Accepted" filter is active — only accepted responses where User or Team contains "alice" are shown.
5. Employee clears filters — full list restored.
6. Employee with no responses sees empty state message.
7. Employee has 40 responses with page size 10 — 4 pages shown with correct navigation.
8. Cancelled invitations do not appear in the responses list.
