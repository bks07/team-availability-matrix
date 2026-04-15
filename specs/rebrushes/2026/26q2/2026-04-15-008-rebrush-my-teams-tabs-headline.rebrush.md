---
status: DONE
---

# Rebrush My Teams Tabs and Headline

## WHAT

Apply small visual refinements to the page headline and tab bar on the Teams page (`TeamsPage.tsx`).

**Page Headline:**
- Replace the hardcoded `font-size: 1.75rem` on `.teams-page__header h1` with the design-system token `var(--font-size-2xl)` (or the most appropriate heading-size token).
- Replace the raw pixel values in `.teams-page__header` (`gap: 16px`, `margin-bottom: 20px`) and `.teams-page` (`padding: 24px`) with spacing tokens (`--space-4`, `--space-5`, `--space-6`).
- Ensure the headline color uses `var(--text-primary)` for theme consistency.

**Tab Bar:**
- Add a smooth sliding transition to the active-tab underline indicator so it animates horizontally when switching tabs, rather than appearing abruptly on each tab.
- Increase the bottom padding of each tab slightly (from `--space-2` to `--space-3`) so the underline has more breathing room below the label text.
- Refine the badge styling: ensure the badge does not shift the tab label baseline; use `vertical-align: middle` or flexbox alignment so badges sit inline with the label text without jitter.

**General:**
- All changes are CSS-only or minimal JSX attribute adjustments; no API or routing logic changes.
- Dark mode must continue to work correctly after these refinements.

## WHY

The broader Teams pages rebrush (spec 006) addressed structural layout and component patterns. This follow-up polishes two remaining rough edges: the headline still uses hardcoded pixel values instead of design-system tokens, and the tab bar underline indicator lacks a smooth transition between tabs. These small refinements bring the Teams page header fully in line with the design system and improve perceived quality when navigating between tabs.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Jira work item: ASD-9
- Affected files: `TeamsPage.tsx` (minimal JSX, if any), `index.css` (`.teams-page`, `.teams-page__header`, `.teams-tab-bar__tab`, `.teams-tab-bar__badge` rules)
- Depends on: `2026-04-15-006-rebrush-teams-pages.rebrush.md` (status DONE)
- Tab URL parameter synchronization (`?tab=...`) and keyboard navigation must be preserved.
