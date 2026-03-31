# Design System: Tokens & Specifications

## 1. Color Palette

The base color palette defines the literal hex values used across the application. These are referenced via semantic CSS Custom Properties (`var(--token-name)`).

### Brand & Accents
- **Blue-Green** (Teal): `#219ebc` *(Used for W status solid accent)*
- **Amber Flame** (Amber): `#ffb703` *(Used for V status solid accent)*
- **Princeton Orange**: `#fb8500` *(Used for A status solid accent and Danger buttons)*
- **Sky Blue Light**: `#8ecae6`
- **Deep Space Blue**: `#023047` *(Used for Dark text on pale backgrounds)*
- **Accent Primary**: `#1a73e8` (Light) / `#4a9eff` (Dark)
- **Accent Primary Hover**: `#1557b0` (Light) / `#3a8eef` (Dark)

### Base Neutrals (Light Mode)
- **Backgrounds**: `#ffffff` (Primary), `#f5f5f5` (Secondary), `#fafafa` (Tertiary), `#f0f0f0` (Hover)
- **Text**: `#333333` (Primary), `#666666` (Secondary), `#999999` (Muted), `#1a1a2e` (Navbar text)
- **Borders**: `#e0e0e0` (Default), `#eee` (Light), `#d0d0d0` (Input)
- **Shadows**: `rgba(0, 0, 0, 0.1)` (Base), `rgba(0, 0, 0, 0.15)` (Heavy)
- **Overlays**: `rgba(0, 0, 0, 0.5)`

### Base Neutrals (Dark Mode)
- **Backgrounds**: `#1a1a2e` (Primary), `#16213e` (Secondary), `#1e2a45` (Tertiary), `#253352` (Hover)
- **Text**: `#e0e0e0` (Primary), `#b0b0b0` (Secondary), `#808080` (Muted)
- **Borders**: `#2a3a55` (Default), `#253352` (Light)
- **Shadows**: `rgba(0, 0, 0, 0.3)` (Base), `rgba(0, 0, 0, 0.4)` (Heavy)
- **Overlays**: `rgba(0, 0, 0, 0.7)`

---

## 2. Status Colors (Unified W/V/A)

Status colors are unified across the Matrix, Calendar badges, and Navbar buttons. The canonical style uses a pale background with dark readable text and a solid accent icon/border.

| Status | Background Token (`--status-*-bg`) | Text Token (`--status-*-text`) | Solid / Accent Token (`--status-*-solid`) |
| --- | --- | --- | --- |
| **W (Working)** | `#e6f5fb` | `var(--deep-space-blue)` | `var(--blue-green)` |
| **V (Vacation)**| `#fff8e6` | `var(--deep-space-blue)` | `var(--amber-flame)` |
| **A (Absence)** | `#fff0e6` | `#b35e00` | `var(--princeton-orange)` |

*Note: The status colors scale effectively across both themes currently, so no dark-mode specific overrides exist for status UI outside of structural container updates.*

---

## 3. Semantic Tokens Reference

Use these variables (`var(--token-name)`) for all styling.

### Backgrounds
- `--bg-primary`: Core page background
- `--bg-secondary`: Sub-panels, toolbars, sidebar
- `--bg-tertiary` / `--bg-subtle`: Subtle alternating rows, read-only inputs
- `--bg-hover`: Standard hover state for list items and secondary buttons
- `--bg-card`: Card surfaces (`var(--card-bg)`)
- `--bg-overlay`: Background for modals/dialogs (`var(--overlay-bg)`)
- `--navbar-bg`: Main navigation background

### Typography (Text)
- `--text-primary`: Standard heading and body text
- `--text-secondary`: Subtitles, legends, secondary data
- `--text-muted`: Disabled text, placeholders
- `--text-inverse`: Text on solid bright backgrounds (e.g., white text on primary buttons)
- `--text-link`: Clickable text (`var(--accent-primary)`)

### Borders & Rings
- `--border-color`: Standard component borders
- `--border-light`: Subtle separators (e.g., matrix grid lines)
- `--border-input`: Form inputs baseline border
- `--border-focus`: Active/Focus ring color (`var(--accent-primary)`)
- `--focus-ring`: Reusable box-shadow for keyboard accessible focus states

