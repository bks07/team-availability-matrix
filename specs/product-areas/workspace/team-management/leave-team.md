---
status: DONE
---

# Leave team

## STORY

**IN ORDER TO** remove myself from a team I no longer wish to be part of
**AS** a team member or team administrator
**I WANT TO** voluntarily leave the team

## ACCEPTANCE CRITERIA

1. Any team member or administrator can leave a team at any time.
2. The team owner cannot leave the team; they must transfer ownership first or delete the team.
3. Leaving the team removes the employee from the member list immediately.
4. The employee loses access to the team upon leaving.
5. The employee receives confirmation that they have left.
6. Other team members see the updated member list without the departed employee.
7. If an administrator leaves, their admin role is simply removed (no replacement required).

## IN-SCOPE

- Voluntary self-removal from a team.
- Blocking the owner from leaving without transferring ownership.

## OUT-OF-SCOPE

- Forced removal by an owner or admin (covered by manage-team-members).
- Rejoining automatically after leaving (must be re-invited).

## ADDITIONAL INFORMATION

### Assumptions

- Leaving deletes or deactivates the team-membership record.
- A member who left can be re-invited through the normal invite flow.

### Dependencies

- Create team, team owner role, and invite-to-team features are implemented.

### Validation scenarios

1. Regular member leaves the team — they disappear from the member list and lose access.
2. Administrator leaves the team — they disappear from the member list; no replacement admin is needed.
3. Owner tries to leave — action is blocked with a message to transfer ownership or delete the team first.
