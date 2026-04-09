---
status: DONE
---

# Rebrush Buttons inside Administration / Permission Management

## WHAT

Replace the remaining plain-text toolbar buttons in the Permission Management page with icon symbols. Each symbol retains the original label as hover alt-text. Two labels are also renamed.

### User Assignments Tab

Inside the toolbar card, the following button is still rendered as plain text and shall be converted to an icon symbol with hover alt-text:

| Current Label | Alt-Text |
|---|---|
| Clear Filters | Clear Filters |

### Usage Report Tab

Inside the toolbar card, the following buttons are still rendered as plain text and shall be converted to icon symbols with hover alt-text:

| Current Label | Alt-Text |
|---|---|
| Apply Filters | Apply Filters |
| Reset | Clear Filters |
| Download CSV | Download CSV |

The button currently labelled "Reset" shall use the alt-text "Clear Filters".

### Audit Log Tab

Inside the toolbar card, the following buttons are still rendered as plain text and shall be converted to icon symbols with hover alt-text:

| Current Label | Alt-Text |
|---|---|
| Apply | Apply Filters |
| Reset | Clear Filters |
| Download CSV | Download CSV |

The button currently labelled "Apply" shall use the alt-text "Apply Filters". The button currently labelled "Reset" shall use the alt-text "Clear Filters".

## WHY

The previous permission management page rebrush converted structural layout, modals, and table action buttons to icon symbols, but the toolbar-card filter/action buttons in the User Assignments, Usage Report, and Audit Log tabs were left as plain text. This creates a visual inconsistency with other administration pages (Public Holidays, Locations) where toolbar-card buttons have already been converted to icon symbols. Renaming "Reset" to "Clear Filters" and "Apply" to "Apply Filters" aligns the alt-text labels across all tabs for a consistent user experience.

## ADDITIONAL INFORMATION

- **Icon button convention**: Refer to the user management rebrush (`2026-04-01-001-rebrush-user-management-page.rebrush.md`).
- **Previous permission management rebrush**: Refer to `2026-04-06-003-rebrush-permission-management-page.rebrush.md` (status: DONE).
- **Toolbar card pattern**: Refer to the availability matrix rebrush (`2026-04-01-004-rebrush-availability-matrix.rebrush.md`).
- This rebrush is frontend-only; no API changes required.
