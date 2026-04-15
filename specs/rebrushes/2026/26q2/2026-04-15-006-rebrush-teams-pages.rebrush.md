---
status: DONE
---

# Rebrush Teams Hub & Team Detail Pages

## WHAT

Polish the Teams page (`TeamsPage` with 4 tabs) and Team Detail page (`TeamDetailPage`) into refined, cohesive team-management experiences.

**Teams Page — Tab Bar:**
- Restyle the tab bar (`My Teams`, `Received Invites`, `Pending Invites`, `Responses`) as a polished segmented control or underline-tab pattern with smooth active-tab indicator transition (sliding underline or background highlight).
- Badge counts on tabs should use the design system `.badge` pattern with a subtle accent background.
- Tab keyboard navigation (arrow keys) should show clear focus indicators using `--focus-ring`.

**Teams Page — My Teams Tab:**
- Display teams as cards (`.card` pattern) in a responsive grid layout instead of a plain list.
- Each team card should show the team name prominently, member count as a subtle badge, and a "View" action button.
- The "Create Team" form should appear as an expandable card or slide-down section with smooth animation.
- Form fields should use `.form-input` and the submit button should use `.btn-primary`.

**Teams Page — Invites Tabs (Received, Pending, Responses):**
- Style invitation items as compact cards with clear status indicators (pending = amber badge, accepted = green badge, declined = muted badge).
- Action buttons (accept, decline, cancel) should use `.btn-primary`, `.btn-danger`, and `.btn-ghost` respectively with clear visual hierarchy.
- Empty-state messages should be centered with a friendly icon or illustration and muted text.

**Team Detail Page (`TeamDetailPage.tsx`):**
- Display team info (name, description) in a polished header card with an edit button using `.btn-ghost`.
- Member list should use a clean table or card-list layout with avatar initials, name, email, role badge, and joined date.
- Role badges should be color-coded: Owner = accent primary, Admin = amber, Member = neutral.
- The invite-member search should be a well-styled search input with a dropdown results list.
- Transfer ownership and delete team modals should use the design system `.modal` pattern.
- The "Back to Teams" link should be a clear breadcrumb or back-navigation element.

## WHY

The Teams hub and Team Detail pages are core collaboration features where users create teams, manage memberships, and handle invitations. The current tab-based layout is functional but the tabs, invite lists, and team detail screens lack visual polish and consistent component patterns. Refined team pages improve the collaborative experience and make team management feel intuitive.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-002-standardize-page-elements.rebrush.md`
- Affected files: `TeamsPage.tsx`, `MyTeamsTab.tsx`, `ReceivedInvitesTab.tsx`, `PendingInvitesTab.tsx`, `InvitationResponsesTab.tsx`, `TeamDetailPage.tsx`, `index.css`
- All team service API calls must remain unchanged.
- Tab URL parameter synchronization (`?tab=...`) must be preserved.
