---
status: NEW
---

# Rebrush Administration / Locations Page

## WHAT

1. **Tool Card**: A tool card will be placed between the page title and the locations table. The tool card wraps all controls that currently sit above the table (e.g. the "Create Location" button or any inline form). The tool card follows the Toolbar Card pattern established in the availability matrix rebrush spec.

2. **Table Design**: The current layout will be replaced with a table using the `permission-table` class and styling defined in the settings page rebrush spec. The table will have the following columns:
   - **ID**: Displays the location's database ID.
   - **Name**: Displays the location name.
   - **Users**: Displays the count of users currently assigned to the location.
   - **Actions**: Contains action buttons (Edit, Delete).

3. **Icon Buttons**: Action buttons (Edit, Delete) will be rendered as icon symbols with hover alt-text, following the convention established in the user management rebrush spec.

4. **Deletion Confirmation Modal**: When the user clicks the Delete action on a location that has assigned users, a modal window shall appear. The modal contains:
   - A short note informing the user that users are currently assigned to this location.
   - An "Approve" button to confirm deletion.
   - A "Cancel" button to dismiss the modal without deleting.

   If the location has no assigned users, the existing confirmation behavior applies (no additional modal needed beyond standard confirmation).

## WHY

These changes improve visual consistency across the administration area:

- The tool card provides better visual orientation by grouping controls together, matching other admin pages.
- The table design aligns with Settings, Public Holidays, and Permission Management pages, ensuring a consistent look and feel.
- Icon buttons reduce visual clutter while maintaining accessibility through hover alt-text.
- The deletion confirmation modal prevents accidental data loss when a location has active user assignments, replacing the previous hard-block behavior with an informed user choice.

## ADDITIONAL INFORMATION

- **Toolbar Card pattern**: Refer to the availability matrix rebrush (`2026-04-01-004-rebrush-availability-matrix.rebrush.md`).
- **Table style**: Refer to the settings page rebrush (`2026-04-06-001-rebrush-settings-page.rebrush.md`).
- **Icon button convention**: Refer to the user management rebrush (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).
- Product-area story `remove-location.story.md` needs updating to reflect the new deletion behavior (confirmation modal instead of rejection for locations with assigned users).
- This rebrush is frontend-only; however, the deletion behavior change may require a backend adjustment to allow deleting locations with assigned users.
