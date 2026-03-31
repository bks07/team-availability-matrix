# Highlight public holidays per user

## STORY

**IN ORDER TO** correctly interpret user availability in the matrix
**AS** team member
**I WANT TO** see public holidays highlighted per user based on their location

## ACCEPTANCE CRITERIA

1. When a displayed date is a public holiday for a user's assigned location, that user's cell for that date is clearly and consistently highlighted.
2. Public holiday highlighting is derived from the user's current location assignment.
3. Different users can have different highlighted public holiday dates in the same matrix period, depending on their location.
4. If a displayed date is not a public holiday for a user's location, no public holiday highlight is applied to that user's cell for that date.
5. If a user has no assigned location, public holiday highlighting is not applied for that user.
6. Public holiday highlighting is visually distinguishable from other highlights (for example weekend or current-day highlighting) when they overlap.
7. Existing matrix capabilities continue to work as before, including viewing and updating availability statuses where permitted.
8. Public holiday highlights remain identifiable while navigating the matrix (for example during scrolling).

## IN-SCOPE

- User-facing matrix behavior to highlight public holidays per user.
- Deriving holiday highlighting from user-to-location assignments.
- Supporting different highlighted days for different users in the same matrix view.
- Verification that highlighting coexists with existing matrix interactions and visual states.

## OUT-OF-SCOPE

- Changes to authentication, permissions, or status business rules.
- Creating, editing, or deleting public holidays from this story.
- Creating, editing, or removing locations from this story.
- Auto-assigning or changing user locations.
- Broad visual redesign beyond holiday highlighting.
- Locale- or calendar-rule customization beyond configured location holidays.

## ADDITIONAL INFORMATION

### Assumptions

- Public holidays are managed per location.
- Each user can have at most one active location assignment at a time.
- The matrix has access to both user location assignments and configured public holidays.
- Holiday highlighting can coexist with weekend and current-day highlighting.

### Dependencies

- Location management is available.
- Public holiday management is available.
- User-to-location assignment is available and up to date.
- Matrix rendering supports cell-level highlighting.

### Validation scenarios

1. Two users with different locations view the same period — each user sees highlights only for holidays of their own location.
2. A date is a holiday for one location but not another — only users in the matching location are highlighted on that date.
3. A user without an assigned location is displayed — no location-based holiday highlighting is shown for that user.
4. A public holiday overlaps with weekend and/or current day — all applicable highlights remain distinguishable.
5. Users can still perform normal matrix interactions after the change.
