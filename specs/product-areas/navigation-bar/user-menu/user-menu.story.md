---
status: DONE
---

# User menu

## STORY

**IN ORDER TO** quickly access my profile-related actions and log out from anywhere in the application
**AS** an authenticated employee
**I WANT TO** see a user menu in the top-right corner of the navigation bar showing my name and profile photo

## ACCEPTANCE CRITERIA

1. A user-menu trigger is placed at the far right of the navigation bar.
2. The trigger displays the employee's profile photo (or a generated avatar if no photo is uploaded) and their display name.
3. Clicking the trigger opens a dropdown panel below the trigger.
4. The dropdown contains the following items in order:
   - **Profile** — navigates to the profile page.
   - **Change Password** — navigates to the change-password page (or section within the profile page).
   - A visual separator.
   - **Log out** — ends the session and redirects to the login page.
5. Clicking a navigation link closes the dropdown and navigates to the target page.
6. Clicking "Log out" clears the session, closes the dropdown, and redirects to the login page.
7. Clicking the trigger while the dropdown is open closes it.
8. Clicking outside the dropdown closes it without navigating.
9. Pressing Escape while the dropdown is open closes it.
10. The user menu is only visible to authenticated users; unauthenticated users do not see it.

## IN-SCOPE

- User-menu trigger with profile photo and display name.
- Dropdown panel with profile actions and log out.
- Generated avatar fallback when no profile photo exists.
- Open/close behaviour (click toggle, outside click, Escape).

## OUT-OF-SCOPE

- Navigation items not related to the user's own profile (those belong in the burger menu).
- Inline editing of profile fields from the dropdown.
- Notification badges on the user menu.

## ADDITIONAL INFORMATION

### Assumptions

- The navigation bar is rendered by `MainLayout` and is available on every authenticated page.
- The profile photo URL (or absence thereof) is available on the `currentUser` object from `AuthContext`.
- The generated avatar uses the employee's initials and a deterministic background colour.

### Dependencies

- Authentication and session management are available.
- Profile photo management is implemented (or the fallback avatar is used).
- Profile and change-password pages are routed.

### Validation scenarios

1. Authenticated user with a profile photo — the trigger shows the photo and display name.
2. Authenticated user without a profile photo — the trigger shows initials avatar and display name.
3. User clicks the trigger — dropdown opens with Profile, Change Password, separator, Log out.
4. User clicks "Profile" — navigated to the profile page, dropdown closes.
5. User clicks "Log out" — session cleared, redirected to login page.
6. User clicks outside the dropdown — it closes.
7. User presses Escape — dropdown closes.
8. Unauthenticated user — no user menu is visible.
