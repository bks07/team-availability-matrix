---
status: NEW
---

# Standardize Page Elements Across All Pages

## WHAT

Audit every page and shared component in the application and replace ad-hoc styling with the design system's component pattern classes.

**Buttons:**
- Replace all inline or page-specific button styles with `.btn` + variant classes (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`).
- Ensure every interactive button has a consistent height, padding, border-radius, and `:focus-visible` ring from the design system.
- Normalize the sizing of icon-only buttons (close, menu toggle, theme toggle) using a shared `.btn-icon` class.

**Cards and Containers:**
- Replace page-specific card styles (`.auth-card`, `.toolbar-card`, `.matrix-card`, `.profile-card`, `.admin-management`) with the unified `.card` class plus layout variants.
- Ensure consistent border-radius, box-shadow, and padding across all card-like surfaces.

**Form Elements:**
- Standardize all `<input>`, `<select>`, and `<label>` elements using `.form-group`, `.form-label`, `.form-input`, `.form-select` classes.
- Unify disabled-state styling across login, profile, change password, and admin forms.
- Ensure every form input has a consistent `:focus-visible` ring using `--focus-ring`.

**Feedback Messages:**
- Replace `.message.error`, `.message.success`, `.admin-alert.error`, `.admin-alert.success` with unified `.alert.alert-error`, `.alert.alert-success` classes.
- Ensure all feedback messages use `aria-live="polite"` containers consistently.

**Tables:**
- Standardize the admin CRUD tables (locations, holidays, users, teams, permissions) with a shared `.table-container` wrapper and consistent header, row, and cell styles.
- Ensure alternating row highlights and hover states are consistent.

**Modals and Overlays:**
- Unify `.modal-backdrop`, `.modal-content`, `.modal-header`, `.modal-close` styling across LegendModal, PhotoCropModal, delete confirmations, and any inline dialogs.

**Typography:**
- Replace hardcoded `font-size` and `font-weight` values with design system typography tokens.

## WHY

The current application has organically grown page-specific CSS classes that implement visually similar but subtly different buttons, cards, inputs, and alerts. This creates visual inconsistency across pages and increases maintenance cost. Standardizing all elements against the design system component patterns ensures a coherent visual language and makes future rebrushing or theming changes apply globally.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-001-design-system-foundation.rebrush.md`
- Must preserve all existing functionality — this is a visual-only refactor.
- Dark mode must remain fully functional after standardization.
- All existing accessibility attributes (aria-live, focus management, keyboard navigation) must be preserved.
