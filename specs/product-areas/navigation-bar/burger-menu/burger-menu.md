# Burger menu

## STORY

**IN ORDER TO** quickly navigate to any feature in the application from anywhere
**AS** an authenticated employee
**I WANT TO** open a burger menu at the top-left of the navigation bar that shows a tree-structured list of links to all pages I have access to

## ACCEPTANCE CRITERIA

1. A burger-menu icon (☰) is placed at the very top-left of the navigation bar, before the logo.
2. Clicking the icon opens a side panel (or overlay) showing a tree-structured navigation list.
3. Clicking the icon again, or clicking outside the panel, closes it.
4. The tree is organised into collapsible top-level sections with nested page links:
   - **Workspace**
     - Availability Matrix → `/workspace`
     - My Calendar → `/my-calendar`
   - **Teams**
     - My Teams → `/teams`
   - **Administration** *(visible only to users with the `admin` permission)*
     - Locations → `/admin/locations`
     - Public Holidays → `/admin/public-holidays`
     - Users → `/admin/users` *(visible only with `admin`)*
     - Permissions → `/admin/permissions` *(visible only with `super_admin`)*
     - Settings → `/admin/settings` *(visible only with `super_admin`)*
5. Top-level sections are expanded by default on first open.
6. Clicking a page link navigates to that page and closes the menu.
7. The menu does not contain items already covered by the user menu (Profile, Log out).
8. The menu is only visible to authenticated users; unauthenticated users do not see the burger icon.

## IN-SCOPE

- Burger-menu toggle button in the navigation bar.
- Tree-structured navigation panel with sections and nested links.
- Opening, closing, and navigating via the menu.
- Section expand/collapse behaviour.

## OUT-OF-SCOPE

- Reordering or customising menu items.
- Search or filtering within the menu.
- Drag-and-drop of menu items.
- Displaying the menu on the login page.

## ADDITIONAL INFORMATION

### Assumptions

- The navigation bar already exists and is rendered by `MainLayout`.
- The tree structure mirrors the application's route hierarchy.
- New pages added in the future will require a corresponding menu entry.

### Dependencies

- Authentication and session management are available.
- All target pages are routed and guarded as appropriate.

### Validation scenarios

1. Authenticated user clicks the burger icon — the menu panel opens showing Workspace and Teams sections.
2. User clicks a link (e.g. "Availability Matrix") — navigated to `/workspace`, menu closes.
3. User clicks outside the menu — the menu closes without navigation.
4. User clicks the burger icon while the menu is open — the menu closes.
5. Unauthenticated user on the login page — no burger icon is visible.
