---
status: CHANGED
---

# Create Permission Profile

## Story

- **IN ORDER TO** group permissions for easy assignment to users
- **AS** an administrator
- **I WANT TO** create a new permission profile by selecting from the system-defined permission catalog

## Acceptance Criteria

1. The administrator provides a unique profile name.
2. The administrator selects one or more permissions from the system-defined permission catalog, displayed grouped under category headlines in a structured table with toggle switches.
3. The system validates that the profile name is unique (case-insensitive).
4. At least one permission must be selected before the profile can be saved.
5. A success message is displayed upon successful creation.
6. The newly created profile appears in the profile list immediately.
7. The page is accessible only to users with the `permission_profiles.create` permission.

## In-Scope

- Profile creation modal window with a "Profile Name" input field at the top, followed by a scrollable area containing the permission catalog grouped under category headlines in a structured table (permission name, description, toggle columns). "Create" and "Cancel" buttons appear at the top of the modal, directly below the headline.
- Permission catalog display grouped under category headlines in a structured table with toggle switches.
- Backend validation for unique profile name and non-empty permission set.
- Backend API endpoint for creating a profile.

## Out-of-Scope

- Creating new permissions — permissions are system-defined and immutable.
- Assigning the new profile to users (covered by assign-profile-to-user).
- Editing or deleting profiles (covered by edit-permission-profile, delete-permission-profile).

## Additional Information

- Requires `permission_profiles.create` permission.
- The permission selection interface reuses the system-defined permission catalog described in view-permissions.
- The modal design (scrollability, button placement, toggle switches) is defined in the permission management page rebrush: `specs/rebrushes/2026/26q2/2026-04-06-003-rebrush-permission-management-page.rebrush.md`.
- See the technical initiative for the full permission catalog: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
