---
status: DONE
---

# Permission management

## STORY

**IN ORDER TO** control exactly which user can do what
**AS** super admin user
**I WANT TO** manage the permissions for each user

## ACCEPTANCE CRITERIA

1. A super admin user can view the current permissions assigned to any user.
2. A super admin user can grant or revoke individual permissions for a user.
3. Permission changes take effect immediately for the affected user.
4. A super admin user cannot remove their own super admin permission.
5. Only super admin users can manage permissions; admin and regular users cannot.
6. The super admin user receives clear feedback on success or failure of each permission change.
7. Existing capabilities unrelated to permission management continue to work as before for all users.

## IN-SCOPE

- Viewing the permissions of a given user.
- Granting individual permissions to a user.
- Revoking individual permissions from a user.
- Preventing self-removal of the super admin permission.
- Restricting access to super admin users only.
- Feedback to the super admin user on success or failure.

## OUT-OF-SCOPE

- Creating, editing, or deleting user accounts.
- Defining new permission types or roles.
- Bulk permission changes across multiple users at once.
- Permission inheritance or role hierarchies.
- Audit logging of permission changes.

## ADDITIONAL INFORMATION

### Assumptions

- A super admin role exists and is distinct from the admin role and the regular user role.

### Dependencies

- User accounts and roles are available.
- A permission model with assignable permissions exists.

### Validation scenarios

1. Super admin grants a permission to a user — permission is applied and visible immediately.
2. Super admin revokes a permission from a user — permission is removed and the change is reflected immediately.
3. Super admin attempts to remove their own super admin permission — operation is denied.
4. Admin user attempts to manage permissions — operation is denied.
5. Regular user attempts to manage permissions — operation is denied.

