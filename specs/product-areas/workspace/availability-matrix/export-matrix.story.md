---
status: DONE
---

# Export availability matrix

## STORY

**IN ORDER TO** analyse availability data offline or share it with stakeholders
**AS** an authenticated employee
**I WANT TO** export the currently displayed availability matrix as a CSV file

## ACCEPTANCE CRITERIA

1. An export button is visible in the matrix toolbar.
2. Clicking the export button initiates a browser download of a CSV file.
3. The exported CSV covers the currently displayed team and date range.
4. The CSV includes a header row identifying each team member and date column.
5. Each data row contains the availability status (W, V, or A) for each team member on that date.
6. The backend endpoint `GET /api/matrix/export` generates the CSV dynamically based on the requested team and period.
7. The downloaded file opens correctly in standard spreadsheet applications (Excel, Google Sheets, LibreOffice Calc).

## IN-SCOPE

- Export button in the matrix toolbar.
- Backend CSV generation endpoint.
- Browser-initiated file download.
- Scoping the export to the currently viewed team and date range.
- CSV headers for user identification and date columns.

## OUT-OF-SCOPE

- Exporting in formats other than CSV (e.g. Excel, PDF, JSON).
- Exporting data for multiple teams or custom date ranges in a single action.
- Customising the CSV structure, delimiter, or encoding.
- Scheduling automated or recurring exports.
- Importing CSV data back into the system (covered by a separate, now obsolete, story).

## ADDITIONAL INFORMATION

### Assumptions

- The user has access to view the team whose data is being exported.
- The browser supports standard file download mechanisms.

### Dependencies

- The availability matrix and its toolbar are implemented.
- The backend endpoint `GET /api/matrix/export` is available and returns accurate data.

### Validation scenarios

1. User clicks the export button — a CSV file downloads successfully.
2. The exported CSV contains the correct team members and dates matching the current matrix view.
3. CSV headers correctly label each user column and each date row.
4. The export includes weekends and public holidays if they are part of the displayed period.
5. The export works across modern browsers (Chrome, Firefox, Edge, Safari).