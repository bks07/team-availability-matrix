---
status: DONE
---

# Contradicting admin team management stories

## CURRENT BEHAVIOR

The `administration/team-management/` folder contained 7 stories describing an admin-only, modal-based, single-team-per-user team management model:

- `add-team.story.md`
- `assign-users-to-team.story.md` (explicitly states "Users can only belong to one team at a time")
- `delete-team.story.md`
- `edit-team-details.story.md`
- `notification-for-teamless-users.story.md`
- `set-default-team.story.md`
- `view-team-members.story.md`

These directly contradict the implemented `workspace/team-management/` stories which describe a self-service model with:
- Multiple team memberships per user
- Role-based access control (owner, admin, member)
- Team invitations
- User-initiated team creation, not admin-only

The system implements the workspace model. The admin team management stories described a superseded design.

## EXPECTED BEHAVIOR

Product-area stories should accurately reflect the current system design. Superseded stories should be marked OBSOLETE with references to their replacements.

## RESOLUTION

All 7 admin team management stories have been marked `status: OBSOLETE` with obsolescence notes pointing to their workspace replacements:
- `add-team` → `workspace/team-management/create-team.story.md`
- `assign-users-to-team` → `workspace/team-management/` (multi-team model)
- `delete-team` → `workspace/team-management/delete-team.story.md`
- `edit-team-details` → `workspace/team-management/edit-team-details.story.md`
- `notification-for-teamless-users` → `workspace/availability-matrix/fallback-view-for-user-without-team.story.md`
- `set-default-team` → `workspace/team-management/set-default-team-from-detail.story.md`
- `view-team-members` → `workspace/team-management/manage-team-members.story.md`

Additionally:
- `user-management/permission-management.story.md` marked OBSOLETE (superseded by profile-based permission system)
- `availability-matrix/show-default-team-on-login.story.md` marked OBSOLETE (superseded by `switch-between-teams.story.md`)

## ROOT CAUSE

The admin team management stories were written early in the project when teams were managed exclusively by administrators. The system was subsequently redesigned to use a self-service team model, but the old admin stories were never deprecated.

## IMPACT

Contradicting stories create confusion about the intended system behavior and could lead to incorrect implementation decisions if new features are built against the obsolete model.