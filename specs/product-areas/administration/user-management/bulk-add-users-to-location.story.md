---
status: DONE
---

# Bulk add users to a location

## STORY

**IN ORDER TO** assign multiple employees to the same location efficiently
**AS** admin user
**I WANT TO** bulk assign users to a location

## ACCEPTANCE CRITERIA

1. An admin user can select multiple existing users and assign them to a single location in one operation.
2. The admin user must select a target location before the bulk assignment can be completed.
3. Only existing users can be included in the bulk assignment.
4. Users included in the bulk assignment are updated so that the selected location becomes their current location.
5. After successful completion, all updated users reflect the new location wherever their assigned location is shown.
6. Non-admin users cannot bulk assign users to a location.
7. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Selecting multiple existing users for assignment.
- Assigning the selected users to one existing location in a single action.
- Validation that a target location is selected.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Creating, editing, or removing locations.
- Adding new users as part of the bulk assignment.
- Bulk unassignment of users from a location.
- Assigning different users to different locations in the same operation.
- Importing users from an external file.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- Users and locations already exist in the system.
- A user can have at most one assigned location at a time.

### Dependencies

- Admin role and permission model are available.
- User management is available so existing users can be selected.
- Location management is available so an existing location can be selected.

### Validation scenarios

1. Admin selects multiple users and a valid location — all selected users are assigned to the location successfully.
2. Admin attempts to complete the operation without selecting a location — operation is rejected with an error message.
3. Admin attempts to perform the operation without selecting any users — operation is rejected with an error message.
4. Non-admin user attempts to bulk assign users to a location — operation is denied.

