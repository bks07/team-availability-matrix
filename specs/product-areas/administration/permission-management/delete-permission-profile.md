---
status: DONE
---

# Delete Permission Profile

## Story

- **IN ORDER TO** keep the profile list clean and manageable
- **AS** an administrator
- **I WANT TO** delete obsolete permission profiles from the system

## Acceptance Criteria

1. The administrator can delete a custom permission profile.
2. A confirmation dialog is displayed before deletion, showing the profile name.
3. The system prevents deletion if the profile is currently assigned to any user. The error message indicates how many users are still assigned.
4. The built-in Super Admin profile cannot be deleted. The delete control is disabled or hidden, with an explanation that it is a system-managed profile.
5. On successful deletion, the profile is removed from the list immediately.
6. A success message is displayed upon successful deletion.
7. The page is accessible only to users with the `permission_profiles.delete` permission.

## In-Scope

- Confirmation dialog for deletion.
- Backend check preventing deletion of profiles with assigned users.
- Backend check preventing deletion of the built-in Super Admin profile.
- Backend API endpoint for deleting a profile.

## Out-of-Scope

- Automatic reassignment of users from a deleted profile — administrators must manually reassign or unassign users before deleting.
- Cascade deletion of user assignments.
- Creating or editing profiles (covered by separate stories).

## Additional Information

- Requires `permission_profiles.delete` permission.
- The administrator must first reassign or unassign all users from a profile before it can be deleted. See assign-profile-to-user for the reassignment workflow.
- See the technical initiative for the profile schema: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
