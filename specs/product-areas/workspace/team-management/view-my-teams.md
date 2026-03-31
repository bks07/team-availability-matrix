# View my teams

## STORY

**IN ORDER TO** quickly access and navigate the teams I belong to
**AS** an authenticated employee
**I WANT TO** see a list of all my teams along with pending invitations

## ACCEPTANCE CRITERIA

1. The employee sees a list of all teams they are a member of, including their role (owner, admin, member) on each team.
2. The employee sees a separate section or badge for pending invitations they have not yet accepted or rejected.
3. Each team entry shows the team name, description (truncated if necessary), and the employee's role.
4. The employee can navigate to a team's detail page from the list.
5. Pending invitations display the team name, description, and who sent the invitation.
6. The list updates immediately when the employee accepts or rejects an invitation.
7. If the employee has no teams and no pending invitations, a helpful empty state is shown.

## IN-SCOPE

- Listing teams the employee belongs to.
- Showing the employee's role per team.
- Listing pending invitations.
- Navigating to a team detail page.

## OUT-OF-SCOPE

- Searching or filtering teams.
- Viewing teams the employee does not belong to.

## ADDITIONAL INFORMATION

### Assumptions

- The employee is authenticated and has access to the workspace.
- The "My Teams" view is accessible from the main navigation.

### Dependencies

- Create team and invite-to-team features are implemented.

### Validation scenarios

1. Employee belongs to two teams — both appear in the list with correct roles.
2. Employee has one pending invitation — it appears in the invitations section.
3. Employee accepts an invitation — the team moves from invitations to the team list.
4. Employee has no teams and no invitations — an empty state message is shown.
