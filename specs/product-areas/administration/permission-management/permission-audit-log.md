# Permission Audit Log

## Story

- **IN ORDER TO** track who changed permission settings and when
- **AS** an administrator
- **I WANT TO** view an audit log of all permission-related actions in the system

## Acceptance Criteria

1. The audit log records the following event types:
   - Profile created (with profile name and included permissions).
   - Profile edited (with before and after state of name and permissions).
   - Profile deleted (with profile name).
   - Profile assigned to user (with profile name and user name).
   - Profile unassigned from user (with profile name and user name).
2. Each log entry displays: timestamp, acting administrator name, event type, affected entity (profile name and/or user name), and event details.
3. The log is paginated for large datasets.
4. The log is filterable by event type and date range.
5. The log is searchable by administrator name, user name, or profile name.
6. The page is accessible only to users with the `permission_profiles.view` permission.

## In-Scope

- Audit log display interface with pagination.
- Filter controls for event type and date range.
- Search functionality across admin name, user name, and profile name.
- Backend API endpoint for fetching paginated and filtered audit log entries.
- Backend event recording for all five event types listed above.

## Out-of-Scope

- Exporting the audit log (covered by export-permission-audit-log).
- Real-time notifications for permission changes.
- Audit logging of non-permission-related actions.

## Additional Information

- Requires `permission_profiles.view` permission.
- Audit logging begins from the point of migration to the profile-based system. No retroactive entries are generated for pre-migration permission changes.
- See export-permission-audit-log for CSV export capability.
- See the technical initiative for the overall permission system design: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.
