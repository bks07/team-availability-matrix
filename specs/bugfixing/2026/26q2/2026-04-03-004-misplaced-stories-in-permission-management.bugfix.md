---
status: DONE
---

# Misplaced stories in permission-management folder

## CURRENT BEHAVIOR

Three stories were located in `administration/permission-management/` but describe user management concerns, not permission management:

1. `edit-user-profile.story.md`  editing user profiles via admin modal (user management concern)
2. `reset-user-password.story.md`  resetting user passwords (user management concern)
3. `view-user-working-days.story.md`  viewing work schedule in user table (user management concern)

These files sat alongside permission profile stories (create-permission-profile, edit-permission-profile, etc.) where they did not belong.

## EXPECTED BEHAVIOR

Stories about user management should reside in `administration/user-management/`.

## RESOLUTION

Copied all three files to `administration/user-management/` with identical content. The original files in `permission-management/` still need manual deletion (tooling limitation).

Files to manually delete:
- `specs/product-areas/administration/permission-management/edit-user-profile.story.md`
- `specs/product-areas/administration/permission-management/reset-user-password.story.md`
- `specs/product-areas/administration/permission-management/view-user-working-days.story.md`

## IMPACT

Folder organisation only. No content changes to the stories themselves.