---
status: CHANGED
---

# Switch Between Teams in Workspace View

## Story
- **IN ORDER TO** view the availability of different teams I belong to
- **AS** a team member
- **I WANT TO** switch between teams using a dropdown selector in the workspace view

## Acceptance Criteria
- A team selector dropdown is visible above the availability matrix.
- The dropdown lists all teams the user is a member of.
- The currently selected team is highlighted in the dropdown.
- The user's default team is indicated with a visual marker (e.g., ★).
- Changing the selection immediately loads the selected team's availability matrix.
- The team selection persists across sessions via local storage. On return visits, the matrix opens to the last-selected team.
- If the previously selected team has been deleted, the system falls back to the user's default team. If the default team has also been deleted, it falls back to the first available team.

## In-Scope
- Team selector dropdown component.
- Cross-session persistence of the selected team via local storage.
- Visual indicator for the default team.

## Out-of-Scope
- Keyboard shortcuts for team switching.
- Search/filter within the team dropdown.

## Additional Information
- This feature works alongside the default team setting — the dropdown allows persistent preference switching while the default controls the initial fallback when no stored preference exists.
