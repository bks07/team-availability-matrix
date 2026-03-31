# Show user details on header photo hover

## STORY

**IN ORDER TO** inspect colleague profile details without overloading the availability matrix header row
**AS** an authenticated employee
**I WANT TO** see a profile details modal when hovering over a user's profile picture in the top row of the matrix

## ACCEPTANCE CRITERIA

1. Hovering over a user's profile picture in the top row opens a profile details modal for that user.
2. The modal shows a larger version of the user's profile picture.
3. The modal shows the user's full name.
4. The modal shows the user's email address.
5. The modal shows the user's assigned location.
6. The information shown in the modal matches the user whose profile picture is being hovered.
7. Moving the pointer away closes the modal in a predictable way that does not obstruct normal matrix usage.
8. If a data field such as location is not available for that user, the modal handles the missing value gracefully without broken layout or misleading placeholder content.
9. Opening the modal does not change any availability data or interfere with existing matrix interactions beyond the temporary hover state.

## IN-SCOPE

- Hover-triggered profile details modal from matrix header profile pictures.
- Displaying larger profile photo, full name, email, and location in the modal.
- Handling incomplete user profile data gracefully.
- Ensuring the hover interaction coexists with normal matrix navigation.

## OUT-OF-SCOPE

- Editing user details from the modal.
- Displaying permissions, password-related data, or other sensitive administrative information.
- Changing the hover behavior of other parts of the application.
- Replacing the matrix header with a permanently expanded profile card.

## ADDITIONAL INFORMATION

### Assumptions

- The header row already displays each user's compact identity content.
- The system can access the user's full name, email, location, and larger profile image variant or can reuse the same image at a larger display size.
- The hover interaction is intended for pointer-based devices; keyboard accessibility requirements may be addressed in a separate story if needed.

### Dependencies

- Story "Show user photo and name in header row" is implemented.
- Profile photo data is available.
- User profile data includes email and location information where configured.

### Validation scenarios

1. User hovers over a colleague's profile picture and sees that colleague's larger photo, full name, email, and location in the modal.
2. User moves the pointer away from the hover target and the modal closes without lingering on screen.
3. User hovers over several different profile pictures in sequence and each modal shows the correct corresponding profile details.
4. User hovers over a profile picture for an employee without an assigned location and the modal remains well-formed while indicating the absence gracefully.
5. User opens the hover modal while viewing the matrix and can continue normal matrix use once the hover state ends.