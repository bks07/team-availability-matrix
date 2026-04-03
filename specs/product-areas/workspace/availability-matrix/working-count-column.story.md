---
status: DONE
---

# Working count column

## STORY

**IN ORDER TO** quickly see how many team members are working on any given day
**AS** an authenticated employee viewing the availability matrix
**I WANT TO** see a "Working" column that displays the count of employees with a "W" status for each day

## ACCEPTANCE CRITERIA

1. A column labelled "Working" (or equivalent) is displayed alongside the employee columns in the availability matrix.
2. For each day row, the column shows the number of team members whose status is "W" (Working) on that day.
3. The count includes both explicitly stored "W" statuses and schedule-based defaults that resolve to "W".
4. The count updates immediately when any team member's status changes (no page reload required).
5. The column is always visible regardless of which team or date range is selected.
6. The count correctly reflects the currently displayed team  switching teams updates the column.
7. Weekend and public-holiday rows still display a working count (which may be zero for teams where no one works those days).

## IN-SCOPE

- Displaying the aggregate working count per day.
- Including schedule-based defaults in the count.
- Updating the count in response to status changes.
- Consistent display across all teams and date ranges.

## OUT-OF-SCOPE

- Counts for other statuses (Vacation, Absence) in additional columns.
- Percentage-based or graphical representations of availability.
- Configuring which statuses are counted.
- Exporting the working count data separately.

## ADDITIONAL INFORMATION

### Context

This column replaces the previous "summary row" approach (see the obsolete `view-team-availability-summary.story.md`). A column-based count provides a more compact and scannable overview than a full summary row.

### Assumptions

- The matrix data includes all team members and their statuses for the displayed period.
- Schedule-based defaults are already computed by the frontend.

### Dependencies

- The availability matrix is implemented.
- Schedule-based default computation is available.

### Validation scenarios

1. A team of 5 members where all have "W" on Monday  the Working column shows "5".
2. One member sets "V" on Monday  the Working column updates to "4" immediately.
3. User switches to a different team  the Working column recalculates for the new team.
4. A weekend row where no team members work  the Working column shows "0".
5. A day where some members have explicit "W" and others have schedule-default "W"  both are counted.