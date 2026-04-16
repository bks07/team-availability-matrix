---
status: DONE
---

# Rebrush Pagination

## WHAT

Unify and redesign all table pagination across the application into a single, consistent pagination component that appears at both the top and bottom of every paginated table. Simultaneously, establish a polished custom select-field style that replaces raw browser `<select>` elements app-wide.

### Pagination Layout

Every paginated table must render identical pagination bars **above** and **below** the table body. Each bar displays a single centered line:

```
« ‹ Page 1 of 3 (60 items) › »
```

- `«` — first page
- `‹` — previous page
- `Page X of Y (N items)` — current position and total item count
- `›` — next page
- `»` — last page

Navigation symbols must be rendered as styled interactive elements (not plain HTML `<button>` text). Buttons are disabled at boundary pages (first/last).

When a filter is active, `N items` reflects the **filtered** count, not the total unfiltered count.

The **rows-per-page selector** must appear **once** per tool card / section, outside the pagination bars (e.g., in the toolbar area above the table). It must not be duplicated inside each pagination bar.

### Pages That Require Pagination Rebrush

The following components currently render pagination and must adopt the new unified pattern:

| Component | File | Current Pattern |
|-----------|------|-----------------|
| Permissions — User Assignments tab | `frontend/src/pages/admin/PermissionsPage.tsx` | `pagination-row`, text "Previous"/"Next" buttons, no first/last, no rows-per-page in bar |
| Permissions — Audit Log tab | `frontend/src/pages/admin/PermissionsPage.tsx` | `pagination-row`, text "Previous"/"Next" buttons, server-side pagination |
| My Teams tab | `frontend/src/pages/teams/MyTeamsTab.tsx` | `pagination-bar`, symbol buttons «‹›», rows-per-page in bar |
| Pending Invites tab | `frontend/src/pages/teams/PendingInvitesTab.tsx` | `pagination-bar`, symbol buttons «‹›», rows-per-page in bar |
| Received Invites tab | `frontend/src/pages/teams/ReceivedInvitesTab.tsx` | `pagination-bar`, symbol buttons «‹›», rows-per-page in bar |
| Invitation Responses tab | `frontend/src/pages/teams/InvitationResponsesTab.tsx` | `pagination-bar`, symbol buttons «‹›», rows-per-page in bar |

### CSS Consolidation

- Replace both `.pagination-row` and `.pagination-bar` (and sub-classes) with a single unified CSS class (e.g., `.pagination`).
- The `.pagination-bar` class is currently used in 4 team-tab components but has **no CSS rules defined** in `index.css`; this gap must be closed by the unified style.
- Remove the existing `.pagination-row` rules (lines ~3002–3022 in `index.css`).
- The unified pagination style must use design-system tokens (`--text-secondary`, `--border-input`, `--accent-primary`, `--bg-hover`, etc.) and support both light and dark themes.

### Select Field Redesign

All native `<select>` elements across the application must adopt a consistent, styled appearance that matches the design language of text inputs and other form fields. This includes:

- Custom border, padding, border-radius, and font consistent with `--border-input`, `--input-bg`, `--text-primary` tokens.
- A styled dropdown indicator (chevron icon) replacing the browser default.
- Focus ring using `--focus-ring` / `--border-focus`.
- Disabled state styling.
- Dark-mode compatibility using existing design tokens.

Select fields appear in these locations (non-exhaustive):

| Context | File |
|---------|------|
| Location filter, bulk location, create-user modal | `frontend/src/pages/admin/UsersPage.tsx` |
| Page size, profile filter, event-type filter, inline profile assignment | `frontend/src/pages/admin/PermissionsPage.tsx` |
| New-holiday location, filter-by-location | `frontend/src/pages/admin/HolidaysPage.tsx` |
| Status filter, page size | `frontend/src/pages/teams/InvitationResponsesTab.tsx` |
| Page size | `frontend/src/pages/teams/PendingInvitesTab.tsx` |
| Page size | `frontend/src/pages/teams/ReceivedInvitesTab.tsx` |
| Page size | `frontend/src/pages/teams/MyTeamsTab.tsx` |

The goal is a **global** CSS rule for `select` (or a utility class applied to all `<select>` elements) so that future select fields automatically inherit the styled appearance without per-component overrides.

## WHY

- **Usability:** Users currently must scroll to the bottom of long tables to change pages. Showing pagination at both top and bottom eliminates unnecessary scrolling.
- **Consistency:** Two incompatible pagination patterns exist (`pagination-row` with text buttons vs. `pagination-bar` with symbol buttons). The visual treatment, button styles, and item-count format differ between admin pages and team pages.
- **Missing CSS:** The `pagination-bar` class used in four components has no CSS rules, meaning those components rely on unstyled markup or inherited styles.
- **Design language:** Native `<select>` elements look out of place next to the app's styled inputs, buttons, and cards. A unified select style brings form controls into alignment with the established design system.
- **Filtered counts:** When users apply a filter, the pagination should reflect the actual visible dataset size, not the total, to avoid confusion.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Jira: ASD-14
- Scope: frontend only — CSS and React/TSX changes. No backend changes.
- The rows-per-page selector sizes used today are `[10, 25, 50]` (team tabs) and `[10, 25, 50, 100]` (Permissions page). Unify to a single set during implementation.
- The Audit Log tab in PermissionsPage uses **server-side pagination** (API call per page). The top/bottom pagination bars must trigger the same server-side load when navigating.
- All other paginated tables use client-side pagination (slice of a filtered array).
- Existing design tokens for inputs, borders, and focus rings are documented in `docs/design-system/design-tokens.md`.
