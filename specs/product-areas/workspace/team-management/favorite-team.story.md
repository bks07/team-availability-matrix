---
status: NEW
---

# Favorite team

## STORY

**IN ORDER TO** quickly identify and prioritise the teams that matter most to me
**AS** an authenticated employee
**I WANT TO** mark teams as favorites so they stand out in my team list

## ACCEPTANCE CRITERIA

1. Each team row in the My Teams table displays a clickable star icon in the Favorite column.
2. A gray (outline) star indicates the team is not a favorite; a yellow (filled) star indicates it is.
3. Clicking the star toggles the favorite state immediately — no additional confirmation is required.
4. The toggle sends a request to the backend to persist the favorite state for the current user and team.
5. If the backend request fails, the star reverts to its previous state and an error message is shown.
6. Favorite state is per-user — toggling a favorite does not affect other users.
7. The default sort order of the My Teams table places favorited teams before non-favorited teams, then alphabetically by name within each group.
8. The favorite state is preserved across sessions (page reloads, re-logins).

## IN-SCOPE

- Star icon toggle in the table Favorite column.
- Backend endpoint to set/unset a team as favorite for the authenticated user.
- Persisting favorite state per user per team.
- Default sort order: favorites first.

## OUT-OF-SCOPE

- Favoriting teams the user does not belong to.
- Favoriting from pages other than My Teams (e.g. team detail page).
- Notification or feed changes based on favorite status.
- Limiting the number of favorites.

## ADDITIONAL INFORMATION

### Assumptions

- A new database association (e.g. `user_team_favorites` table or a boolean `is_favorite` column on `team_members`) stores the favorite state.
- The `GET /teams` endpoint includes an `isFavorite` boolean in its response.
- A dedicated endpoint (e.g. `PUT /teams/{id}/favorite`) toggles the favorite state.

### Dependencies

- view-my-teams (table layout must exist for the Favorite column).

### Validation scenarios

1. Employee sees gray stars on all teams initially.
2. Employee clicks the star on Team A — star turns yellow, Team A moves to the top of the default sort.
3. Employee clicks the yellow star on Team A — star turns gray, Team A returns to its alphabetical position.
4. Employee reloads the page — favorite state is preserved.
5. Network error during toggle — star reverts, error message appears.
6. Another user views the same team — their favorite state is independent.
