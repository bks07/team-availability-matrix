---
status: DONE
---

# Show user photo and name in header row

## STORY

**IN ORDER TO** identify each employee in the availability matrix quickly without cluttering the header row
**AS** an authenticated employee
**I WANT TO** see only each employee's profile picture and display name in the top row of the matrix, using the first name when no display name is available

## ACCEPTANCE CRITERIA

1. Each employee column in the top row of the availability matrix shows the employee's profile picture.
2. Each employee column in the top row shows the employee's display name.
3. If an employee has no display name, the top row shows that employee's first name instead.
4. If neither a display name nor a first name is available, the system uses the existing fallback avatar/name behavior defined elsewhere in the application.
5. The top row does not show other profile information such as email address, location, full name, or enlarged photo content directly inside the header cell.
6. The same naming rule is applied consistently for every employee shown in the matrix.
7. The header row remains readable and usable when many employee columns are visible or when the matrix is horizontally scrolled.
8. The displayed photo and name update after a profile change without requiring data workarounds or manual correction.

## IN-SCOPE

- Showing employee profile photos in matrix header cells.
- Showing display names in matrix header cells.
- Falling back from display name to first name when needed.
- Ensuring no extra profile fields are rendered directly in the header cell.

## OUT-OF-SCOPE

- Editing profile information from the matrix header.
- Defining how profile photos are uploaded, cropped, or deleted.
- Changing profile naming rules outside this matrix header use case.
- Redesigning the rest of the availability matrix layout.

## ADDITIONAL INFORMATION

### Assumptions

- The matrix already has access to employee profile photo data and the name fields required for display.
- A display name may be absent for some employees.
- A first name is stored separately from the display name.

### Dependencies

- Profile photo management is available.
- Structured name fields or an equivalent first-name source are available.
- The availability matrix header row supports rendering employee identity content.

### Validation scenarios

1. Employee with profile photo and display name "Sam Carter" appears in the matrix header row with the photo and "Sam Carter".
2. Employee with profile photo, blank display name, and first name "Priya" appears with the photo and "Priya".
3. Employee with no photo uses the application's existing avatar fallback while still showing the display name or first-name fallback.
4. Matrix is viewed with many employees and horizontal scrolling enabled; header cells still show only the compact identity content.
5. Employee updates profile name details and reopens the matrix; the updated display value appears according to the fallback rule.