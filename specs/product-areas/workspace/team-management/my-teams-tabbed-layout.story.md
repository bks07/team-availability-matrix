---
status: DONE
---

# My Teams tabbed layout

## STORY

**IN ORDER TO** manage all aspects of team membership and invitations from a single page
**AS** an authenticated employee
**I WANT TO** navigate between My Teams, Received Invites, Pending Invites, and Responses using a tabbed layout

## ACCEPTANCE CRITERIA

### Tab bar

1. The My Teams page renders a horizontal tab bar below the page header and above the page content area.
2. The tab bar follows the same visual pattern as the Administration // Permission Management page tab bar.
3. The tab bar contains exactly four tabs in this order: **My Teams**, **Received Invites**, **Pending Invites**, **Responses**.
4. Exactly one tab is active at any time; the active tab is visually distinguished (e.g. underline, bold label, accent colour).
5. Clicking an inactive tab switches the visible content area to the corresponding tab panel with no full-page reload.

### Tab state and URL

6. The active tab is reflected in the URL (e.g. `/teams?tab=my-teams`, `/teams?tab=received`, `/teams?tab=pending`, `/teams?tab=responses`) so the user can bookmark or share a direct link to a tab.
7. On initial page load, if no tab query parameter is present, the **My Teams** tab is active by default.
8. If an invalid tab value is supplied in the URL, the page falls back to the **My Teams** tab.

### Badge counts

9. The **Received Invites** tab label includes a numeric badge showing the count of pending received invitations (e.g. "Received Invites (3)").
10. The **Pending Invites** tab label includes a numeric badge showing the count of pending sent invitations.
11. The **Responses** tab label includes a numeric badge showing the count of unread or recent responses (from the last 30 days).
12. Badge counts update when the user switches tabs or after any mutation (accept, reject, delete, etc.).
13. A badge is hidden when its count is zero.

### Layout

14. The "Create Team" button in the page header remains visible regardless of which tab is active.
15. Success and error messages appear between the page header and the tab bar, visible from any tab.
16. Each tab panel renders its own toolbar, table, and pagination independently.

### Accessibility

17. The tab bar uses `role="tablist"`, each tab uses `role="tab"` with `aria-selected`, and each panel uses `role="tabpanel"` with `aria-labelledby`.
18. Arrow keys navigate between tabs; Enter or Space activates the focused tab.
19. Tab panels that are not active are hidden from the accessibility tree.

## IN-SCOPE

- Tab bar component with four tabs.
- URL-based tab state persistence.
- Badge counts on tab labels.
- Accessibility roles and keyboard navigation.
- Shared page header with Create Team button.

## OUT-OF-SCOPE

- Content of individual tab panels (specified in their own story files).
- Animated tab transitions.
- Drag-and-drop tab reordering.
- User-customisable tab order or visibility.

## ADDITIONAL INFORMATION

### Assumptions

- All four tab panels share the same data-loading lifecycle — data for badge counts is fetched on page mount; panel data is fetched when a tab becomes active.
- The tab bar component can be reused in other pages in the future.

### Dependencies

- view-my-teams (My Teams tab content)
- received-invites-tab (Received Invites tab content)
- pending-invites-tab (Pending Invites tab content)
- invitation-responses-tab (Responses tab content)

### Validation scenarios

1. Employee opens `/teams` — My Teams tab is active, tab bar is visible with all four tabs.
2. Employee clicks "Received Invites" tab — URL updates to `/teams?tab=received`, Received Invites panel is shown.
3. Employee navigates directly to `/teams?tab=responses` — Responses tab is active on load.
4. Employee navigates to `/teams?tab=invalid` — My Teams tab is shown as fallback.
5. Employee has 2 pending received invitations — "Received Invites (2)" badge is visible.
6. Employee accepts an invitation — badge count decreases by 1.
7. Screen reader user navigates with arrow keys through tabs, hears tab labels and selected state.
