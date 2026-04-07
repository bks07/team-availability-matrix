---
status: DONE
---

# Remove location

## STORY

**IN ORDER TO** remove obsolete locations and keep the list of locations maintainable
**AS** admin user
**I WANT TO** remove a location from the list of locations

## ACCEPTANCE CRITERIA

1. An admin user can remove an existing location from the list of locations.
2. The admin user is asked to confirm before a location is permanently removed.
3. If a location is currently assigned to one or more employees, the system shall display a confirmation modal informing the admin that users are assigned. The modal presents an "Approve" button and a "Cancel" button. Only after explicit approval shall the system delete the location.
4. After successful removal, the location no longer appears in the list of locations.
5. Non-admin users cannot remove locations.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Removing an existing location from the list.
- Confirmation step before removal.
- Confirmation modal with user-assignment warning for locations that are still in use.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or editing locations.
- Reassigning employees from a removed location to another location.
- Bulk removal of locations.
- Archiving or soft-deleting locations.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A location with assigned employees can be removed after the admin explicitly approves via the confirmation modal.

### Dependencies

- Admin role and permission model are available.
- Locations and employee-to-location assignments exist.

### Validation scenarios

1. Admin removes a location that is not assigned to any employee — location is removed successfully.
2. Admin attempts to remove a location that is assigned to one or more employees — confirmation modal appears with warning. Admin clicks "Approve" — location is removed successfully.
3. Admin attempts to remove a location that is assigned to one or more employees — confirmation modal appears. Admin clicks "Cancel" — location is not removed.
4. Admin is prompted for confirmation before removal proceeds.
5. Non-admin user attempts to remove a location — operation is denied.
