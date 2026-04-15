---
status: DONE
---

# Rebrush Profile & Change Password Pages

## WHAT

Polish the Profile page and Change Password page into visually refined, cohesive personal-settings experiences.

**Profile Page (`ProfilePage.tsx`):**
- Restructure the layout into a clear two-column design on desktop: photo/avatar card on the left, profile form on the right. Stack vertically on mobile.
- Avatar area: enlarge the avatar display, add a hover overlay with a camera icon to indicate clickability, and smooth the transition when uploading/cropping.
- Photo action buttons (upload, delete) should use `.btn-secondary` and `.btn-danger` with clear iconography.
- Profile form fields (title, first name, middle name, last name, email, location, default team) should use `.form-group` / `.form-input` / `.form-select` patterns with consistent spacing.
- The save button should use `.btn-primary` with a loading spinner state.
- Success and error feedback should use the `.alert` pattern.
- Add subtle section dividers or grouped fieldsets (e.g., "Personal Information", "Preferences") for visual hierarchy.

**Change Password Page (`ChangePasswordPage.tsx`):**
- Apply the same card and form styling as Profile for visual consistency.
- Add a password visibility toggle (eye icon) on each password field.
- Display inline validation: new password and confirm password mismatch highlighted in real-time.
- Submit button should match the Profile page's `.btn-primary` pattern.

**Shared Improvements:**
- Both pages should share the `.profile-layout` container with consistent max-width and vertical rhythm.
- Page headings should use design system typography tokens.

## WHY

The profile and change password pages are personal settings screens that users interact with regularly. Their current layout is functional but lacks visual refinement — the avatar section feels small, the forms have no grouped hierarchy, and the two pages use slightly different styling patterns. A polished, cohesive personal-settings experience reinforces quality and user confidence.

## ADDITIONAL INFORMATION

- Target app: `team-availability-matrix`
- Depends on: `2026-04-15-002-standardize-page-elements.rebrush.md`
- Affected files: `ProfilePage.tsx`, `ChangePasswordPage.tsx`, `PhotoCropModal.tsx`, `useProfilePage.ts`, `index.css`
- The photo crop modal (`PhotoCropModal.tsx` using `react-easy-crop`) must remain functional.
