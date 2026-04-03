---
status: DONE
---

# Structured name fields

## STORY

**IN ORDER TO** have my name represented accurately and formally across the application
**AS** an authenticated employee
**I WANT TO** maintain my first name, last name, and optionally a title and middle name on my profile

## ACCEPTANCE CRITERIA

1. The user profile includes the following name fields: title, first name, middle name, and last name.
2. First name and last name are mandatory — the profile cannot be saved if either is empty or consists only of whitespace.
3. Title and middle name are optional — they may be left blank.
4. Title is a free-text field (e.g. "Mr", "Ms", "Dr", "Prof").
5. Each field is trimmed of leading and trailing whitespace before saving.
6. The profile page displays all four fields in clearly labelled inputs grouped together in a "Name" section.
7. After saving, the updated name fields are reflected wherever the user's name appears (navbar, matrix, team pages, administration).
8. The fields are persisted independently — updating one field does not affect the others.

## IN-SCOPE

- Adding title, first name, middle name, and last name fields to the user profile.
- Validation: first name and last name required; title and middle name optional.
- Trimming whitespace on all name fields before persistence.
- Displaying and editing these fields on the profile page.
- Propagating the name to all places where the user's name is currently shown.

## OUT-OF-SCOPE

- Predefined dropdown list for titles — the field is free text.
- Suffix fields (e.g. "Jr", "III").
- Phonetic name or pronunciation fields.
- Localised name ordering (e.g. family name first).
- Changing how the display name is derived from these fields (covered by a separate story).

## ADDITIONAL INFORMATION

### Assumptions

- The current single `display_name` field will be retired once the structured name fields are populated. A separate story covers how the display name is derived from the new fields.
- Existing users who only have a `display_name` will need a migration or first-login prompt to populate first name and last name.

### Dependencies

- Authentication and profile editing are available.
- The "Edit profile" story is already implemented.

### Migration consideration

Existing users have only a `display_name` value. A data migration should attempt to split `display_name` into first and last name (e.g. first whitespace-separated token → first name, remainder → last name). Users can then correct any inaccuracy on their next profile visit.

### Validation scenarios

1. Employee fills in first name and last name — profile saves successfully.
2. Employee also fills in title and middle name — all four fields are saved.
3. Employee leaves first name empty — save is rejected with a validation error.
4. Employee leaves last name empty — save is rejected with a validation error.
5. Employee leaves title and middle name empty — save succeeds (both are optional).
6. Employee enters "  Dr  " as title — it is trimmed to "Dr" before saving.
7. After saving, the navbar and team matrix show the updated name.
