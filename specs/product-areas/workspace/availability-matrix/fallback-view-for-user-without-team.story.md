---
status: DONE
---

# Fallback View for User Without Team

## STORY
- **IN ORDER TO** ensure users without a team can still manage their availability
- **AS** a user who is not part of any team
- **I WANT TO** see a fallback view with my availability column and guidance to join or create a team

## ACCEPTANCE CRITERIA
1. The fallback view displays only the user's availability column.
2. A prominent notification is displayed: "You are not yet part of a team. Join or create a team to collaborate."
3. The notification includes a link to the team management page (/teams).
4. The fallback view uses the same table structure and styling as the team availability matrix.
5. The user can set or clear their own availability statuses from the fallback view.
6. The TeamlessNotification component is used to render the notification.
7. The fallback view is accessible only when the user has no teams.

## IN-SCOPE
- Displaying the fallback view for users without a team.
- Notification design and content.
- Consistent table structure and styling with the team availability matrix.
- Linking the notification to the team management page.
- Allowing users to manage their own availability statuses.

## OUT-OF-SCOPE
- Team invitation workflows.
- Team creation workflows.
- Customization of the fallback view beyond the current implementation.

## ADDITIONAL INFORMATION
### Assumptions
- Users without a team should still have access to the availability matrix.
- The fallback view should provide clear guidance to join or create a team.

### Dependencies
- TeamlessNotification component (frontend/src/components/TeamlessNotification.tsx).
- Team management page (/teams).

### Validation Scenarios
- Verify the fallback view displays only the user's availability column.
- Verify the notification text and link are correct.
- Verify the fallback view styling matches the team availability matrix.
- Verify the user can set and clear their availability statuses.
- Verify the fallback view is not shown for users who are part of a team.