---
status: DONE
---

# Configure self-registration

## STORY

**IN ORDER TO** control whether new users can register themselves or must be added by an administrator
**AS** super admin user
**I WANT TO** enable or disable self-registration

## ACCEPTANCE CRITERIA

1. A super admin user can toggle self-registration on or off.
2. When self-registration is enabled, unauthenticated users can register themselves via the registration page.
3. When self-registration is disabled, the registration page is not accessible and registration attempts are rejected with a clear error message.
4. When self-registration is disabled, only admin users can add new users.
5. The current self-registration setting is clearly visible to the super admin.
6. The setting change takes effect immediately.
7. Non-super-admin users cannot change the self-registration setting.
8. The super admin receives clear feedback on success or failure of the operation.

## IN-SCOPE

- A system-level setting to enable or disable self-registration.
- Toggling the setting as a super admin.
- Enforcing the setting on the registration endpoint and page.
- Displaying the current setting to the super admin.
- Feedback to the super admin on success or failure.
- Restricting access to super admin users only.

## OUT-OF-SCOPE

- Approval workflows for self-registered users.
- Invitation-based registration.
- Configuring which fields are required during self-registration.
- Rate limiting or CAPTCHA on the registration page.
- Bulk user import as an alternative to self-registration.

## ADDITIONAL INFORMATION

### Assumptions

- A super admin role exists and can be distinguished from regular admin and regular users.
- Self-registration is enabled by default to preserve backward compatibility.
- The setting is system-wide and applies to all users equally.

### Dependencies

- Super admin role and permission model are available.
- The registration endpoint and page already exist.

### Validation scenarios

1. Super admin disables self-registration — the registration page is no longer accessible and registration attempts are rejected.
2. Super admin enables self-registration — the registration page is accessible and new users can register.
3. The current setting is displayed correctly to the super admin.
4. Admin user (non-super-admin) attempts to change the setting — operation is denied.
5. Regular user attempts to change the setting — operation is denied.
