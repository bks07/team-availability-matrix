---
status: DONE
---

# Edit Permission Profile

## Story

- **IN ORDER TO** adjust access control as requirements change
- **AS** an administrator
- **I WANT TO** edit a permission profile's name and included permissions

## Acceptance Criteria

1. The administrator can edit the profile name (uniqueness is validated, case-insensitive).
2. The administrator can add or remove permissions from the system-defined catalog using toggle switches in a structured permission table grouped under category headlines.
3. At least one permission must remain selected — a profile cannot be saved with zero permissions.
4. The built-in Super Admin profile cannot be edited. Edit controls are disabled or hidden, with an explanation that it is a system-managed profile.
5. Changes to a profile take effect immediately for all users assigned to that profile.
6. Before saving, the UI displays the number of users currently assigned to the profile to warn the administrator of the impact.
7. A success message is displayed upon successful update.
8. The page is accessible only to users with the `permission_profiles.edit` permission.

## In-Scope

- Profile editing via a modal window identical to the create-profile modal, with the headline "Edit Permission Profile" and an "Update" button replacing the "Create" button. The same scrollable layout, button placement, and toggle-switch structured-table pattern apply.
- Backend validation for unique name and non-empty permission set.
- Immediate propagation of changes to assigned users.
- Impact warning showing the count of affected users.
- Protection of the built-in Super Admin profile from editing.

## Out-of-Scope

- Creating or deleting profiles (covered by separate stories).
- Creating or deleting individual permissions — permissions are system-defined.
- Assigning profiles to users (covered by assign-profile-to-user).

## Additional Information

- Requires `permission_profiles.edit` permission.
- Editing a profile with many assigned users has an immediate system-wide effect. The impact warning is essential to prevent accidental access revocation.
- The modal design is defined in the permission management page rebrush: `specs/rebrushes/2026/26q2/2026-04-06-003-rebrush-permission-management-page.rebrush.md`.
- See the technical initiative for the full permission catalog: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
