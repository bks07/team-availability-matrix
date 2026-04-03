---
status: DONE
---

# Relocate misplaced permission management stories

## What

Three story files were located in `administration/permission-management/` but describe user management concerns, not permission management. They have been moved to `administration/user-management/`.

## Why

Correct folder placement ensures stories are discoverable in the right context and prevents confusion about which product area owns the functionality.

## Changes

### Files moved

| Old path | New path |
|----------|----------|
| `administration/permission-management/edit-user-profile.story.md` | `administration/user-management/edit-user-profile.story.md` |
| `administration/permission-management/reset-user-password.story.md` | `administration/user-management/reset-user-password.story.md` |
| `administration/permission-management/view-user-working-days.story.md` | `administration/user-management/view-user-working-days.story.md` |

### Rationale per file

- **edit-user-profile**: Describes admin editing a user's profile via modal — this is user management, not permission management.
- **reset-user-password**: Describes admin resetting a user's password — this is user management, not permission management.
- **view-user-working-days**: Describes displaying work schedule info in the user management table — this is user management, not permission management.

### Cleanup needed

The old files at their original `permission-management/` paths need to be deleted manually. The new copies at `user-management/` have been created with identical content.

## Acceptance criteria

1. All 3 files exist at their new `user-management/` paths with identical content.
2. Old files at `permission-management/` paths are deleted.
3. No cross-references in other spec files point to the old paths.