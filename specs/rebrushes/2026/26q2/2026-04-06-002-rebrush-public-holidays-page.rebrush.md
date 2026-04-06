---
status: DONE
---

# Rebrush Administration / Public Holidays Page

## WHAT

This rebrush introduces the following changes to the Public Holidays page:

1. **Tool Card**: A tool card will wrap the add-holiday form and the location filter dropdown. This card will be placed between the page title (`<h2>Public Holiday Management</h2>`) and the holiday table. The tool card will follow the "Toolbar Card" pattern established in the availability matrix rebrush spec.

2. **Table Design**: The current `entity-list`/`entity-row` layout will be replaced with a table. The table will have the following columns:
   - **Date**: Displays the holiday date.
   - **Name**: Displays the holiday name.
   - **Location**: Displays the holiday location.
   - **Actions**: Contains action buttons (Edit, Delete, Save, Cancel).

   The table will use the `permission-table` class and styling defined in the settings page rebrush spec.

3. **Icon Buttons**: Action buttons (Edit, Delete, Save, Cancel) will be rendered as icon symbols with hover alt-text. This follows the convention established in the user management rebrush spec.

## WHY

These changes aim to improve visual consistency and usability across the application:

- The tool card provides better visual orientation for users by grouping related controls together.
- The table design aligns with the settings page, ensuring a consistent look and feel across administrative pages.
- Icon buttons reduce visual clutter while maintaining accessibility through hover alt-text.

## ADDITIONAL INFORMATION

- **Tool Card Pattern**: Refer to the availability matrix rebrush spec (`2026-04-01-004-rebrush-availability-matrix.rebrush.md`).
- **Table Style**: Refer to the settings page rebrush spec (`2026-04-06-001-rebrush-settings-page.rebrush.md`).
- **Icon Button Convention**: Refer to the user management rebrush spec (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).

This rebrush is frontend-only and does not require any API changes.