# Auto-Set Default Team on First Team Join

## Story
- **IN ORDER TO** have a seamless first experience after joining a team
- **AS** a new team member
- **I WANT TO** have my first team automatically set as my default team

## Acceptance Criteria
- When a user joins their first team (by accepting an invitation or creating a team), the system automatically sets that team as their default team.
- This only applies when the user currently has no default team set (default_team_id is NULL).
- If the user already has a default team, joining additional teams does not change the default.
- The auto-set behavior applies to both team creation (user becomes owner) and invitation acceptance (user becomes member).

## In-Scope
- Automatic default team assignment on first team join.
- Backend logic in team creation and invitation acceptance handlers.
- Condition check: only when user has no existing default team.

## Out-of-Scope
- User prompt to confirm auto-setting.
- Changing the default when leaving/being removed from the default team to another team.

## Additional Information
- This eliminates the empty-default scenario for new team members, ensuring they see a team matrix immediately after their first team join.
