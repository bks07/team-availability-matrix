---
status: DONE
---

# Expand and Shrink Date Range

## STORY
- **IN ORDER TO** adjust the availability matrix to show a more relevant date range
- **AS** a user
- **I WANT TO** expand or shrink the displayed date range inline, with controls at the start and end of the table

## ACCEPTANCE CRITERIA
- Inline controls are provided to expand or shrink the displayed date range by 7 days at the start and end of the table.
- Start controls:
  - A row is displayed between the table header row and the first day row.
  - The row contains a "+" and a "−" control.
  - Clicking "+" adds 7 calendar days to the beginning of the table (start date moves 7 days earlier).
  - Clicking "−" removes 7 calendar days from the beginning of the table (start date moves 7 days later).
- End controls:
  - A row is displayed after the last day row, at the very bottom of the table.
  - The row contains a "+" and a "−" control.
  - Clicking "+" adds 7 calendar days to the end of the table (end date moves 7 days later).
  - Clicking "−" removes 7 calendar days from the end of the table (end date moves 7 days earlier).
- Synchronisation:
  - After any ± action, the toolbar card's start-date and end-date selectors update to reflect the new range.
- Display constraint:
  - Minimum displayed days: 1
  - Maximum displayed days: 360
  - When a ± action would violate the constraint, the offending control is disabled (greyed out, non-clickable). It must not silently clamp.
  - When the toolbar date selectors would result in a range violating the constraint, the selection is prevented or adjusted to the nearest valid value.
- Layout:
  - The ± control rows span the full width of the table (across all user columns).

## IN-SCOPE
- Inline controls for expanding and shrinking the date range.
- Synchronisation of toolbar date selectors with the table's displayed range.
- Enforcing minimum and maximum displayed day constraints.
- Handling year boundaries when expanding or shrinking the range.
- Ensuring existing matrix features (highlighting, bulk operations, status editing) work with the adjusted range.

## OUT-OF-SCOPE
- Backend API changes.
- Changes to the toolbar date selectors' visual design.
- Keyboard accessibility beyond what the matrix already provides.
- Changing the data-fetching strategy.

## ADDITIONAL INFORMATION

### Assumptions
- The toolbar card with start-date and end-date selectors already exists.
- Extending ±7 days at year boundaries may cross into data from a different year; the implementation must handle this transparently.
- All existing matrix features (highlighting, bulk operations, status editing) continue to work with the adjusted date range.

### Dependencies
- None.

### Validation scenarios
1. User clicks "+" at the start — 7 earlier days appear, toolbar start date updates.
2. User clicks "−" at the start — first 7 days are removed, toolbar start date updates.
3. User clicks "+" at the end — 7 later days appear, toolbar end date updates.
4. User clicks "−" at the end — last 7 days are removed, toolbar end date updates.
5. Range is at 1 day — both "−" controls are disabled.
6. Range is at 360 days — both "+" controls are disabled.
7. User modifies toolbar date selectors to exceed 360 days — selection is constrained.
8. User modifies toolbar date selectors to go below 1 day — selection is constrained.
9. Expanding across a year boundary — days from the adjacent year appear correctly with proper highlighting (weekends, holidays, today).
10. After ± action, existing features (status editing, bulk change, highlighting) work on the newly visible days.