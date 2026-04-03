---
status: DONE
---

# Change password

## STORY

**IN ORDER TO** keep my account secure
**AS** authenticated user
**I WANT TO** change my password

## ACCEPTANCE CRITERIA

1. An authenticated user can change their own password from the user profile area.
2. The user must provide their current password before a new password can be saved.
3. The new password must meet the application's password requirements.
4. The user must confirm the new password, and mismatched confirmation is rejected with a clear error message.
5. After a successful password change, the new password is required for future logins.
6. Changes apply only to the authenticated user's own account and cannot be used to change another user's password.
7. The user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Changing the authenticated user's own password.
- Verification of the current password.
- Validation of the new password and confirmation.
- Feedback to the user on success or failure.

## OUT-OF-SCOPE

- Password reset for users who forgot their password.
- Administrative password resets.
- Editing other profile information.
- Multi-factor authentication or additional security factors.
- Session management after password change.

## ADDITIONAL INFORMATION

### Assumptions

- An authenticated user knows their current password.
- Password rules already exist in the application.
- Passwords are stored securely and never shown back to the user.

### Dependencies

- Authentication flow is available.
- Password validation rules are available.
- Backend support exists to verify the current password and persist the new password securely.

### Validation scenarios

1. Authenticated user enters the correct current password and a valid new password with matching confirmation — password is changed successfully.
2. Authenticated user enters an incorrect current password — operation is rejected with an error message.
3. Authenticated user enters a new password that does not meet password rules — operation is rejected with an error message.
4. Authenticated user enters a confirmation that does not match the new password — operation is rejected with an error message.
5. Authenticated user attempts to change another user's password — operation is denied.