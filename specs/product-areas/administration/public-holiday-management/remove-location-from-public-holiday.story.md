---
status: NEW
---

# Remove location from public holiday

## STORY
**IN ORDER TO** maintain accurate public holiday location assignments without deleting the holiday itself
**AS** admin user
**I WANT TO** select an existing public holiday and remove one of its associated locations

## ACCEPTANCE CRITERIA
- An admin user can remove a location from an existing public holiday.
- The admin user is asked to confirm before the location is removed.
- After successful removal, the location no longer appears in the location list for that public holiday.
- The public holiday entity itself is not deleted when a location is removed.
- Non-admin users cannot remove locations from public holidays.
- The admin user receives clear feedback on success or failure.

## IN-SCOPE
- Removing a location association from a public holiday.
- A confirmation step before removal.
- Success and failure feedback for the admin user.
- Access restriction so only admins can perform the action.

## OUT-OF-SCOPE
- Removing the public holiday entity entirely.
- Adding locations to a public holiday.
- Creating or editing the public holiday itself.

## ADDITIONAL INFORMATION
### Assumptions
- An admin role exists.
- The public holiday already exists and has the location associated.
- A zero-location holiday is a valid intermediate state.

### Dependencies
- Admin role and permission model are available.
- Public holidays exist with location associations.
- Location management is available.

### Validation scenarios
- Admin removes a location from a public holiday; the location association is removed successfully and the holiday entity remains.
- Admin is prompted for confirmation before the removal proceeds.
- Non-admin user attempts to remove a location; the operation is denied.
