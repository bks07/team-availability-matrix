# Team administrator role

## STORY

**IN ORDER TO** delegate day-to-day team management without giving away full ownership
**AS** a team owner
**I WANT TO** promote accepted team members to the administrator role and demote them back to regular members

## ACCEPTANCE CRITERIA

1. The team owner can promote any accepted team member to the **administrator** role.
2. The team owner can demote any administrator back to a regular **member**.
3. There is no limit on the number of administrators per team.
4. Administrators can perform member management actions (invite and remove members) but cannot edit team details, delete the team, or transfer ownership.
5. The administrator role is visually indicated in the team member list (e.g. a badge or label).
6. Promoting or demoting a member takes effect immediately and is reflected in the UI.
7. Only the owner can promote or demote — administrators cannot promote other members.

## IN-SCOPE

- Promoting a member to administrator.
- Demoting an administrator to regular member.
- Visual identification of administrators in the member list.

## OUT-OF-SCOPE

- Custom role names or configurable permission sets.
- Administrators promoting other members to administrator.

## ADDITIONAL INFORMATION

### Assumptions

- The team membership record stores a role value: `owner`, `admin`, or `member`.
- Only the owner is authorised to change roles.

### Dependencies

- Create team and team owner role features are implemented.
- Invite-to-team feature is implemented so that accepted members exist.

### Validation scenarios

1. Owner promotes member A to admin — member A's badge changes to "Admin".
2. Owner demotes admin A back to member — member A's badge changes to "Member".
3. Admin A tries to promote member B — action is not available or returns a permission error.
4. Owner promotes multiple members — all show the admin badge.
