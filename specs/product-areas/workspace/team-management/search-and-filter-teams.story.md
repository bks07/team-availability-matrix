---
status: DONE
---

# Search and filter teams

## STORY

**IN ORDER TO** quickly find a specific team in a growing list
**AS** an authenticated employee
**I WANT TO** search and filter my teams by name, description, and owner

## ACCEPTANCE CRITERIA

### Toolbar

1. A toolbar card is displayed above the teams table on the My Teams page.
2. The toolbar follows the same visual style as the Administration // User Management toolbar.
3. The toolbar contains a single text search input and a clear/reset control.

### Search

4. The search input accepts free text and filters the table rows in real time as the user types (debounced, ~300 ms).
5. The search matches against the **Name**, **Description**, and **Owner** columns simultaneously (logical OR across columns).
6. The match is case-insensitive and supports partial/substring matching.
7. If no rows match the current search term, a "No teams match your search" empty state is shown in the table body.

### Reset

8. A visible clear button (e.g. an "×" icon inside the search input or a "Reset" button) removes the search term and restores the full list.
9. When the search input is empty, the clear button is hidden or disabled.

### Interaction with sorting and favorites

10. Search filtering is applied before sorting — the sorted order is maintained on the filtered subset.
11. Favorite indicators remain visible and functional on filtered rows.

### Accessibility

12. The search input has an accessible label (e.g. `aria-label="Search teams"`).
13. The number of visible results is announced to screen readers when the filtered count changes (e.g. via `aria-live` region).

## IN-SCOPE

- Text search input in a toolbar above the table.
- Client-side filtering by Name, Description, and Owner.
- Real-time (debounced) filtering.
- Clear/reset control.
- Accessible labelling.

## OUT-OF-SCOPE

- Server-side search or filtering.
- Advanced filter controls (dropdowns, date pickers, multi-select).
- Saving or bookmarking search queries.
- Searching teams the user does not belong to.

## ADDITIONAL INFORMATION

### Assumptions

- The teams data is already loaded client-side (same data set used by the table).
- Filtering is purely a frontend concern — no additional backend endpoint is needed.

### Dependencies

- view-my-teams (table layout must exist for the toolbar to sit above).

### Validation scenarios

1. Employee types "back" in the search input — only teams whose name, description, or owner contains "back" (case-insensitive) are shown.
2. Employee clears the search — full team list is restored.
3. Employee searches with no matches — "No teams match your search" message appears.
4. Employee searches while favorites-first sort is active — filtered results maintain the favorites-first order.
5. Screen reader announces "3 teams found" when the filter narrows the list to 3 rows.
