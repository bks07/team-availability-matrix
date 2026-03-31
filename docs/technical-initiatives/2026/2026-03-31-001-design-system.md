# Technical Initiative: Introduce a consistent design system

## WHAT

Create a design system that is the basis for all future design decisions.
Inspect all existing design elements and harmonize them over all pages.

## WHY

Currently, there are several design elements on different pages that look completely different. The most visible inconsistency is the coloring of W, V, and A day values: the availability matrix, the weekly calendar, and the navbar each use a different color scheme for the same statuses. This means users see three or four different visual representations for the same concept depending on where they look.

Beyond status colors, the burger menu uses hardcoded color values instead of the existing CSS variables, breaking the light/dark theme support. Button styles, card appearances, and spacing vary across the login page, workspace, profile page, and administration area without a clear rationale. There is no documented color palette, no component catalog, and no shared vocabulary for design decisions — making it difficult to keep the UI consistent as new features are added.

## IN-SCOPE

- Define a single, authoritative color palette for all status values (W, V, A) to be used consistently across the availability matrix, weekly calendar, navbar, and any future view.
- Audit all existing CSS variables and consolidate them into a complete set of design tokens covering colors, typography, spacing, border radii, shadows, and elevations.
- Replace all hardcoded color values (e.g. in the burger menu) with the corresponding design tokens.
- Harmonize button styles (primary, secondary, danger) so they look and behave the same on every page.
- Harmonize form input styles (text fields, selects, labels, focus states) across login, profile, and administration pages.
- Harmonize card and surface styles (border radius, shadow, padding) across all pages.
- Ensure the light/dark theme toggle works correctly on every page and component after harmonization.
- Document the design system: the token names, their intended usage, and the rationale behind the palette choices.

## OUT-OF-SCOPE

- Changes to application behavior, business rules, or API contracts.
- Changes to page layout structure or navigation hierarchy.
- Introduction of a third-party component library or CSS framework.
- Creation of a Storybook or standalone component catalog application.
- New product features unrelated to visual consistency.
- Changes to backend code.
- Performance optimizations.
- Accessibility improvements beyond what naturally results from consistent styling.

## ACCEPTANCE CRITERIA

- W, V, and A statuses use the same colors everywhere they appear: availability matrix, weekly calendar, navbar, and any other view.
- No hardcoded color values remain in any component — all colors reference design tokens (CSS variables).
- The light/dark theme toggle produces a correct and consistent appearance on every page.
- Button, form input, card, and surface styles are visually consistent across login, workspace, profile, calendar, team, and administration pages.
- A design system documentation file exists that lists all design tokens, their values, and their intended usage.
- `npm run build` and `npm run typecheck` pass without errors.
- No functional regression: the application works exactly as before from the user's perspective.

## ADDITIONAL INFORMATION

### Affected Areas

The following areas of the application are affected by design inconsistencies and need to be reviewed:

- **Availability Matrix** — status pill colors, row highlights, bulk selection styling.
- **Weekly Calendar** — status badge colors, day cell styling.
- **Navigation Bar** — today status button colors, user avatar styling.
- **Burger Menu** — hardcoded colors for backgrounds, borders, and text instead of CSS variables.
- **Login Page** — card and form styling.
- **Profile Page** — avatar, form fields, photo crop modal.
- **Administration Pages** — tables, forms, action buttons across locations, holidays, users, permissions, and settings.

### Existing Foundation

The codebase already has a CSS variable system with light/dark theme support and semantic token names. This initiative builds on that foundation by filling gaps, removing hardcoded overrides, and ensuring every component actually uses the tokens consistently.
