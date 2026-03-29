# Keyboard accessibility

## STORY

**IN ORDER TO** navigate the burger menu without a mouse
**AS** an authenticated employee
**I WANT TO** open, browse, and close the menu using only the keyboard

## ACCEPTANCE CRITERIA

1. The burger-menu icon is focusable via Tab and can be activated with Enter or Space.
2. When the menu opens, focus moves to the first focusable item inside the menu.
3. Arrow keys (Up / Down) move focus between menu items sequentially.
4. Enter or Space on a link navigates to the target page and closes the menu.
5. Enter or Space on a section heading toggles expand/collapse for that section.
6. Pressing Escape closes the menu and returns focus to the burger-menu icon.
7. Focus is trapped within the menu while it is open (Tab does not leave the panel).
8. All interactive elements have accessible labels (e.g. the icon button has `aria-label="Navigation menu"`).

## IN-SCOPE

- Keyboard-driven open, close, navigation, and activation.
- Focus trap while the menu is open.
- ARIA attributes for the toggle button and menu panel.

## OUT-OF-SCOPE

- Screen-reader announcements beyond standard ARIA roles and labels.
- Full WCAG AAA compliance audit.
- Touch gestures (swipe to open/close).

## ADDITIONAL INFORMATION

### Assumptions

- The menu panel uses appropriate ARIA roles (`navigation`, `menu`, `menuitem`, or equivalent landmark roles).
- Focus management follows WAI-ARIA best practices for disclosure navigation menus.

### Dependencies

- Burger menu core feature is implemented.

### Validation scenarios

1. User presses Tab until the burger icon is focused, then presses Enter — menu opens, focus moves to the first item.
2. User presses Down arrow — focus moves to the next menu item.
3. User presses Enter on "Availability Matrix" — navigated to `/workspace`, menu closes, focus returns to the burger icon.
4. User presses Escape — menu closes, focus returns to the burger icon.
5. User presses Tab repeatedly inside the menu — focus cycles within the menu and does not escape to the page behind.
