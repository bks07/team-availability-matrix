# Log in

## STORY

**IN ORDER TO** access my team's availability data
**AS** a registered employee
**I WANT TO** log in with my e-mail address and password

## ACCEPTANCE CRITERIA

1. The login form collects two fields: e-mail address and password.
2. Both fields are mandatory — the form cannot be submitted if either is empty.
3. The e-mail address lookup is case-insensitive and ignores leading/trailing whitespace.
4. If the credentials are valid, a session is created and the user is redirected to the workspace.
5. If the credentials are invalid, a generic error message is shown that does not reveal whether the e-mail or the password was incorrect.
6. The login tab is always visible, regardless of the self-registration setting.
7. If the user already has an active session, they are redirected to the workspace without showing the login form.

## IN-SCOPE

- Login form with e-mail and password fields.
- Credential verification against stored password hash.
- Session creation (JWT issuance, stored client-side).
- Redirect to workspace on success.
- Generic error message on failure.

## OUT-OF-SCOPE

- "Forgot password" / password reset flow.
- Multi-factor authentication.
- Account lockout after failed attempts.
- "Remember me" / session duration preferences.
- OAuth or third-party identity providers.

## ADDITIONAL INFORMATION

### API contract

```json
POST /api/auth/login
{
  "email": "...",
  "password": "..."
}
```

### Response

```json
{
  "token": "...",
  "user": {
    "id": 1,
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "permissions": [...]
  }
}
```

### Security notes

- Passwords are verified using Argon2.
- The JWT contains only the user ID and expiration — permissions are fetched from the database on each request.
- Token lifetime is 7 days.
