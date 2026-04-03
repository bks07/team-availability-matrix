---
status: DONE
---

# Edit location

## STORY

**IN ORDER TO** maintain the existing locations
**AS** admin user
**I WANT TO** edit an existing location

## ACCEPTANCE CRITERIA

1. An admin user can edit the name of an existing location.
2. The updated location name must not be empty or consist only of whitespace.
3. The updated location name must remain unique; changing it to a name that already exists is rejected with a clear error message.
4. After a successful edit, the updated name is reflected everywhere the location appears.
5. Non-admin users cannot edit locations.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Editing the name of an existing location.
- Validation of the updated name (non-empty, unique).
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Adding or removing locations.
- Changing employee-to-location assignments as part of the edit.
- Bulk editing of locations.
- Adding new attributes to a location beyond its name.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A location is identified by its unique name.

### Dependencies

- Admin role and permission model are available.
- Locations already exist and can be selected for editing.

### Validation scenarios

1. Admin edits a location with a valid, unique new name — location is updated successfully.
2. Admin attempts to change a location name to one that already exists — operation is rejected with an error message.
3. Admin attempts to set a location name to empty or whitespace-only — operation is rejected with an error message.
4. Non-admin user attempts to edit a location — operation is denied.

