---
status: DONE
---

# Clean up availability matrix

## WHAT

Remove the hero card element above the availability matrix. Consolidate all relevant user-facing information (logged-in user name, legend, navigation) into the top navigation bar.

### Navigation bar

- Place a small, custom-designed logo at the far left of the navigation bar. It should act as the home button (navigates to the workspace).
- Show the logged-in user's display name in the navigation bar. Clicking on it opens a dropdown menu with user-related actions (e.g., log out).
- Arrange navigation elements similarly to modern web applications like Atlassian Jira: logo on the left, primary navigation links in the centre or left-aligned, and user/account actions on the right.

### Scrolling behaviour

- The navigation bar remains fixed at the top of the viewport at all times.
- All other content, including the availability matrix and any toolbar elements, scrolls normally with the page.
- The names of the users remain visible at the top when scrolling.

### Visual design

- Apply a clean, professional visual style across the entire application.
- Use the following colour palette as the design foundation:
  ```
  --sky-blue-light: #8ecae6ff;
  --blue-green: #219ebcff;
  --deep-space-blue: #023047ff;
  --amber-flame: #ffb703ff;
  --princeton-orange: #fb8500ff;
  ```
- Keep the design simple, concise, and free of unnecessary decorative elements.

## WHY

The application looks dated and the most important information does not fill the screen effectively. The hero card element takes up vertical space without adding value, and users are distracted by unnecessary design elements. Consolidating information into the navigation bar and applying a modern visual style will make the application feel more professional and easier to use.

## IN-SCOPE

- Removal of the hero card element.
- Redesign of the navigation bar to include logo, user name with dropdown, and reorganised navigation links.
- Creation of a small logo for the application.
- Applying the new colour palette across the application.
- Fixed navigation bar with scrollable page content.
- General visual polish to achieve a modern, professional look.

## OUT-OF-SCOPE

- Changes to the availability matrix data logic or API.
- New features or functionality beyond the visual rebrush.
- Changes to the admin area layout or pages.
- Mobile-specific responsive design beyond what already exists.

## ADDITIONAL INFORMATION

### Assumptions

- The availability status legend (W/V/A colour meanings) can be integrated into the matrix area itself or shown as a subtle inline element, since it no longer has a dedicated hero card.
- The user dropdown in the navigation bar replaces the current standalone log-out button.
