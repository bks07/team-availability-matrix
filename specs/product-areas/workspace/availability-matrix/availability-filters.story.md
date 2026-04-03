---
status: DONE
---

# Availability filters

## STORY

**IN ORDER TO** focus on specific availability statuses within the team matrix
**AS** an authenticated employee
**I WANT TO** filter the availability matrix by status so that only relevant entries are visually emphasised

## ACCEPTANCE CRITERIA

1. Filter buttons for W (Working), V (Vacation), and A (Absence) are displayed in the workspace toolbar above the matrix.
2. Clicking a filter button visually highlights rows and columns matching the selected status while dimming non-matching entries.
3. Multiple filters can be active simultaneously, combining their effects.
4. A reset/clear button removes all active filters and restores the default unfiltered view.
5. Filters are applied entirely on the client side — no additional backend requests are made.
6. Filters are applied per team view and reset automatically when the user switches to a different team.
7. The filter state does not persist across page refreshes or sessions.

## IN-SCOPE

- Filter buttons in the workspace toolbar.
- Client-side filtering of the already-loaded matrix data.
- Visual feedback (highlight/dim) for filtered and non-filtered entries.
- Reset/clear filter functionality.

## OUT-OF-SCOPE

- Backend filter endpoints or server-side filtering.
- Filtering by date range, user, or other criteria beyond status.
- Persisting filter state across sessions or page refreshes.
- Advanced multi-criteria filter combinations.

## ADDITIONAL INFORMATION

### Assumptions

- The full matrix data for the current team and date range is already loaded in the browser.
- Users understand the meaning of W, V, and A statuses.

### Dependencies

- The availability matrix and its toolbar are implemented.
- Matrix data is fetched and rendered before filters can be applied.

### Validation scenarios

1. User clicks the "V" filter — rows with vacation entries are highlighted, others are dimmed.
2. User clicks both "V" and "A" — rows with either vacation or absence entries are highlighted.
3. User clicks the reset button — all filters are cleared and the matrix returns to its default view.
4. User applies a filter, then switches teams — the filter resets and the new team's data is shown unfiltered.
5. User applies a filter and refreshes the page — the filter is no longer active (no persistence).