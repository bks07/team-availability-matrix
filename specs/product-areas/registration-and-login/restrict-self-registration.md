# Restrict self-registration

## STORY

**IN ORDER TO** control who can create accounts in the system
**AS** a super administrator
**I WANT TO** enable or disable self-registration for new users

## ACCEPTANCE CRITERIA

1. The super administrator can toggle self-registration between enabled and disabled from the administration area.
2. When self-registration is disabled, the registration tab is hidden on the login page.
3. When self-registration is disabled, any direct API call to the registration endpoint is rejected with a clear error message.
4. When self-registration is re-enabled, the registration tab reappears and new users can register.
5. Self-registration is enabled by default when the system is first set up.
6. Only users with the `super_admin` permission can change this setting.
7. The current status of the setting (enabled or disabled) is visible to the super administrator.

## IN-SCOPE

- Administration UI to toggle self-registration on or off.
- Backend setting persistence in the system settings table.
- Frontend check to show or hide the registration tab.
- Backend enforcement to reject registration when disabled.

## OUT-OF-SCOPE

- Invitation-based registration (invite links or codes).
- Registration approval workflows.
- Allowlists or denylists of e-mail domains.
- Rate limiting of registration attempts.

## ADDITIONAL INFORMATION

### API contract

```
GET  /api/settings/self-registration          → { "enabled": true|false }
PUT  /api/admin/settings/self-registration     → { "enabled": true|false }
```

The GET endpoint is public (needed by the login page to decide whether to show the register tab). The PUT endpoint requires `super_admin` permission.

### Default behaviour

If the `self_registration_enabled` key does not exist in the `system_settings` table, the system treats self-registration as enabled. This ensures the first user can always register.
