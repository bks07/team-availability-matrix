---
status: DONE
---

# Active page indicator

## STORY

**IN ORDER TO** know where I am in the application when I open the menu
**AS** an authenticated employee
**I WANT TO** see the currently active page visually highlighted in the burger menu tree

## ACCEPTANCE CRITERIA

1. The menu link that corresponds to the current route is visually distinguished (e.g. bold text, accent colour, or a left-edge marker).
2. If the active page belongs to a collapsed section, that section is automatically expanded when the menu opens.
3. Only one link is highlighted at a time.
4. The highlight updates immediately when the user navigates to a different page and reopens the menu.
5. If the current route does not match any menu link (e.g. a sub-page not in the tree), no link is highlighted.

## IN-SCOPE

- Visual highlight of the active link.
- Auto-expanding the parent section of the active link.

## OUT-OF-SCOPE

- Breadcrumb trail showing the full navigation path.
- Highlighting multiple links simultaneously.

## ADDITIONAL INFORMATION

### Assumptions

- The current route is obtained from React Router's location.
- Route matching uses prefix or exact matching as appropriate for each link.

### Dependencies

- Burger menu core feature is implemented.

### Validation scenarios

1. User is on `/workspace` and opens the menu — "Availability Matrix" is highlighted and the Workspace section is expanded.
2. User is on `/admin/public-holidays` and opens the menu — "Public Holidays" is highlighted and the Administration section is expanded.
3. User navigates from `/workspace` to `/admin/locations`, then reopens the menu — highlight has moved to "Locations".
4. User is on `/profile` (a user-menu page not in the burger menu) — no link is highlighted.
