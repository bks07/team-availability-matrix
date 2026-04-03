---
status: DONE
---

# Add location

## STORY

**IN ORDER TO** assign employees to a given location
**AS** admin user
**I WANT TO** add locations to a list

## ACCEPTANCE CRITERIA

1. An admin user can add a new location by providing a location name.
2. The location name must not be empty or consist only of whitespace.
3. Location names must be unique; adding a duplicate name is rejected with a clear error message.
4. After successful creation, the new location appears in the list of locations.
5. Non-admin users cannot add locations.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Creating a new location with a name.
- Validation of the location name (non-empty, unique).
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Editing or removing existing locations.
- Assigning employees to locations.
- Bulk import of locations.
- Location hierarchies or grouping.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists and can be distinguished from regular users.
- A location is identified by its unique name.

### Dependencies

- Admin role and permission model are available.

### Validation scenarios

1. Admin adds a location with a valid, unique name — location is created successfully.
2. Admin attempts to add a location with a duplicate name — operation is rejected with an error message.
3. Admin attempts to add a location with an empty or whitespace-only name — operation is rejected with an error message.
4. Non-admin user attempts to add a location — operation is denied.

