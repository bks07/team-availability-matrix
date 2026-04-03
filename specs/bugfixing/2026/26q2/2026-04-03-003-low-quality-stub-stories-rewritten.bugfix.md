---
status: DONE
---

# Low-quality stub stories rewritten

## CURRENT BEHAVIOR

Four product-area stories marked `DONE` contained only minimal stub content — vague acceptance criteria (3 or fewer bullet points), no proper STORY format (`IN ORDER TO` / `AS` / `I WANT TO`), no validation scenarios, and missing IN-SCOPE / OUT-OF-SCOPE sections:

1. `registration-and-login/session-timeout.story.md`
2. `workspace/availability-matrix/availability-filters.story.md`
3. `workspace/availability-matrix/export-matrix.story.md`
4. `workspace/availability-matrix/fallback-view-for-user-without-team.story.md`

All four describe features that ARE implemented but were poorly documented.

## EXPECTED BEHAVIOR

Every `DONE` story should follow the standard story template: proper STORY format, numbered acceptance criteria with edge cases, IN-SCOPE, OUT-OF-SCOPE, ADDITIONAL INFORMATION with Assumptions, Dependencies, and Validation scenarios.

## RESOLUTION

All four stories have been rewritten with:
- Proper `IN ORDER TO / AS / I WANT TO` story format
- 6–9 specific, verifiable acceptance criteria based on the actual implementation
- IN-SCOPE and OUT-OF-SCOPE sections
- Assumptions, Dependencies, and Validation scenarios
- Status remains `DONE` (the features are implemented)

### Key details per story

- **session-timeout**: Documented the 30-minute idle timeout, 5-minute warning, activity detection (mouse/keyboard/scroll/touch), localStorage clearance, and client-side-only nature.
- **availability-filters**: Documented the W/V/A filter buttons in the toolbar, client-side filtering, reset functionality, and per-team-view behavior.
- **export-matrix**: Documented the toolbar export button, `GET /api/matrix/export` endpoint, CSV format with headers, and browser download.
- **fallback-view-for-user-without-team**: Documented the single-column view, TeamlessNotification component, link to `/teams`, and ability to manage own statuses.

## ROOT CAUSE

These stories were likely auto-generated or created early in the project as placeholders and never updated to match the quality bar of the rest of the spec library.

## IMPACT

Low-quality stories make it difficult to verify implementation correctness, onboard new team members, or plan related features.