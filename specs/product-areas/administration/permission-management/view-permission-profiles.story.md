---
status: CHANGED
---

# View Permission Profiles

## Story

- **IN ORDER TO** understand how permissions are organized and which users have which access levels
- **AS** an administrator
- **I WANT TO** view a list of all permission profiles in the system

## Acceptance Criteria

1. The profile list displays each profile's name, the number of included permissions, and the number of assigned users.
2. The built-in Super Admin profile is visually distinguished with a "Built-in" tag rendered in a smaller font size with a green colored background, placed next to the profile name with a small horizontal space.
3. Clicking a profile reveals its included permissions grouped by category.
4. The list is searchable and filterable by profile name.
5. The page is accessible only to users with the `permission_profiles.view` permission.

## In-Scope

- Profile listing interface with name, permission count, and user count.
- Visual distinction for the built-in Super Admin profile using a styled tag.
- Expandable detail view showing included permissions.
- Search and filter functionality.
- Backend API endpoint returning profiles with aggregated counts.

## Out-of-Scope

- Creating, editing, or deleting profiles (covered by separate stories: create-permission-profile, edit-permission-profile, delete-permission-profile).
- Assigning profiles to users (covered by assign-profile-to-user).

## Additional Information

- Requires `permission_profiles.view` permission.
- The profile list is the primary navigation point for all permission profile management actions.
- The "Built-in" tag styling is defined in the permission management page rebrush: `specs/rebrushes/2026/26q2/2026-04-06-003-rebrush-permission-management-page.rebrush.md`.
- See the technical initiative for the full permission catalog and profile schema: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
