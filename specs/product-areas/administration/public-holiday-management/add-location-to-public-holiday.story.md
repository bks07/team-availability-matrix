---
status: NEW
---

# Add location to public holiday

## STORY

**IN ORDER TO** apply a public holiday to the correct locations
**AS** admin user
**I WANT TO** select an existing public holiday and assign a location to it

## ACCEPTANCE CRITERIA

1. An admin user can add a location to an existing public holiday.
2. The same location cannot be added to the same public holiday more than once.
3. A duplicate assignment is rejected with a clear error message.
4. After successful assignment, the location appears in the location list for that public holiday.
5. Non-admin users cannot add locations to public holidays.
6. The admin user receives clear feedback on success or failure of the operation.

## IN-SCOPE

- Assigning an existing location to an existing public holiday.
- Duplicate-assignment validation.
- Feedback to the admin user on success or failure.
- Restricting access to admin users only.

## OUT-OF-SCOPE

- Creating new public holidays.
- Creating new locations.
- Removing a location from a public holiday.
- Removing the public holiday entity.

## ADDITIONAL INFORMATION

### Assumptions

- An admin role exists.
- The public holiday already exists.
- The location already exists.

### Dependencies

- Admin role and permission model are available.
- Public holidays exist.
- Location management is available.

### Validation scenarios

1. Admin adds a location to a public holiday — assignment is created successfully.
2. Admin attempts to add a location that is already associated to the same holiday — operation is rejected with an error message.
3. Non-admin user attempts to add a location — operation is denied.