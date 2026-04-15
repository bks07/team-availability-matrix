---
status: DONE
---

# Design System Foundation

## WHAT

Formalize and extend the existing design token system into a comprehensive, documented design system for the Team Availability Matrix application.

**Token Layer — Extend and organize `index.css` custom properties:**
- Audit all existing CSS custom properties in `index.css` and confirm each has a semantic purpose and light/dark variant where needed.
- Add missing tokens for: spacing scale (4px grid: `--space-1` through `--space-8`), border-radius scale (`--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`), typography scale (`--font-size-xs` through `--font-size-2xl`, `--font-weight-normal`, `--font-weight-semibold`, `--font-weight-bold`), transition durations (`--transition-fast`, `--transition-normal`), and z-index layers (`--z-dropdown`, `--z-sticky`, `--z-overlay`, `--z-modal`).
- Ensure every raw hex value used in component styles references a semantic token instead of a literal color.

**Component Pattern Library — Define reusable CSS classes:**
- `.btn` base + `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost` variants with consistent sizing, padding, border-radius, and focus-visible rings.
- `.card` base with `.card-padded`, `.card-compact` variants.
- `.form-group`, `.form-label`, `.form-input`, `.form-select` for consistent form elements.
- `.badge` with status variants (`.badge-w`, `.badge-v`, `.badge-a`).
- `.alert` with `.alert-success`, `.alert-error` for feedback messages.
- `.modal` shell with `.modal-header`, `.modal-body`, `.modal-footer`.
- `.table-container` for scrollable data tables with consistent header and cell styling.

**Documentation — Update `docs/design-system/design-tokens.md`:**
- Restructure the existing tokens document to include the new spacing, typography, radius, and z-index tokens.
- Add a "Component Patterns" section listing each CSS class, its purpose, and usage example.
- Add a "Theming" section explaining how light/dark mode works via `data-theme` attribute and `[data-theme="dark"]` overrides.

## WHY

The application already has a solid CSS custom property foundation and a design tokens document, but there is no unified component pattern library. This results in each page re-implementing buttons, cards, forms, and feedback messages with slight inconsistencies. A formalized design system provides a single source of truth for all visual patterns, enabling consistent UI across existing and future pages while reducing CSS duplication.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Existing tokens in `frontend/src/index.css` and documentation in `docs/design-system/design-tokens.md` should be extended, not replaced.
- All new tokens must support both light and dark themes.
- No changes to backend or business logic.
- This spec is a prerequisite for the element standardization and page-level rebrush specs.
