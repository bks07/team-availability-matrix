---
status: NEW
---

# Rebrush My Calendar Page

## WHAT

Polish the My Calendar page (`MyCalendarPage` + `MonthlyCalendar`) into a visually outstanding personal calendar experience.

**Month Navigation:**
- Restyle the month/year navigation controls as a compact, elegant header bar with left/right chevron buttons and a centered month-year label.
- Add a "Today" quick-jump button that returns to the current month.
- The navigation buttons should use `.btn-ghost` styling with smooth hover transitions.

**Calendar Grid:**
- Increase the visual clarity of the weekly grid: crisp cell borders using `--border-light`, clear day-of-week headers with `--text-secondary`, and week number indicators on the left.
- Today's date cell should have an accented ring or background highlight using `--row-today-bg` with a subtle left-border accent in `--amber-flame`.
- Weekend cells should have a visually distinct but understated background using `--row-weekend-bg`.
- Holiday cells should display a small holiday-name tooltip on hover and use the `--holiday-bg` token.

**Status Day Cells:**
- Status indicators (W/V/A) should use the canonical `.badge` status pattern with pill-shaped badges.
- Clicking a day cell to toggle status should show a smooth micro-animation (scale bounce) on the status pill.
- Empty (no-status) day cells should show a subtle dashed-border placeholder to indicate editability.

**Legend and Context:**
- The legend toggle button should use `.btn-secondary` styling.
- Add the current user's work schedule summary (e.g., "Mon–Fri") as a subtle subtitle beneath the month name.

**Responsive Behavior:**
- On mobile, the calendar cells should compress gracefully, keeping status badges readable.
- Month navigation should adapt to a stacked or compact layout on narrow screens.

## WHY

The My Calendar page is the primary personal view where users manage their own availability. Its current grid implementation is functional but lacks visual polish — day cells are plain, status indicators are minimal, and there is no entrance animation or interactive feedback. A refined calendar experience makes daily status management feel intuitive and enjoyable.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-002-standardize-page-elements.rebrush.md`
- Affected files: `MyCalendarPage.tsx`, `MonthlyCalendar.tsx`, `index.css`
- Status toggle API calls must remain unchanged.
- Work schedule and holiday data sources remain unchanged.
