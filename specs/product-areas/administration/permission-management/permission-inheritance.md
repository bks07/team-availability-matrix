# Permission Inheritance

## Story
- **IN ORDER TO** simplify permission management within profiles
- **AS** an administrator
- **I WANT TO** define hierarchical permissions that inherit from parent permissions

## Acceptance Criteria
- Admins can define parent-child relationships between permissions within profiles.
- Users with a parent permission automatically inherit child permissions.
- The system displays inherited permissions in the user interface.

## In-Scope
- Permission inheritance configuration within profiles.
- Backend logic for resolving inherited permissions.

## Out-of-Scope
- Permission profiles (covered in a separate story).

## Additional Information
- Inheritance should be optional and configurable.