---
status: DONE
---

# Close behaviour

## STORY

**IN ORDER TO** dismiss the menu quickly and predictably when I am done with it
**AS** an authenticated employee
**I WANT TO** have the burger menu close automatically in all expected situations

## ACCEPTANCE CRITERIA

1. Clicking a page link inside the menu closes the menu and navigates to the target page.
2. Clicking the burger-menu icon while the menu is open closes it without navigating.
3. Clicking anywhere outside the menu panel closes it without navigating.
4. Pressing the Escape key closes the menu.
5. Navigating programmatically (e.g. browser back/forward) closes the menu if it is open.
6. After the menu closes, the page behind it is fully interactive again (no leftover overlay blocking clicks).

## IN-SCOPE

- All close triggers: link click, icon re-click, outside click, Escape key, route change.
- Ensuring no lingering overlay after close.

## OUT-OF-SCOPE

- Swipe-to-close gesture on touch devices.
- Animating the close transition (nice-to-have, not a requirement).

## ADDITIONAL INFORMATION

### Assumptions

- Route changes can be detected via React Router's location to trigger a close.
- The menu uses a backdrop or click-outside listener to detect external clicks.

### Dependencies

- Burger menu core feature is implemented.

### Validation scenarios

1. User clicks "My Teams" link — navigated to `/teams`, menu is closed.
2. User clicks the burger icon while the menu is open — menu closes, user stays on the same page.
3. User clicks on the page content behind the menu overlay — menu closes.
4. User presses Escape — menu closes.
5. User clicks the browser back button while the menu is open — menu closes and the page navigates back.
