---
status: DONE
---

# Consolidate Primary Button to .btn.btn-primary

## WHAT

Remove the redundant `.primary-button` CSS class from the design system and replace all of its usages with the standard `.btn.btn-primary` pattern.

**CSS changes in `frontend/src/index.css`:**
- Remove the `.primary-button` rule block (background, color, border, focus-visible declarations around lines 295–360).
- Remove the `.primary-button:hover:not(:disabled)` rule block.

**Component changes — replace `className="primary-button"` with `className="btn btn-primary"` in:**
- `frontend/src/pages/admin/UsersPage.tsx` — 4 buttons (lines 84, 392, 601, 678)
- `frontend/src/pages/admin/PermissionsPage.tsx` — 2 buttons (lines 321, 384)
- `frontend/src/pages/admin/TeamsAdminPage.tsx` — 3 buttons (lines 308, 536, 579)

**No changes to:**
- Files already using `.btn.btn-primary` (AuthCard, PhotoCropModal, ProfilePage, TeamDetailPage, MyTeamsTab, ReceivedInvitesTab, TeamsPage, ChangePasswordPage).
- Backend code.
- Design token CSS custom properties (`--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover`) which are shared and remain in use.

## WHY

The application has two CSS classes that produce the same primary button appearance: `.primary-button` and `.btn.btn-primary`. The design system foundation (spec 001) established `.btn.btn-primary` as the canonical pattern with a composable `.btn` base class. Keeping `.primary-button` creates confusion, risks visual drift between pages, and contradicts the single-source-of-truth principle of the design system.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Jira: ASD-13
- Depends on: design system foundation spec (2026-04-15-001), already DONE.
- The `.btn` base class provides consistent height, padding, border-radius, transition, and `:focus-visible` ring. Buttons migrated from `.primary-button` will inherit these base styles automatically.
- Scope is strictly frontend CSS and TSX; no backend changes required.
