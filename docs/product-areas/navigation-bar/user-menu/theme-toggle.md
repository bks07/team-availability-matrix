# Theme toggle

## STORY

**IN ORDER TO** use the application comfortably in different lighting conditions
**AS** an authenticated employee
**I WANT TO** switch between a light and a dark theme from the user menu

## ACCEPTANCE CRITERIA

1. The user-menu dropdown includes a theme toggle item (e.g. "Dark mode" switch or a sun/moon icon toggle).
2. Toggling the switch immediately applies the selected theme to the entire application without a page reload.
3. The selected theme preference is persisted in `localStorage` so it survives page refreshes and future sessions.
4. On first visit (no stored preference) the application defaults to the light theme.
5. The toggle reflects the currently active theme (e.g. switch is "on" when dark mode is active).
6. The dropdown remains open after toggling so the employee can see the effect and optionally toggle back.

## IN-SCOPE

- Light and dark theme definitions (CSS variables or equivalent).
- Toggle control in the user-menu dropdown.
- Client-side persistence of the preference.

## OUT-OF-SCOPE

- Syncing theme preference to the backend / user profile.
- Respecting the operating system's prefers-color-scheme by default (potential future enhancement).
- Per-page or per-component theme overrides.
- Additional themes beyond light and dark.

## ADDITIONAL INFORMATION

### Assumptions

- The application's CSS is structured to support theming via a top-level class or data attribute (e.g. `data-theme="dark"`).
- The `localStorage` key used is `availability-matrix.theme`.

### Dependencies

- User menu core feature is implemented.

### Validation scenarios

1. User opens the dropdown and toggles dark mode on — the page switches to a dark colour scheme immediately.
2. User refreshes the page — dark mode is still active.
3. User toggles dark mode off — the page reverts to the light theme.
4. New user with no stored preference — the light theme is applied.
