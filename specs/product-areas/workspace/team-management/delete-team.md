---
status: DONE
---

# Delete team

## STORY

**IN ORDER TO** clean up teams that are no longer needed
**AS** the team owner
**I WANT TO** permanently delete a team

## ACCEPTANCE CRITERIA

1. Only the team owner can delete the team.
2. Deleting a team requires an explicit confirmation step (e.g. typing the team name or confirming in a dialog).
3. On deletion all memberships, pending invitations, and associated team data are permanently removed.
4. All former members lose access to the team immediately.
5. The team no longer appears in any member's team list.
6. The team name becomes available for reuse.
7. The owner receives confirmation that the team was deleted.

## IN-SCOPE

- Permanent deletion of a team and all its related data.
- Confirmation step to prevent accidental deletion.
- Freeing the team name for reuse.

## OUT-OF-SCOPE

- Soft-delete or archiving a team for later restoration.
- Deleting teams in bulk.

## ADDITIONAL INFORMATION

### Assumptions

- Deletion cascades to team memberships and invitations.
- This is an irreversible action.

### Dependencies

- Create team and team owner role features are implemented.

### Validation scenarios

1. Owner confirms deletion — the team and all memberships are removed.
2. Owner cancels the confirmation — nothing changes.
3. Admin tries to delete the team — action is not available.
4. After deletion, another user creates a team with the same name — it succeeds.
