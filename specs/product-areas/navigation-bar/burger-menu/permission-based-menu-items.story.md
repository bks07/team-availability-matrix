---
status: DONE
---

# Permission-based menu items

## STORY

**IN ORDER TO** avoid confusion from seeing links to pages I cannot access
**AS** an authenticated employee
**I WANT TO** see only the menu items that match my current permissions

## ACCEPTANCE CRITERIA

1. The **Workspace** section is visible to every authenticated user.
2. The **Administration** section is visible only to users who hold the `admin` permission.
3. Within Administration, the **Users** link is visible only to users with the `admin` permission.
4. Within Administration, the **Permissions** and **Settings** links are visible only to users with the `super_admin` permission.
5. If a section would be empty after permission filtering, the entire section heading is hidden.
6. Permission checks use the permissions stored in the current session (same source as route guards).
7. When a user's permissions change (e.g. admin grants a new permission), the menu reflects the change after the next login or session refresh.

## IN-SCOPE

- Conditional rendering of sections and links based on user permissions.
- Hiding empty sections entirely.

## OUT-OF-SCOPE

- Showing disabled/greyed-out links for inaccessible pages.
- Real-time permission updates without re-authentication.

## ADDITIONAL INFORMATION

### Assumptions

- Permissions are available on the `currentUser` object provided by `AuthContext`.
- The permission values used are `admin` and `super_admin`.

### Dependencies

- Burger menu core feature is implemented.
- Permission model and auth context are available.

### Validation scenarios

1. Regular user (no special permissions) opens the menu — sees Workspace only; no Administration section.
2. Admin user opens the menu — sees Workspace and Administration with Locations, Public Holidays, and Users.
3. Super-admin opens the menu — sees all items including Permissions and Settings.
4. Admin without `super_admin` opens the menu — does not see Permissions or Settings.
