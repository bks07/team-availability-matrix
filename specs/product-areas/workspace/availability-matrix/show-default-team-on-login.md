# Show Default Team on Login

## Story
- **IN ORDER TO** quickly access the most relevant team information
- **AS** a user
- **I WANT TO** see the availability matrix of my default team immediately after logging in

## Acceptance Criteria
- The system displays the availability matrix of the user's default team upon login.
- If no default team is set, the fallback view (user-only column) is displayed with a notification.
- Users can change their default team in their profile settings.

## In-Scope
- Default team selection in user profile settings.
- Notification for users without a default team.

## Out-of-Scope
- Team creation or management.
- Advanced customization of the fallback view.

## Additional Information
- The fallback view should include a clear notification: "You are not yet part of a team. Join or create a team to collaborate."