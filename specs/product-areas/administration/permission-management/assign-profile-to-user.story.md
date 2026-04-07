---
status: DONE
---

# Assign Permission Profile to User

## Story

- **IN ORDER TO** grant a user the appropriate set of system permissions
- **AS** an administrator
- **I WANT TO** assign a permission profile to a user so they receive the grouped permissions defined in that profile

## Acceptance Criteria

1. The administrator can select a user and assign exactly one permission profile from a dropdown displayed inside the "Current Profile" column cell. The dropdown is pre-selected with the user's current profile (if any).
2. If the user already has a profile assigned, assigning a new one replaces the previous assignment.
3. The administrator can unassign a profile from a user, leaving the user with no admin-level permissions (authenticated-only actions remain available).
4. The change takes effect immediately upon selection from the dropdown.
5. A success message confirms the assignment or unassignment.
6. The user's current profile assignment (if any) is displayed as the pre-selected value in the dropdown before making changes.
7. Users without an assigned profile have zero admin permissions — they can only perform authenticated-only actions (view/update own profile, view matrix, manage own statuses, manage teams).
8. The built-in Super Admin profile cannot be unassigned from user id=1 (lockout prevention).
9. The page is accessible only to users with the `permission_profiles.assign` permission.
10. The User Assignments tab displays a tool card above the table with filter input fields for user name, user email address, and current profile (dropdown), plus a "Clear Filters" button that resets all filters.
11. The User Assignments table is paginated. The tool card includes a page-size selector with options: 10, 25, 50, and 100.
12. All input fields, dropdowns, and buttons inside the tool card are styled consistently with the Public Holiday Management page.

## In-Scope

- Tool card with filter inputs (user name, email, profile dropdown) and clear-filters button.
- Paginated user table with selectable page sizes (10, 25, 50, 100).
- Inline profile assignment via dropdown in the "Current Profile" column cell.
- One-profile-per-user enforcement.
- Unassign capability.
- Lockout prevention for user id=1.
- Backend API endpoint for assigning and unassigning profiles.

## Out-of-Scope

- Assigning individual permissions directly to users — not supported in this model. All permissions come through profiles.
- Assigning multiple profiles to a single user — each user has exactly one profile or none.
- Creating, editing, or deleting profiles (covered by separate stories).

## Additional Information

- Requires `permission_profiles.assign` permission.
- This is the **sole mechanism** for granting system permissions to users. There is no direct permission assignment.
- The first registered user (id=1) is auto-assigned the built-in Super Admin profile at system startup and cannot have it removed.
- If a user needs permissions from two different profiles, the administrator must create a third profile combining both permission sets. This is an intentional design simplification.
- The tool card, filter, pagination, and dropdown patterns are defined in the permission management page rebrush: `specs/rebrushes/2026/26q2/2026-04-06-003-rebrush-permission-management-page.rebrush.md`.
- Public Holiday Management page styling reference: `specs/rebrushes/2026/26q2/2026-04-06-002-rebrush-public-holidays-page.rebrush.md`.
- See the technical initiative for the profile assignment schema: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
