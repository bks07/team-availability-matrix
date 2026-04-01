# Permission Dependency Check

## Story
- **IN ORDER TO** ensure consistent access control within profiles
- **AS** an administrator
- **I WANT TO** check for dependencies between permissions before making changes

## Acceptance Criteria
- The system warns admins if a permission is a dependency for another within the same profile.
- Admins can view a list of dependent permissions.
- Changes to dependent permissions require confirmation.

## In-Scope
- Dependency check logic in the backend.
- Warning messages in the user interface.

## Out-of-Scope
- Permission inheritance (covered in a separate story).

## Additional Information
- Dependencies should be displayed clearly to avoid confusion.