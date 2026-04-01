# View User Working Days and Hours

## Story
- **IN ORDER TO** understand user availability at a glance
- **AS** an administrator
- **I WANT TO** see a graphical representation of user working days and hours in the user management table

## Acceptance Criteria
- A new column is added to the user management table for working days and hours.
- Each cell in the column displays:
  - 7 small points in a row, representing Monday to Sunday.
  - Workdays are displayed in a distinct color, while non-working days are greyed out.
  - Below the points, the working hours per week are displayed in a slightly smaller monospace font.
  - The contents of the cell are centered.
- The data is fetched from the backend and reflects the user's current working schedule.

## In-Scope
- Graphical representation of working days.
- Display of working hours per week.
- Backend API integration for fetching user working schedules.

## Out-of-Scope
- Editing working days or hours (covered in a separate story).

## Additional Information
- This feature provides a quick overview of user availability without navigating to detailed views.