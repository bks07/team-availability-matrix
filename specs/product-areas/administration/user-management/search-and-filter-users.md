---
status: DONE
---

---
status: DONE
---
# Search and Filter Users

## STORY

**IN ORDER TO** quickly find and manage specific users
**AS** an admin user
**I WANT TO** search for users by name and filter users by location

## ACCEPTANCE CRITERIA

1. An admin user can search for users by entering a partial or full name in a search bar.
2. The search results update dynamically as the admin types.
3. An admin user can filter users by location using a dropdown menu.
4. The location filter lists all available locations.
5. The search and filter options can be used together to narrow down results.
6. The user table updates to show only the matching users.
7. Non-admin users cannot access the search and filter functionality.

## IN-SCOPE

- Search bar for user names.
- Location filter dropdown.
- Dynamic updates to the user table based on search and filter criteria.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Searching or filtering by other criteria (e.g., email, role).
- Bulk actions on filtered results.
- Saving search or filter preferences.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Locations are already managed in the system and can be listed in the filter dropdown.

### Dependencies

- Admin role and permission model are available.
- Location management is available for filtering.

### Validation scenarios

1. Admin enters a partial name in the search bar — the table updates to show matching users.
2. Admin selects a location from the filter dropdown — the table updates to show users in that location.
3. Admin uses both search and filter together — the table updates to show users matching both criteria.
4. Non-admin user attempts to access the search or filter functionality — operation is denied.