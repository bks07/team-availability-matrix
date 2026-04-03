---
status: DONE
---

# Toolbar period selector

## STORY

**IN ORDER TO** control which date range the availability matrix displays
**AS** an authenticated employee
**I WANT TO** use a toolbar above the matrix with start-date and end-date selectors, team information, and quick controls

## ACCEPTANCE CRITERIA

1. A toolbar card is displayed above the availability matrix.
2. The toolbar contains a start-date input and an end-date input for selecting the displayed period.
3. Changing either date input immediately updates the matrix to show the new date range.
4. The displayed date range is constrained between a minimum of 1 day and a maximum of 360 days.
5. If a date input change would violate the constraint, the value is adjusted to the nearest valid date.
6. The toolbar displays the name of the currently selected team.
7. The toolbar includes a button or link to navigate to the team detail page.
8. Filter controls (W, V, A status filters) are integrated into the toolbar.
9. The export button is accessible from the toolbar.
10. The toolbar is always visible when the availability matrix is displayed, regardless of scrolling.

## IN-SCOPE

- Start-date and end-date input controls.
- Date range constraint enforcement (1–360 days).
- Team name display and navigation link.
- Integration point for filter and export controls.
- Synchronisation between toolbar date inputs and the matrix display.

## OUT-OF-SCOPE

- The filter logic itself (covered by availability-filters.story.md).
- The export logic itself (covered by export-matrix.story.md).
- The ±7 day expand/shrink controls (covered by expand-and-shrink-date-range.story.md).
- Visual design or layout of the toolbar beyond functional requirements.

## ADDITIONAL INFORMATION

### Assumptions

- The toolbar is rendered as part of the WorkspaceLayout component.
- Date inputs use the native HTML date input type.
- The default date range on initial load covers a reasonable period (e.g. the current month or a predefined window).

### Dependencies

- The availability matrix is implemented.
- Team selection and switching are available.
- The date range state is managed in the parent layout component.

### Validation scenarios

1. User changes the start date to an earlier date — the matrix expands to show the new range.
2. User changes the end date to a later date — the matrix extends accordingly.
3. User sets a range exceeding 360 days — the end date is automatically adjusted to stay within the constraint.
4. User sets the start date after the end date — the range is adjusted to maintain at least 1 day.
5. The toolbar shows the correct team name after switching teams via the team selector.
6. User clicks the team detail link — navigated to the team detail page.