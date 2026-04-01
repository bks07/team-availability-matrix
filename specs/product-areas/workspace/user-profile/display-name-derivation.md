---
status: DONE
---

# Display name derivation

## STORY

**IN ORDER TO** see a consistently formatted full name throughout the application without manually maintaining a separate display name
**AS** an authenticated employee
**I WANT TO** have my display name automatically derived from my structured name fields

## ACCEPTANCE CRITERIA

1. The display name is computed — not manually entered — from the structured name fields.
2. The derivation rule is: `[title] firstName [middleName] lastName`, with optional parts omitted and no extra whitespace.
3. Examples following the rule:
   - Title "Dr", first "John", middle "Michael", last "Smith" → "Dr John Michael Smith"
   - Title empty, first "Jane", middle empty, last "Doe" → "Jane Doe"
   - Title "Prof", first "Alice", middle "M", last "Johnson" → "Prof Alice M Johnson"
4. The derived display name is used in the navbar greeting and user avatar initials.
5. The avatar initials are computed as the first letter of the first name and the first letter of the last name (e.g. "JS" for John Smith), regardless of title or middle name.
6. The derived display name is used in the availability matrix column headers.
7. The derived display name is used in team member lists.
8. The derived display name is used in the administration user list.
9. Whenever any name field changes, the display name updates immediately in the current session without requiring a page reload.

## IN-SCOPE

- Defining the canonical derivation rule for the display name.
- Computing initials from first name and last name only.
- Applying the derived name in all UI locations where the user's name is shown:
  navbar, avatar, matrix headers, team pages, administration pages.
- Updating the displayed name in the current session when name fields change.

## OUT-OF-SCOPE

- Allowing the user to override or customise the derived display name.
- Middle name abbreviation (e.g. "M." instead of "Michael") — the middle name is displayed as entered.
- Server-side generation of a stored `display_name` column (the backend may or may not store a computed column — that is an implementation detail).

## ADDITIONAL INFORMATION

### Derivation logic (pseudo-code)

```
parts = []
if title is not blank: parts.push(title)
parts.push(firstName)
if middleName is not blank: parts.push(middleName)
parts.push(lastName)
displayName = parts.join(" ")
```

### Initials logic

```
initials = firstName[0].toUpperCase() + lastName[0].toUpperCase()
```

### Dependencies

- Story "Structured name fields" must be implemented first.
