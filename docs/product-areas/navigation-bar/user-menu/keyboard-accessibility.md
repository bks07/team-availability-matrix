# User menu keyboard accessibility

## STORY

**IN ORDER TO** use the user menu without a mouse
**AS** an authenticated employee
**I WANT TO** open, browse, and close the user-menu dropdown using only the keyboard

## ACCEPTANCE CRITERIA

1. The user-menu trigger is focusable via Tab and can be activated with Enter or Space.
2. When the dropdown opens, focus moves to the first focusable item inside it.
3. Arrow keys (Up / Down) move focus between dropdown items sequentially.
4. Enter or Space on a link navigates to the target page and closes the dropdown.
5. Enter or Space on "Log out" executes the log-out action.
6. Pressing Escape closes the dropdown and returns focus to the trigger.
7. Focus is trapped within the dropdown while it is open (Tab does not leave the panel).
8. The trigger button has `aria-haspopup="true"` and `aria-expanded` reflecting the dropdown state.
9. The dropdown and its items use appropriate ARIA roles (`menu`, `menuitem`).

## IN-SCOPE

- Keyboard-driven open, close, navigation, and activation.
- Focus trap while the dropdown is open.
- ARIA attributes for the trigger and dropdown.

## OUT-OF-SCOPE

- Screen-reader announcements beyond standard ARIA roles and labels.
- Full WCAG AAA compliance audit.

## ADDITIONAL INFORMATION

### Assumptions

- The implementation follows WAI-ARIA best practices for menu buttons.

### Dependencies

- User menu core feature is implemented.

### Validation scenarios

1. User presses Tab until the user-menu trigger is focused, then presses Enter — dropdown opens, focus moves to the first item.
2. User presses Down arrow — focus moves to the next item.
3. User presses Enter on "Profile" — navigated to the profile page, dropdown closes.
4. User presses Escape — dropdown closes, focus returns to the trigger.
5. User presses Tab inside the dropdown — focus cycles within and does not escape to the page behind.
