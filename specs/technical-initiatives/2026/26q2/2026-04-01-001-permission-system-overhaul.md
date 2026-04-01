# Permission System Overhaul

## What
- Identify all actions within the system that require access control.
- Define a comprehensive list of permissions for these actions.
- Implement a `Permission Profile` system where permissions are grouped.
- Assign users to `Permission Profiles` instead of individual permissions.
- Ensure the permission system aligns with Atlassian Jira's model.
- Refactor existing user stories to align with the new permission model.

## Why
- To ensure a robust and scalable access control system.
- To simplify user management by grouping permissions into profiles.
- To prevent unauthorized access to system actions.
- To provide a consistent and intuitive permission management experience.

## In-Scope
- Identification of all system actions requiring permissions.
- Creation of a permission list.
- Implementation of `Permission Profiles`.
- Migration of existing user permissions to the new system.
- Updates to all user stories impacted by the new permission model.

## Out-of-Scope
- UI/UX redesign for permission management.
- Integration with third-party authentication systems.

## Acceptance Criteria
- All system actions have corresponding permissions.
- Permissions are grouped into `Permission Profiles`.
- Users can be assigned to `Permission Profiles`.
- Existing permissions are migrated without data loss.
- All user stories are updated to reflect the new permission model.

## Additional Information
- Permissions should be system-defined and immutable by users.
- The system should prevent unauthorized access based on permissions.
- The permission model should be documented for administrators.