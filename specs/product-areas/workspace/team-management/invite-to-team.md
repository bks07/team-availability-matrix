---
status: DONE
---

# Invite to team

## STORY

**IN ORDER TO** grow my team with the right colleagues
**AS** a team owner or team administrator
**I WANT TO** invite other employees to join my team and have them accept or reject the invitation

## ACCEPTANCE CRITERIA

1. A team owner or team administrator can invite any registered employee who is not already a member or pending invitee of that team.
2. The invitee receives a visible invitation that they can accept or reject.
3. Accepting an invitation adds the invitee as a team **member** (regular role).
4. Rejecting an invitation removes it; the invitee is not added to the team.
5. A pending invitation can be cancelled by the inviter (owner or admin) before the invitee responds.
6. An employee cannot be invited to the same team more than once while a pending invitation exists.
7. The invitee sees their pending invitations in a dedicated area (e.g. a notifications list or "My Teams" page).
8. Both the inviter and the invitee receive clear feedback on the outcome of each action (sent, accepted, rejected, cancelled).

## IN-SCOPE

- Sending an invitation to a single employee.
- Accepting or rejecting a received invitation.
- Cancelling a pending invitation.
- Displaying pending invitations to the invitee.

## OUT-OF-SCOPE

- Bulk-inviting multiple employees at once.
- Inviting users who are not yet registered in the system.
- Invitation expiry or automatic decline after a period.
- Email or push notifications about invitations.

## ADDITIONAL INFORMATION

### Assumptions

- The inviter has the owner or administrator role on the team.
- Invitation state is stored persistently (e.g. a `team_invitations` table with status pending/accepted/rejected/cancelled).

### Dependencies

- Create team feature is implemented.
- Team roles (owner, admin, member) are modelled.

### Validation scenarios

1. Owner invites employee A — employee A sees a pending invitation.
2. Employee A accepts — they appear in the team member list as a regular member.
3. Employee A rejects — they do not appear in the team and the invitation is removed.
4. Owner tries to invite someone already on the team — error "already a member".
5. Owner cancels a pending invitation before the invitee responds — the invitation disappears for both sides.
6. Admin invites employee B — works identically to when the owner invites.
7. A regular member tries to invite — action is not available or returns a permission error.
