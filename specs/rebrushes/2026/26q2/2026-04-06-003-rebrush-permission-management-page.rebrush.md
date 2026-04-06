---
status: NEW
---

# Permission Management Page Rebrush

## WHAT

1. **Tab Navigation**: Replace the current `<button className="tab">` elements in the `<div className="tab-bar">` with proper tab components. The active tab must be visually distinct from inactive tabs (e.g., underline/highlight for active, visually receded for inactive). The tabs switch between: Profiles, User Assignments, Usage Report, and Audit Log.

2. **New Profile Modal with Toggle Switches**: The "New Profile" button shall be displayed in the same style as the "Create Team" button on the team management page. Clicking the button opens a modal window (replacing the current inline form). Inside the modal, the `<fieldset>`/`<legend>` grouping is removed and replaced with category headlines (e.g. "User Administration") followed by a structured table with three columns: permission name, permission description, and toggle status (toggle switch). The toggle switches use the toggle-slider component from the settings page rebrush. The same toggle-switch + structured-table pattern applies to the edit profile form as well. Note: the edit flow may remain inline (consistent with the team management rebrush which retains inline editing for existing items).

3. **Icon Buttons in Tables**: All text-based action buttons in the Profiles table (Edit, Delete) and the Users/User Assignments table (Change, Save, Cancel) are replaced with icon symbols with hover alt-text, following the convention from the user management rebrush.

4. **Tool Cards**: The filter inputs and action buttons in the Usage Report tab's toolbar area (profile name filter, user name filter, Apply Filters, Reset, Download CSV) and the Audit Log tab's toolbar area (event type select, date range, search, Apply, Reset, Download CSV) shall be wrapped in a tool card component, following the Toolbar Card pattern from the availability matrix rebrush. This gives better visual orientation between the tab switch and the data table.

## WHY

These changes improve visual consistency across the administration area and enhance usability. Proper tab navigation makes section switching clearer. Modal-based profile creation matches the established pattern from team management. Toggle switches are more intuitive than checkboxes. Icon buttons reduce visual clutter while maintaining accessibility. Tool cards provide clear visual boundaries for filter/toolbar areas.

## ADDITIONAL INFORMATION

- Tab navigation: No specific cross-reference (describe expected visual behavior only).
- "Create Team" button style and modal pattern: Refer to the team management rebrush (`2026-04-01-002-rebrush-team-management-page.rebrush.md`).
- Toolbar Card pattern: Refer to the availability matrix rebrush (`2026-04-01-004-rebrush-availability-matrix.rebrush.md`).
- Icon button convention: Refer to the user management rebrush (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).
- Toggle-slider component and `permission-table` class: Refer to the settings page rebrush (`2026-04-06-001-rebrush-settings-page.rebrush.md`).
- Product-area stories `create-permission-profile.story.md` and `edit-permission-profile.story.md` need updating to reflect the new UI patterns (toggle switches replacing checkboxes, modal replacing inline form).
- This rebrush is frontend-only; no API changes required.