---
status: DONE
---

# Rebrush Login & Registration Page

## WHAT

Redesign the login and registration screen (`LoginPage` + `AuthCard`) for a polished, premium first impression.

**Layout and Branding:**
- Center the login card vertically and horizontally with a subtle gradient or tinted background that uses brand colors (e.g., a soft gradient from `--bg-page` toward a muted `--sky-blue-light` tint).
- Increase the logo size and add a subtle entrance animation (fade-in + slight upward translate) for the branding area and card.
- Add a short tagline beneath the app title (e.g., "Your team's availability at a glance").

**Auth Card Polish:**
- Apply the design system `.card` class with generous padding and a refined box-shadow for depth.
- Style the Login/Register tab switcher as a segmented control with smooth background-slide transition on the active tab.
- Inputs should use the `.form-input` pattern with label animations or clear floating labels.
- The submit button should be full-width, use `.btn-primary`, and include a loading spinner state when `submitting` is true.
- Error and success messages should use the `.alert` pattern with subtle slide-in animation.

**Registration Form Enhancements:**
- When in register mode, animate the additional fields (first name, last name) sliding in smoothly.
- Add inline password strength indicator below the password field.

**Responsive Behavior:**
- On mobile viewports, the card should fill available width with appropriate margins.
- On large screens, constrain the card to a comfortable max-width (e.g., 440px).

## WHY

The login page is the first screen every user sees. A visually refined, animated entry experience establishes trust and communicates quality. The current login screen is functional but visually plain with no entrance transitions and minimal branding emphasis.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-002-standardize-page-elements.rebrush.md`
- Affected files: `LoginPage.tsx`, `AuthCard.tsx`, `index.css`
- Animations should respect `prefers-reduced-motion` media query.
