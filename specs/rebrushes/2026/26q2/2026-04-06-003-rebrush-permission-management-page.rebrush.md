---
status: DONE
---

# Permission Management Page Rebrush

## WHAT

1. **Tab Navigation**: Replace the current `<button className="tab">` elements in the `<div className="tab-bar">` with proper tab components. The active tab must be visually distinct from inactive tabs (e.g., underline/highlight for active, visually receded for inactive). The tabs switch between: Profiles, User Assignments, Usage Report, and Audit Log.

2. **New Profile Modal with Toggle Switches**: The "New Profile" button shall be displayed in the same style as the "Create User" button on the user management page. Clicking the button opens a modal window (replacing the current inline form). Inside the modal, everything below the "Profile Name" input field shall be scrollable so that all permissions are accessible regardless of screen height. Two buttons ("Create" and "Cancel") shall appear at the top of the modal, directly below the modal headline. Inside the modal, the `<fieldset>`/`<legend>` grouping is removed and replaced with category headlines (e.g. "User Administration") followed by a structured table with three columns: permission name, permission description, and toggle status (toggle switch). The toggle switches use the toggle-slider component from the settings page rebrush.

3. **Edit Profile via Modal**: Clicking the edit button for an existing profile shall open a modal window identical to the create-profile modal. The only differences are: the headline reads "Edit Permission Profile", and the "Create" button is replaced with an "Update" button. The same scrollable layout, button placement, and toggle-switch structured-table pattern apply.

4. **Built-in Tag**: The Super Admin profile has a "Built-in" indicator. This indicator shall be styled as a tag with a smaller font size and a green colored background. The tag shall have a small horizontal space between it and the profile name text.

5. **Icon Buttons and Spacing in Profiles Table**: All text-based action buttons in the Profiles table (Edit, Delete) are replaced with icon symbols with hover alt-text, following the convention from the user management rebrush. The spacing between action buttons inside the Profiles table shall match the spacing used in the Team Management table.

6. **User Assignments Tool Card**: The User Assignments tab shall display a tool card at the top of the content area, above the user table. The tool card contains filter input fields for: user name, user email address, and current profile (dropdown). A "Clear Filters" button resets all filter inputs. All input fields, dropdowns, and buttons inside the tool card shall be styled consistently with the Public Holiday Management page.

7. **User Assignments Table Pagination**: The User Assignments table shall be paginated. Inside the tool card, the user can select how many results to display per page. Available page sizes are: 10, 25, 50, and 100.

8. **User Assignments Profile Dropdown**: Changing a user's profile assignment shall use a dropdown displayed inside the "Current Profile" column cell. The dropdown is pre-selected with the user's current profile. This replaces the previous Change/Save/Cancel button pattern.

9. **Icon Buttons in User Assignments Table**: Remaining text-based action buttons in the User Assignments table are replaced with icon symbols with hover alt-text, following the convention from the user management rebrush.

10. **Tool Cards for Usage Report and Audit Log**: The filter inputs and action buttons in the Usage Report tab's toolbar area (profile name filter, user name filter, Apply Filters, Reset, Download CSV) and the Audit Log tab's toolbar area (event type select, date range, search, Apply, Reset, Download CSV) shall be wrapped in a tool card component, following the Toolbar Card pattern from the availability matrix rebrush.

11. **General Styling Consistency**: All buttons, dropdown fields, and other input fields inside the toolbar cards of all permission management sub-pages shall be designed in line with the Public Holiday Management page.

## WHY

These changes improve visual consistency across the administration area and enhance usability. Proper tab navigation makes section switching clearer. Modal-based profile creation and editing matches the established pattern from user management. Toggle switches are more intuitive than checkboxes. Icon buttons with consistent spacing reduce visual clutter while maintaining accessibility. The Built-in tag makes the system profile visually distinct at a glance. Tool cards and filter inputs in User Assignments provide clear visual boundaries and make it easier to find specific users. Pagination prevents performance issues and cognitive overload with many users. Inline profile dropdowns streamline the assignment workflow for administrators.

## ADDITIONAL INFORMATION

- Tab navigation: No specific cross-reference (describe expected visual behavior only).
- "Create User" button style and modal pattern: Refer to the user management rebrush (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).
- Toolbar Card pattern: Refer to the availability matrix rebrush (`2026-04-01-004-rebrush-availability-matrix.rebrush.md`).
- Icon button convention: Refer to the user management rebrush (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).
- Toggle-slider component and `permission-table` class: Refer to the settings page rebrush (`2026-04-06-001-rebrush-settings-page.rebrush.md`).
- Action button spacing: Refer to the team management rebrush (`2026-04-01-002-rebrush-team-management-page.rebrush.md`).
- Public Holiday Management page styling: Refer to the public holidays page rebrush (`2026-04-06-002-rebrush-public-holidays-page.rebrush.md`).
- Product-area stories `create-permission-profile.story.md`, `edit-permission-profile.story.md`, `view-permission-profiles.story.md`, and `assign-profile-to-user.story.md` need updating to reflect the new UI patterns.
- This rebrush is frontend-only; no API changes required.
