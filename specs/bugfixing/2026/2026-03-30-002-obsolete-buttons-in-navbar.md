# Obsolete buttons in header navigation bar

## CURRENT BEHAVIOR

Although the application already provides a burger menu with the main navigation links, the header navigation bar still shows the `Workspace` and `Admin` buttons.

## EXPECTED BEHAVIOR

The burger menu should contain the main page links, apart from the links that belong in the user menu.

The `Workspace` and `Admin` buttons should no longer be shown in the header navigation bar.

## IMPACT

- The header shows navigation options that are no longer needed.
- Users are presented with duplicate ways to reach the same areas of the application.
- The navigation feels inconsistent because links are split across the burger menu and obsolete header buttons.
- This adds unnecessary visual clutter to a prominent part of the interface.

## STEPS TO REPRODUCE

1. Log in as an admin user.
2. Look at the header navigation bar.
3. Observe that the `Workspace` and `Admin` buttons are still visible even though the burger menu already provides navigation links.

## ADDITIONAL INFORMATION

This issue affects the main header navigation area.

The problem is not that navigation is missing. Instead, outdated navigation controls are still displayed alongside the current navigation pattern.
