---
status: DONE
---

# Rethink Navigation & Overall UX

## WHAT

Redesign the application's navigation system (`NavBar`, `BurgerMenu`) and rethink the overall user experience flow across all pages.

**NavBar Redesign (`NavBar.tsx`):**
- Refine the navbar layout: logo on the left, primary navigation links (Workspace, My Calendar, Teams) as horizontally spaced items in the center or left-center, and user controls (status toggle, notification bell, avatar/menu trigger) on the right.
- Navigation links should have smooth underline or background-highlight active-state indicators that visually connect to the current page.
- The today-status toggle (W/V/A buttons) should be compact, pill-shaped, and use canonical status colors with clear active-state styling.
- The user avatar trigger should show a subtle hover ring and the dropdown should open with a smooth scale/fade animation.
- The theme toggle (light/dark) should use a polished icon-only button with a smooth icon-swap animation (sun/moon).
- On mobile, collapse the center navigation items into the burger menu and keep only the logo and essential controls visible.

**Burger Menu Redesign (`BurgerMenu.tsx`):**
- Animate the burger menu as a slide-in panel from the left with a backdrop overlay.
- Organize menu items into clearly labeled sections ("Workspace", "Administration") with collapsible section headers.
- Active page should be visually highlighted with an accent background or left-border indicator.
- Each menu item should have a hover transition and focus-visible ring.
- Add smooth open/close transitions (slide + fade) and trap focus within the menu when open.

**Overall UX Improvements:**
- Add page transition animations: a subtle fade or slide when navigating between pages (via React Router). Keep transitions fast (150–200ms) to avoid feeling sluggish.
- Ensure the loading state during bootstrap (`bootLoading` in `App.tsx`) shows a branded skeleton or spinner instead of a plain "Loading..." text.
- Add breadcrumb navigation for nested pages (e.g., Teams > Team Detail, Admin > Locations) to improve wayfinding.
- Ensure the `TeamlessNotification` banner is styled as a polished alert with an action button to navigate to Teams.
- The notification bell (`NotificationBell`) and task list popover (`TaskListPopover`) should use consistent dropdown styling with the user menu and design system shadows.

**Information Architecture:**
- The current routing structure groups workspace, personal pages, and admin pages under different paths. Verify that the navigation clearly communicates where the user is at all times through active-state indicators, breadcrumbs, and page titles.
- Admin pages should feel visually distinct from workspace pages (e.g., a subtle sidebar or different background shade) to reinforce the context switch.

## WHY

Navigation is the backbone of the user experience. The current NavBar and BurgerMenu are functional but lack visual refinement — there are no page transitions, the burger menu opens without animation, active states are minimal, and there is no breadcrumb system for nested pages. A thoughtfully redesigned navigation experience with smooth transitions, clear wayfinding, and polished interactions transforms the application from a functional tool into a delightful product.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-001-design-system-foundation.rebrush.md` and `2026-04-15-002-standardize-page-elements.rebrush.md`
- Affected files: `NavBar.tsx`, `BurgerMenu.tsx`, `MainLayout.tsx`, `AdminLayout.tsx`, `WorkspaceLayout.tsx`, `App.tsx`, `NotificationBell.tsx`, `TaskListPopover.tsx`, `TeamlessNotification.tsx`, `index.css`
- All routing paths must remain unchanged — this is a visual and interaction redesign only.
- Keyboard navigation and screen reader accessibility must be preserved or improved.
- All animations should respect `prefers-reduced-motion` media query.
