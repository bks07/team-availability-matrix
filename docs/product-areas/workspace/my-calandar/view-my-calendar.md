# View my calendar

## STORY

**IN ORDER TO** manage my availability in a familiar, personal view without navigating the full team matrix
**AS** an authenticated employee
**I WANT TO** see a weekly calendar view of my own availability with weekends and public holidays highlighted

## ACCEPTANCE CRITERIA

1. The employee sees a weekly calendar displaying one week at a time, with each day of the week (Monday through Sunday) as a column.
2. Each day cell shows the employee's current availability status (W, V, A) or the schedule-based default when no explicit status is stored.
3. Weekend days (Saturday and Sunday) are visually highlighted to distinguish them from working days.
4. Public holidays for the employee's assigned location are visually highlighted and display the holiday name.
5. The employee can navigate forward and backward between weeks.
6. The currently displayed week defaults to the current week on initial load.
7. The calendar is accessible only to the authenticated employee and shows only her own data.

## IN-SCOPE

- Weekly calendar view (Monday to Sunday) for the current employee.
- Displaying the employee's existing availability statuses.
- Highlighting weekend days based on the standard Saturday/Sunday definition.
- Highlighting public holidays based on the employee's assigned location.
- Displaying public holiday names on the relevant days.
- Week-by-week navigation (previous week / next week).

## OUT-OF-SCOPE

- Monthly or yearly calendar views.
- Viewing other employees' calendars.
- Drag-and-drop or range-based status editing from this view.
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

### Validation scenarios

1. Employee opens the calendar — the current week is displayed with correct statuses for each day.
2. Employee navigates to the next week — the view updates to show the following Monday through Sunday.
3. A Saturday and Sunday in the view appear with weekend highlighting.
4. A public holiday for the employee's location appears highlighted with the holiday name visible.
5. Employee with no assigned location sees no public holiday highlights.
