---
status: DONE
---

# Create team

## STORY

**IN ORDER TO** organise a group of colleagues and collaborate on availability planning
**AS** an authenticated employee
**I WANT TO** create a new team with a name and an optional description

## ACCEPTANCE CRITERIA

1. Any authenticated employee can create a team.
2. The employee must provide a team name (required, non-empty after trimming, max 100 characters).
3. The employee may provide a description (optional, max 500 characters).
4. Leading and trailing whitespace in the name and description is trimmed before saving.
5. The team name must be unique across all teams.
6. On successful creation the employee is automatically assigned as the team **owner**.
7. The newly created team appears immediately in the employee's team list.
8. If the name is already taken or validation fails, the employee receives a clear error message and nothing is persisted.

## IN-SCOPE

- Creating a team with a name and an optional description.
- Trimming and validating inputs.
- Uniqueness check on team name.
- Assigning the creator as team owner.

## OUT-OF-SCOPE

- Inviting members during creation (covered by invite-to-team).
- Setting a team avatar or logo.
- Limiting the number of teams a user can create.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the workspace.
- Team ownership is stored as a role on the team-membership record.

### Dependencies

- Authentication and session management are available.

### Validation scenarios

1. Employee creates a team with name "Backend Squad" and description "Our backend crew" — team is created, employee is owner.
2. Employee tries to create a team with an empty name — validation error shown.
3. Employee tries to create a team with a name that already exists — duplicate error shown.
4. Employee provides a description exceeding 500 characters — validation error shown.
5. Employee provides a name with leading/trailing spaces — spaces are trimmed and the team is created.
