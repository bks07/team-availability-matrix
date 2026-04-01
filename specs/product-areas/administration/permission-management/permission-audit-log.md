# Permission Audit Log

## Story
- **IN ORDER TO** track changes to permissions and profiles
- **AS** an administrator
- **I WANT TO** view an audit log of all permission-related actions

## Acceptance Criteria
- Admins can view a log of permission and profile changes.
- The log includes timestamps, admin names, and actions performed.
- The log is paginated for large datasets.

## In-Scope
- Audit log interface.
- Backend API for fetching audit log data.

## Out-of-Scope
- Exporting audit logs (covered in a separate story).

## Additional Information
- The log should be searchable by action type and date range.