---
status: DONE
---

# Quick-Navigate from Matrix to Team Detail Page

## Story
- **IN ORDER TO** easily access team management from the workspace
- **AS** a team member
- **I WANT TO** click on the team name in the matrix header to navigate to the team detail page

## Acceptance Criteria
- The team name displayed in the workspace (e.g., in the team selector or as a header) is clickable.
- Clicking the team name navigates to `/teams/:id` for the currently selected team.
- The navigation is implemented using client-side routing (no full page reload).
- A visual affordance (e.g., underline on hover, cursor pointer) indicates the name is clickable.

## In-Scope
- Clickable team name in the workspace view.
- Client-side navigation to team detail page.
- Hover affordance styling.

## Out-of-Scope
- Opening team detail in a new tab.
- Inline team management from the workspace.

## Additional Information
- Reduces friction for users who need to manage team members or settings while viewing the matrix.
