---
status: DONE
---

# Rebrush Availability Matrix

## What

This rebrush introduces several changes to the availability matrix UI and functionality:

1. **Toolbar Card**:
   - Convert the link directing to the selected team into a button for consistency with other toolbar buttons.
   - Remove the `Import CSV` button and the associated feature entirely.
   - Add a new button to access the legend for day values. This button will open a modal window and will be placed left of the "Export as CSV" button.

2. **Matrix Legend**:
   - Remove the legend between the toolbar card and the matrix card.
   - Ensure the toolbar card and matrix card are adjacent.

3. **Matrix Card**:
   - Remove the large empty space before the availability matrix table.
   - Update the date format in the left column to show only the day of the month and the 3-letter month abbreviation (e.g., `3 Mar`).
   - Add a new column titled "Day" to display the weekday name (e.g., `Mon`, `Wed`).

4. **Summary Row**:
   - Remove the summary row at the bottom of the table.
   - Add a new column titled "Working" to the right of the "Day" column. This column will display the count of `W`s in each row, centered and styled with a small monospace font.

## Why

These changes aim to improve the usability and visual consistency of the availability matrix. Removing unused features (e.g., `Import CSV`) and redundant elements (e.g., the legend between cards) simplifies the interface. Adding a modal for the legend and improving the table layout enhances user experience and clarity.

## Additional Information

- Dependencies: Ensure the modal component for the legend is implemented and styled consistently with the design system.
- Rollout Notes: These changes should be tested thoroughly to ensure no regressions in matrix functionality.