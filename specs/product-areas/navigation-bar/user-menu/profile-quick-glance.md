---
status: DONE
---

# Profile quick glance

## STORY

**IN ORDER TO** verify my account details at a glance without navigating away from my current page
**AS** an authenticated employee
**I WANT TO** see a summary of my key profile information at the top of the user-menu dropdown

## ACCEPTANCE CRITERIA

1. When the user-menu dropdown opens, its header area displays a larger version of the employee's profile photo (or initials avatar).
2. Below the photo the header shows the employee's display name and email address.
3. The header section is visually separated from the menu action items below it.
4. Clicking the header area navigates to the profile page and closes the dropdown (acts as a shortcut to "Profile").
5. The information shown updates immediately if the employee has just changed their display name, email, or photo.

## IN-SCOPE

- Profile photo, display name, and email in the dropdown header.
- Clickable header navigating to the profile page.

## OUT-OF-SCOPE

- Editing profile fields directly from the dropdown.
- Displaying sensitive information (e.g. password hint, permissions).

## ADDITIONAL INFORMATION

### Assumptions

- The `currentUser` object in `AuthContext` contains `displayName`, `email`, and a profile photo URL.

### Dependencies

- User menu core feature is implemented.

### Validation scenarios

1. User with photo, name "Jane Doe", email "jane@example.com" opens the dropdown — all three are visible in the header.
2. User without a profile photo — initials avatar is shown at the larger size.
3. User clicks the header — navigated to the profile page, dropdown closes.
4. User updates their display name, then reopens the dropdown — the new name appears.
