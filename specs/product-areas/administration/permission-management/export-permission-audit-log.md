# Export Permission Audit Log

## Story
- **IN ORDER TO** analyze permission changes offline
- **AS** an administrator
- **I WANT TO** export the permission audit log as a CSV file, including profile-related changes

## Acceptance Criteria
- Admins can export the audit log for a selected date range.
- The exported file includes all relevant log details, including changes to profiles.
- The file is formatted as a CSV.

## In-Scope
- Export button in the audit log interface.
- Backend endpoint for generating CSV files.

## Out-of-Scope
- Exporting data in other formats (e.g., Excel).

## Additional Information
- The CSV file should include headers for clarity.