# Team owner role

## STORY

**IN ORDER TO** have clear authority over a team I created
**AS** the creator of a team
**I WANT TO** be automatically assigned as the team owner with full management capabilities

## ACCEPTANCE CRITERIA

1. When a team is created the creator is automatically assigned the **owner** role on that team.
2. Every team has exactly one owner at all times.
3. The owner has the highest level of authority within the team and can perform all management actions (invite, remove, promote, demote, rename, delete, transfer ownership).
4. The owner role is visually indicated in the team member list (e.g. a badge or label).
5. The owner cannot remove themselves from the team; they must transfer ownership first or delete the team.

## IN-SCOPE

- Automatic assignment of the owner role on team creation.
- Enforcing a single-owner constraint.
- Visual identification of the owner in the member list.
- Preventing the owner from self-removing without transferring ownership.

## OUT-OF-SCOPE

- Co-ownership or multiple owners.
- Changing the owner role's permission set via configuration.

## ADDITIONAL INFORMATION

### Assumptions

- Ownership is modelled as a role value (e.g. `owner`) on the team-membership record.
- The single-owner constraint is enforced at the application level.

### Dependencies

- Create team feature is implemented.

### Validation scenarios

1. Employee creates a team — the member list shows the employee with the "Owner" badge.
2. Owner tries to leave the team without transferring ownership — action is blocked with an explanatory message.
3. Another member views the team — the owner is clearly distinguishable from other members.
