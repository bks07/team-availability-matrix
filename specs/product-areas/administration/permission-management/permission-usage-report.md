# Permission Usage Report

## Story

- **IN ORDER TO** audit who has access to what in the system
- **AS** an administrator
- **I WANT TO** generate a report of permission profile assignments across all users

## Acceptance Criteria

1. The report displays all permission profiles with their included permissions and list of assigned users.
2. Users without an assigned profile are included in the report with an empty profile column.
3. The report is filterable by profile name and user name.
4. The report is downloadable as a CSV file.
5. The CSV includes columns: user display name, user email, profile name, and permissions (comma-separated list).
6. The page is accessible only to users with the `permission_profiles.view` permission.

## In-Scope

- Report display interface with filtering.
- CSV download functionality.
- Backend API endpoint for generating the report data.
- Inclusion of users without a profile assignment.

## Out-of-Scope

- Real-time usage tracking or permission-level access frequency analytics.
- Historical reporting (only shows current state).
- Scheduled or automated report generation.

## Additional Information

- Requires `permission_profiles.view` permission.
- This report complements the Permission Audit Log by showing the current state of assignments, while the audit log shows the history of changes.
- See the technical initiative for the full permission catalog and profile schema: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.