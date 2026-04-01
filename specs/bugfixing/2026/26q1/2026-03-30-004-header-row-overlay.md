---
status: DONE
---

# Header row in tables in administration area overlays first row of table body

## CURRENT BEHAVIOR

When navigating to `Administration/Users` or `Administration/Permissions`, the tables that list the users are displayed incorrectly.
The header row of the table overlays the first row of the table body.

## EXPECTED BEHAVIOR

When navigating to `Administration/Users` or `Administration/Permissions`, the table header should remain clearly separated from the table body.

The first row of user data should be fully visible and accessible.


## IMPACT

- Admin users cannot reliably view or edit the first user in the list.
- The issue affects key administration workflows, including user management and permission management.
- Critical controls in the first row may be partially hidden or difficult to interact with.
- This reduces usability and can cause mistakes when managing users.

## STEPS TO REPRODUCE

1. Log in as an admin user.
2. Navigate to user management page.
3. Observe that the header row of the table that lists the users is placed over the first row of the table body.

## ADDITIONAL INFORMATION

The issue is visible in at least these administration pages:

- `Administration/Users`
- `Administration/Permissions`

The problem is visual and interaction-related: the first data row is obstructed by the header row.

