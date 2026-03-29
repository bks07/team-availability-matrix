# Manage team members

## STORY

**IN ORDER TO** keep the team roster up to date
**AS** a team owner or team administrator
**I WANT TO** remove members from the team

## ACCEPTANCE CRITERIA

1. A team owner can remove any member or administrator from the team.
2. A team administrator can remove any regular member from the team.
3. A team administrator cannot remove another administrator or the owner.
4. Removing a member revokes their access to the team immediately.
5. The removed member no longer appears in the team member list.
6. The actor receives confirmation after a successful removal.
7. A regular member cannot remove anyone.

## IN-SCOPE

- Removing a single team member.
- Role-based authorisation for removals (owner > admin > member).
- Immediate effect on the member list.

## OUT-OF-SCOPE

- Bulk-removing multiple members at once.
- Temporarily suspending a member instead of removing.
- Re-inviting a removed member (handled by invite-to-team).

## ADDITIONAL INFORMATION

### Assumptions

- Inviting members is covered by the invite-to-team story; this story focuses on removal.
- Removing a member deletes or deactivates their team-membership record.
- A removed member can be re-invited later.

### Dependencies

- Create team, team owner role, team administrator role, and invite-to-team features are implemented.

### Validation scenarios

1. Owner removes a regular member — the member disappears from the list.
2. Owner removes an administrator — the admin disappears from the list.
3. Admin removes a regular member — the member disappears from the list.
4. Admin tries to remove another admin — action is blocked with a permission error.
5. Admin tries to remove the owner — action is not available.
6. Regular member tries to remove someone — action is not available.
