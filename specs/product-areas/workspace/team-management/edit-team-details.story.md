---
status: DONE
---

# Edit team details

## STORY

**IN ORDER TO** keep a team's identity accurate as circumstances change
**AS** the team owner
**I WANT TO** rename the team and update its description

## ACCEPTANCE CRITERIA

1. Only the team owner can edit the team name and description.
2. The team name is required, non-empty after trimming, and max 100 characters.
3. The description is optional and max 500 characters.
4. Leading and trailing whitespace in both fields is trimmed before saving.
5. The updated team name must remain unique across all teams.
6. Changes are immediately visible to all team members.
7. If validation fails or the name is a duplicate, the owner receives a clear error message and the previous values are preserved.
8. Team administrators and regular members do not see the edit controls.

## IN-SCOPE

- Editing the team name.
- Editing the team description.
- Input validation and trimming.
- Uniqueness check on team name.

## OUT-OF-SCOPE

- Editing team settings beyond name and description (e.g. visibility, avatar).

## ADDITIONAL INFORMATION

### Assumptions

- The UI provides an inline edit form or a settings page accessible only to the owner.

### Dependencies

- Create team and team owner role features are implemented.

### Validation scenarios

1. Owner renames the team from "Backend Squad" to "Platform Team" — the new name is shown everywhere.
2. Owner clears the description — the team saves with an empty description.
3. Owner enters a name already used by another team — duplicate error shown.
4. Owner enters a description of 501 characters — validation error shown.
5. Admin tries to access the edit form — it is not available or returns a permission error.
