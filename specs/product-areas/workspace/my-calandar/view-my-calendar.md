# View my calendar

## STORY

**IN ORDER TO** manage my availability in a familiar, personal view without navigating the full team matrix
**AS** an authenticated employee
**I WANT TO** see a monthly calendar view of my own availability with weekends and public holidays highlighted

## ACCEPTANCE CRITERIA

### Calendar layout

1. The employee sees a standard calendar grid displaying one month at a time, with seven columns (Monday through Sunday) and one row per week.
2. A header row shows the abbreviated day names (Mon, Tue, Wed, Thu, Fri, Sat, Sun).
3. If the first day of the displayed month is not a Monday, the preceding days from the previous month fill the first row. These trailing days appear visually muted to distinguish them from the current month.
4. If the last day of the displayed month is not a Sunday, the following days from the next month fill the final row. These leading days appear visually muted in the same way.

### Status display

5. Each day cell shows the employee's current availability status — W (Working), V (Vacation), or A (Absence).
6. When no explicit status is stored for a day, the cell shows the schedule-based default derived from the employee's work schedule configuration.

### Highlighting

7. Weekend days (Saturday and Sunday) are visually highlighted to distinguish them from working days.
8. Public holidays for the employee's assigned location are visually highlighted and display the holiday name.
9. Today's date is visually highlighted to help the employee orient in the calendar.

### Navigation

10. The calendar header displays the currently shown month and year (e.g. "March 2026").
11. The employee can navigate to the previous month and to the next month.
12. A "Today" control navigates back to the month containing the current date.
13. On initial load, the calendar displays the current month.

### Access control

14. The calendar is accessible only to the authenticated employee and shows only her own data.

## IN-SCOPE

- Monthly calendar grid (Monday through Sunday) for the current employee.
- Adjacent-month day cells to fill incomplete first and last rows.
- Displaying the employee's existing availability statuses and schedule-based defaults.
- Highlighting weekend days based on the standard Saturday/Sunday definition.
- Highlighting public holidays based on the employee's assigned location.
- Displaying public holiday names on the relevant days.
- Highlighting today's date.
- Month-by-month navigation (previous / next / today).

## OUT-OF-SCOPE

- ISO calendar week numbers (covered by "Enrich calendar with week numbers and status provenance" story).
- Visual distinction between explicitly set and schedule-derived statuses (covered by "Enrich calendar with week numbers and status provenance" story).
- Weekly or yearly calendar views.
- Viewing other employees' calendars.
- Drag-and-drop or range-based status editing from this view.
- Single-day status editing from this view (covered by "Set status from calendar" and "Clear status from calendar" stories).
- Calendar export (iCal, PDF, etc.).
- Notifications or reminders about upcoming events.
- Integration with external calendar systems (Google Calendar, Outlook, etc.).

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the workspace.
- The employee's work schedule configuration is available and determines which days are working days by default.
- The employee's assigned location determines which public holidays are highlighted.
- If the employee has no assigned location, public holidays are not highlighted.

### Dependencies

- Authentication and session management are available.
- Public holidays data is available per location.
- Employee work schedule configuration is available.

### Implementation note

The current implementation renders a **weekly** calendar (7 days per page, navigated week-by-week). This story replaces that layout with a monthly grid. The companion stories ("Set status from calendar", "Clear status from calendar") work on individual day cells and apply unchanged to the monthly layout.

### Validation scenarios

1. Employee opens the calendar — the current month is displayed with the correct month/year heading and correct statuses for each day.
2. Employee navigates to the next month — the heading, day cells, and statuses update accordingly.
3. Employee navigates away then clicks "Today" — the calendar returns to the current month with today's date highlighted.
4. The month begins on a Wednesday — Monday and Tuesday of that first row show muted days from the previous month.
5. The month ends on a Thursday — Friday, Saturday, and Sunday of that last row show muted days from the next month.
6. A Saturday and Sunday in the grid appear with weekend highlighting.
7. A public holiday for the employee's location appears highlighted with the holiday name visible.
8. Employee with no assigned location sees no public holiday highlights.
