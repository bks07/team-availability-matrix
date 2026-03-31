# Register account

## STORY

**IN ORDER TO** gain access to the team availability matrix
**AS** a new employee
**I WANT TO** register an account by providing my name, e-mail address, and a password

## ACCEPTANCE CRITERIA

1. The registration form collects exactly four fields: first name, last name, e-mail address, and password.
2. First name and last name are mandatory — the form cannot be submitted if either is empty or consists only of whitespace.
3. The e-mail address is mandatory, must be a valid e-mail format, and is stored in lowercase.
4. The password is mandatory and must satisfy the password requirements defined in the "Password requirements" story.
5. All text fields are trimmed of leading and trailing whitespace before submission.
6. If the e-mail address is already registered, the user receives a clear error message and the form is not submitted.
7. After successful registration the user is automatically logged in, a session is created, and the user is redirected to the workspace.
8. The registration tab is only visible when self-registration is enabled.

## IN-SCOPE

- Registration form with first name, last name, e-mail, and password fields.
- Frontend and backend validation of required fields.
- E-mail normalisation (trim + lowercase).
- Automatic login after successful registration.

## OUT-OF-SCOPE

- Title and middle name — these are maintained via the user profile after registration.
- Location assignment — set via the user profile after registration.
- Profile photo — managed via the user profile after registration.
- Password complexity rules — defined in the "Password requirements" story.
- Restricting who can register — defined in the "Restrict self-registration" story.
- First-user privilege escalation — defined in the "First user bootstrap" story.

## ADDITIONAL INFORMATION

### API contract

```json
POST /api/auth/register
{
  "email": "...",
  "password": "...",
  "firstName": "...",
  "lastName": "..."
}
```

### Dependencies

- Story "Password requirements" defines the password validation rules.
- Story "Structured name fields" defines the underlying data model for first name and last name.
- Story "Display name derivation" defines how the name appears after registration.
