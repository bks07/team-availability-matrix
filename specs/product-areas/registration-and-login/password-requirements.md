# Password requirements

## STORY

**IN ORDER TO** protect my account with a strong credential
**AS** a user setting or changing my password
**I WANT TO** be guided by clear password complexity rules that are enforced consistently

## ACCEPTANCE CRITERIA

1. The password must be at least 8 characters long.
2. The password must be at most 64 characters long.
3. The password must contain at least one upper-case letter (A–Z).
4. The password must contain at least one lower-case letter (a–z).
5. The password must contain at least one digit (0–9).
6. The password must contain at least one special character (any character that is not a letter or digit).
7. If any rule is violated, the user receives a specific error message stating which rule failed.
8. The rules are enforced on registration and on password change.
9. The rules are validated on both the frontend (before submission) and the backend (before persistence).

## IN-SCOPE

- Defining the password complexity rules.
- Frontend validation with per-rule feedback.
- Backend validation with descriptive error messages.
- Applying the rules to registration and password change.

## OUT-OF-SCOPE

- Password strength meters or score indicators.
- Checking passwords against known-breached-password lists.
- Password expiry or rotation policies.
- Password history (preventing reuse of previous passwords).

## ADDITIONAL INFORMATION

### Validation rule summary

| Rule | Condition |
|------|-----------|
| Minimum length | ≥ 8 characters |
| Maximum length | ≤ 64 characters |
| Upper-case letter | at least one A–Z |
| Lower-case letter | at least one a–z |
| Digit | at least one 0–9 |
| Special character | at least one character that is not a letter or digit |

### Frontend behaviour

The registration and password-change forms should display the rules as a checklist or inline hints, with each rule visually marked as satisfied or unsatisfied as the user types.

### Backend behaviour

The backend rejects any password that does not meet all rules and returns an error message listing the unmet rules.
