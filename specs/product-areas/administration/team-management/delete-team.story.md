---
status: DONE
---

# Delete Team

## Story
- **IN ORDER TO** remove obsolete or incorrect teams
- **AS** an administrator
- **I WANT TO** delete teams from the system

## Acceptance Criteria
- Admins can delete a team.
- A confirmation dialog is displayed before deletion.
- The system prevents deletion if the team has active members.

## In-Scope
- Confirmation dialog for deletion.
- Backend checks for active members.

## Out-of-Scope
- Reassigning team members (covered in a separate story).

## Additional Information
- Deleting a team should not affect historical availability data.