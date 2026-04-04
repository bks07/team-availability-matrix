---
status: DONE
---

# Virtual-value visualization in the availability matrix

## STORY

**IN ORDER TO** distinguish at a glance which day statuses I or my teammates have explicitly set and which are schedule-derived defaults
**AS** an authenticated employee
**I WANT TO** see virtual values displayed with a dashed border in the availability matrix and explained in the legend modal

## ACCEPTANCE CRITERIA

1. A cell that displays a virtual value (no explicit entry stored) uses a dashed border instead of a solid background.
2. A cell that displays an explicitly stored status (W, V, or A) uses a solid background with no dashed border.
3. The legend modal includes a "Virtual values" section containing:
   - Example indicators for Working (W) and Absence (A) rendered with dashed borders.
   - Each indicator is labelled as an "assumed" value.
   - A hint text: "Values with a dashed border are not explicitly set. They are derived from the employee's work schedule and public holidays."
4. Virtual-value cells include an aria-label prefix "Virtual" so screen readers convey the distinction.

## IN-SCOPE

- Dashed-border styling for virtual-value cells in the availability matrix.
- "Virtual values" section and hint text inside the legend modal.
- Accessible aria-labels for virtual-value cells.

## OUT-OF-SCOPE

- Legend button placement in the matrix toolbar (covered by rebrush 2026-04-01-004-rebrush-availability-matrix).
- Virtual-value visualization in My Calendar (covered by "Enrich calendar with week numbers and status provenance" story).
- Virtual-value computation logic alignment between calendar and matrix (covered by bugfix spec).

## ADDITIONAL INFORMATION

### Assumptions

- The availability matrix view is implemented.
- Work schedule configuration is available per user.
- The legend modal component exists (from rebrush 2026-04-01-004).

### Dependencies

- Availability matrix view is implemented.
- Employee work schedule configuration is available.
- Legend modal exists.

### Validation scenarios

1. An employee has no explicit status on a working day — the cell shows "W" with a dashed border.
2. An employee has no explicit status on a non-working day — the cell shows "A" with a dashed border.
3. An employee explicitly sets "V" on a day — the cell shows "V" with a solid background (no dashed border).
4. The employee clears the "V" — the cell reverts to a virtual value with a dashed border.
5. The employee opens the legend — a "Virtual values" section explains dashed borders as schedule-derived defaults.
6. A screen reader reads a virtual-value cell — the aria-label includes "Virtual" before the status.