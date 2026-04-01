---
status: DONE
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
- The team selection persists during the current session but resets to the default team on the next login.

## In-Scope
- Team selector dropdown component.
- Session-level persistence of the selected team.
- Visual indicator for the default team.

## Out-of-Scope
- Persistent cross-session team selection (handled by the default team setting).
- Keyboard shortcuts for team switching.
- Search/filter within the team dropdown.

## Additional Information
- This feature works alongside the default team setting — the dropdown allows temporary switching while the default controls the initial view.