### Buttons
- **Primary**: `--btn-primary-bg`, `--btn-primary-text`, `--btn-primary-hover`
- **Secondary**: `--btn-secondary-bg`, `--btn-secondary-border`, `--btn-secondary-text`, `--btn-secondary-hover`
- **Danger**: `--btn-danger-bg`, `--btn-danger-border`, `--btn-danger-text`, `--btn-danger-hover`

### Grid, Matrix & Calendar
- `--row-today-bg`: `#e5f4fa`
- `--row-weekend-bg`: `#f4f8fb`
- `--row-today-weekend-bg`: `#dcf0f8`
- `--holiday-bg`: `#fff3cd` (Light) / `#4b4426` (Dark)

### Elevation & Shadow
- `--shadow-color`: Baseline shadow styling RGB mapping
- `--shadow-heavy`: Deep popover shadow styling RGB mapping
- `--dropdown-shadow`: Standard UI popover shadow composite (`0 4px 16px var(--shadow-color)`)

---

## 4. Component Token Mapping

| Component | Target Tokens used | Notes |
| --- | --- | --- |
| **Cards (`.auth-card`, `.matrix-card`)** | `--bg-card`, `--shadow-color`, `--text-primary` | Ensures dark-mode contrast. |
| **Navbar** | `--navbar-bg`, `--navbar-text`, `--border-color` | Fixed dark palette natively (`#1a1a2e` in light, `#0f0f1e` in dark). |
| **Burger Menu (Dropdown)** | `--bg-card`, `--text-primary`, `--border-color`, `--bg-hover`, `--dropdown-shadow` | Fully refactored and semantic. |
| **Inputs / Selects** | `--input-bg`, `--border-input`, `--text-primary`, `--border-focus` | Standard input treatments. |
| **Status Pills / Badges** | `--status-*-bg`, `--status-*-text`, `--status-*-solid` | Unifies W/V/A logic across UI. |
| **WeeklyCalendar Badges** | `--status-*-bg`, `--status-*-text`, `--status-*-solid` | Refactored from hardcoded Tailwind colors. |
| **Matrix Grid Layout** | `--bg-card`, `--border-light`, `--row-today-bg`, `--row-weekend-bg` | Ensure sticky headers use appropriate solid tokens. |

---

## 5. Resolved Hardcoded Color Inventory

**Implementation Status: Complete**

The previous list of hardcoded colors has been fully resolved and replaced with semantic tokens across the application.

1. **Burger Menu Dropdown** ➡ Replaced with `--bg-card`, `--border-color`, `--text-primary`, and `--bg-hover`. Theme toggling now natively supported.
2. **Weekly Calendar Badges (`.calendar-status-badge`)** ➡ Replaced hardcoded Tailwind-esque colors with unified `--status-*-bg` and `--status-*-text` tokens.
3. **Navbar Buttons (`.navbar-status-btn`)** ➡ Replaced generic HEX greens/blues with standardized `--status-*-solid` definitions.
4. **Holiday Cells / Rows** ➡ Added and adopted `--holiday-bg` ensuring dark-mode accessibility (`#4b4426` in dark theme).
5. **Inline Styles in `.tsx`** ➡ Resolved global component level color injections to token system usage.

---

## 6. Key Design Decisions

1. **Burger Menu Light/Dark Compliance**: Adopted standard component tokens (`--bg-card`, `--text-primary`, `--border-color`) to guarantee seamless light/dark toggle capability.
2. **Unified Status Colors (The Canonical Pill)**: Extraneous visual styles for status (green, deep blue, Tailwind combinations) have been completely deprecated. The pale-background + heavy-text combination native to the Availability Matrix is established as the single source of truth for all status indicators across the app (Matrix, Weekly Calendar, Nav Toggles).
3. **Semantic Override Approach over Duplication**: Theme toggling strictly relies on CSS Custom Properties inside `[data-theme="dark"]`. Component class names remain strictly semantic (i.e., `.matrix-card`, `.status-pill`) avoiding duplication or hardcoded visual behaviors.
