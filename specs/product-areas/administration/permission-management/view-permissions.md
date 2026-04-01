---
status: DONE
---

# View System-Defined Permissions

## Story

- **IN ORDER TO** understand which permissions exist in the system when managing profiles
- **AS** an administrator
- **I WANT TO** view the complete system-defined permission catalog

## Acceptance Criteria

1. The permission catalog displays all system-defined permissions grouped by category (User Administration, Location Management, Public Holiday Management, Permission Management, System Settings).
2. Each permission entry shows its key and a human-readable description.
3. The list is read-only — no controls for creating, editing, or deleting individual permissions are present.
4. A search bar allows filtering permissions by name, key, or category.
5. Category headers visually separate permission groups.
6. The page is accessible only to users with the `permission_profiles.view` permission.

## In-Scope

- Permission catalog display grouped by category.
- Search and filter functionality.
- Read-only presentation.
- Backend API endpoint returning the full permission catalog.

## Out-of-Scope

- Creating, editing, or deleting individual permissions — permissions are system-defined and immutable.
- Permission profile management (covered by separate stories: create-permission-profile, edit-permission-profile, delete-permission-profile).

## Additional Information

- The permission catalog is defined in the codebase and rendered at runtime. See the full catalog in the technical initiative: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
- This view serves as a reference for administrators when selecting permissions during profile creation or editing.
- Requires `permission_profiles.view` permission.
