# Export Permission Audit Log

## Story

- **IN ORDER TO** analyze permission changes offline or share them with stakeholders
- **AS** an administrator
- **I WANT TO** export the permission audit log as a CSV file

## Acceptance Criteria

1. The administrator can select a date range and export all matching audit log entries.
2. The CSV includes columns: timestamp, administrator name, event type, affected profile name, affected user name, and event details.
3. The event types in the export match those recorded in the audit log: profile created, profile edited, profile deleted, profile assigned to user, profile unassigned from user.
4. The export respects any filters currently applied in the audit log view (event type, date range, search term).
5. The CSV file uses UTF-8 encoding with BOM for Excel compatibility.
6. The file is downloaded through the browser.
7. The export action is accessible only to users with the `permission_profiles.view` permission.

## In-Scope

- Export button in the audit log interface.
- Backend API endpoint for generating the filtered CSV file.
- Date range selection for export scope.
- Filter-aware export (applies current audit log filters).

## Out-of-Scope

- Export in formats other than CSV (e.g., Excel, PDF).
- Scheduled or automated exports.
- Exporting non-permission-related audit data.

## Additional Information

- Requires `permission_profiles.view` permission.
- The export uses the same event types and data structure as the Permission Audit Log view. See permission-audit-log for the full event type definitions.
- See the technical initiative for the overall permission system design: `specs/technical-initiatives/2026/26q2/2026-04-01-001-permission-system-overhaul.md`.