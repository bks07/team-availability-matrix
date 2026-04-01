# Set as Default Team from Team Detail Page

## Story
- **IN ORDER TO** quickly set my preferred team without navigating to profile settings
- **AS** a team member
- **I WANT TO** set a team as my default directly from the team detail page

## Acceptance Criteria
- A "Set as Default Team" button is visible on the team detail page for teams the user is a member of.
- Clicking the button sets the current team as the user's default team.
- If the team is already the default, the button shows "Default Team ★" (or similar) and is disabled or displays a remove option.
- After setting, a success message confirms the change.
- The change is immediately reflected in the workspace view (next load uses this team).

## In-Scope
- "Set as Default Team" button on team detail page.
- Visual indicator when the team is already the default.
- Success/error feedback.

## Out-of-Scope
- Batch operations on multiple teams.
- Auto-redirecting to workspace after setting default.

## Additional Information
- This provides a shortcut to the same functionality available in the profile settings, reducing the number of clicks needed.
