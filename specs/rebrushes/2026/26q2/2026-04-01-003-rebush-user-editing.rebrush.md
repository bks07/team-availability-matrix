---
status: DONE
---

# Rebrush User Editing

## What
- Replace inline editing of user profiles in the user management table with a modal window.
- The modal window should include all fields used in a user profile.
- Add a separate button with a key symbol for resetting the user password.
- The "Change Password" modal should include:
  - Title: "Change Password"
  - User's name and email address displayed below the title for verification.
  - A password input field for entering the new password.
  - A confirmation button to apply the change.
- Add a new column to the user management table for working days and hours:
  - The cell displays 7 small points in a row, representing Monday to Sunday.
  - Workdays are displayed in a distinct color, while non-working days are greyed out.
  - Below the points, the working hours per week are displayed in a slightly smaller monospace font.
  - The contents of the cell are centered.

## Why
- Improve consistency and usability by aligning with modal-based workflows used elsewhere in the application.
- Ensure administrators can verify user details before applying sensitive changes like password resets.
- Enhance the user experience by separating profile editing and password management into distinct workflows.
- Provide a clear and intuitive visual representation of user working days and hours.

## Additional Information
- Related user stories in the `specs/product-areas/administration/permission-management/` folder need to be updated to reflect these changes.
- New user stories may be required for the "Change Password" modal and the working days/hours column.