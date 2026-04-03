---
status: DONE
---

# False DONE status on unimplemented stories

## CURRENT BEHAVIOR

Six product-area stories had their YAML frontmatter status set to `DONE` despite having no corresponding implementation in the codebase:

1. `registration-and-login/account-lockout.story.md` — No lockout logic exists in the backend. No login attempt tracking or lockout table in the database.
2. `registration-and-login/captcha.story.md` — No captcha integration exists. No reCAPTCHA or similar dependency.
3. `registration-and-login/forgot-password.story.md` — No password reset flow exists. No reset token table, no email sending capability.
4. `registration-and-login/multi-factor-authentication.story.md` — No MFA exists. No TOTP/authenticator support, no MFA secrets table.
5. `workspace/availability-matrix/availability-notifications.story.md` — No notification system exists. No notifications table, no email infrastructure.
6. `workspace/availability-matrix/availability-summary.story.md` — No summary chart or table exists. No backend endpoint for aggregated summary data.

## EXPECTED BEHAVIOR

Stories should only be marked `DONE` when the described feature is implemented and verified. Unimplemented features should be marked `NEW`.

## RESOLUTION

All six stories have been corrected from `status: DONE` to `status: NEW` as part of the product-area audit on 2026-04-03.

## ROOT CAUSE

These stories were likely created with placeholder content and given `DONE` status without verification against the actual codebase. Several of them are low-quality stubs with vague acceptance criteria, suggesting they were not written based on implemented features.

## IMPACT

Misleading status information could cause stakeholders to believe these features are available when they are not, leading to incorrect planning decisions or user-facing confusion.