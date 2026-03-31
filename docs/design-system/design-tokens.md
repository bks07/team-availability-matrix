# Design System: Tokens & Specifications

## 1. Color Palette

The base color palette defines the literal hex values used across the application. These should primarily be referenced via semantic tokens.

### Brand & Accents
- **Blue-Green** (Teal): `#219ebc` *(Used for W status solid accent)*
- **Amber Flame** (Amber): `#ffb703` *(Used for V status solid accent)*
- **Princeton Orange**: `#fb8500` *(Used for A status solid accent and Danger buttons)*
- **Sky Blue Light**: `#8ecae6`
- **Deep Space Blue**: `#023047` *(Used for Dark text on pale backgrounds)*
- **Accent Primary**: `#1a73e8` (Light) / `#4a9eff` (Dark)

### Base Neutrals (Light Mode)
- **Backgrounds**: `#ffffff` (Primary), `#f5f5f5` (Secondary), `#fafafa` (Tertiary)
- **Text**: `#333333` (Primary), `#666666` (Secondary), `#999999` (Muted)
- **Borders**: `#e0e0e0` (Default), `#eee` (Light), `#d0d0d0` (Input)

### Base Neutrals (Dark Mode)
- **Backgrounds**: `#1a1a2e` (Primary), `#16213e` (Secondary), `#1e2a45` (Tertiary)
- **Text**: `#e0e0e0` (Primary), `#b0b0b0` (Secondary), `#808080` (Muted)
- **Borders**: `#2a3a55` (Default), `#253352` (Light)

---

## 2. Status Colors (Unified W/V/A)

**Important Update:** Status colors have been unified across the Matrix, Calendar badges, and Navbar buttons. The canonical style uses a pale background with dark readable text and a solid accent icon/border.

| Status | Background Token (`--status-*-bg`) | Text Token (`--status-*-text`) | Solid / Accent Token (`--status-*-solid`) |
| --- | --- | --- | --- |
| **W (Working)** | `#e6f5fb` *(pale blue-green)* | `var(--deep-space-blue)` | `var(--blue-green)` |
| **V (Vacation)**| `#fff8e6` *(pale cream)* | `var(--deep-space-blue)` | `var(--amber-flame)` |
| **A (Absence)** | `#fff0e6` *(pale orange)* | `#b35e00` | `var(--princeton-orange)` |

*Dark mode values for status backgrounds should be adjusted (e.g., color-mix with dark background or specialized hexes like `#13384a` for W) in subsequent implementation phases. Currently, dark mode relies on the global semantic overrides where applicable.*

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

### Grid & Matrix Specific
- `--row-today-bg`: Background highlight for today's column/row
- `--row-weekend-bg`: Background highlight for weekends
- `--row-today-weekend-bg`: Intersect background for today falling on a weekend
- `--holiday-cell-bg`: Standardized holiday color (currently hardcoded `#fff3cd`)

### Elevation & Shadow
- `--shadow-color`: Baseline shadow RGB
- `--shadow-heavy`: Deep popover shadow RGB
- `--dropdown-shadow`: standard UI popover shadow composite

---

## 4. Component Token Mapping

| Component | Target Tokens used | Notes |
| --- | --- | --- |
| **Cards (`.auth-card`, `.matrix-card`)** | `--bg-card`, `--shadow-color`, `--text-primary` | Ensures dark-mode contrast. |
| **Navbar** | `--navbar-bg`, `--navbar-text`, `--border-color` | Fixed dark palette natively. |
| **Burger Menu (Dropdown)** | `--bg-card`, `--text-primary`, `--border-color`, `--bg-hover`, `--dropdown-shadow` | Needs refactoring from hardcoded hex. |
| **Inputs / Selects** | `--input-bg`, `--border-input`, `--text-primary`, `--border-focus` | |
| **Status Pills / Badges** | `--status-*-bg`, `--status-*-text`, `--status-*-solid` | Unifies W/V/A logic across UI. |
| **WeeklyCalendar Badges** | `--status-*-bg`, `--status-*-text`, `--status-*-solid` | *Requires update* from hardcoded Tailwind colors. |
| **Matrix Grid Layout** | `--bg-card`, `--border-light`, `--row-today-bg`, `--row-weekend-bg` | Ensure sticky headers use appropriate solid tokens. |

---

## 5. Hardcoded Color Inventory & Remap Rules

The following existing hardcoded colors need to be replaced with their respective semantic tokens during implementation:

1. **Burger Menu Dropdown**
   - Background `#ffffff` ➡ `var(--bg-card)`
   - Border `#e5e7eb` ➡ `var(--border-color)`
   - Text `#374151` ➡ `var(--text-primary)`
   - Hover background `#f3f4f6` ➡ `var(--bg-hover)`

2. **Weekly Calendar Badges (`.calendar-status-badge`)**
   - Green (W) `#dcfce7`/`#166534` ➡ `var(--status-w-bg)` / `var(--status-w-text)`
   - Blue (V) `#dbeafe`/`#1e40af` ➡ `var(--status-v-bg)` / `var(--status-v-text)`
   - Orange (A) `#ffedd5`/`#9a3412` ➡ `var(--status-a-bg)` / `var(--status-a-text)`

3. **Navbar Buttons (`.navbar-status-btn`)**
   - Green `#4caf50` ➡ `var(--status-w-solid)`
   - Blue `#2196f3` ➡ `var(--status-v-solid)`
   - Orange `#f57c00` ➡ `var(--status-a-solid)`

4. **Holiday Cells / Rows**
   - Highlight `#fff3cd` ➡ Needs a new token: `--holiday-bg: #fff3cd;` (and dark mode equivalent).
   - Mixed holiday backgrounds (e.g., `color-mix(in srgb, #fff3cd 70%, var(--row-weekend-bg))`) ➡ Utilize `--holiday-bg` instead of `#fff3cd`.

5. **Inline Styles in `.tsx`**
   - `SettingsPage.tsx`: `border: '1px solid var(--border-light)'` ➡ Should be a standard CSS utility class, but token is correct.
   - `HolidaysPage.tsx`: `marginBottom: '1rem'` ➡ Replace with `var(--spacing-md)` or leave structural inline styles as needed if not tokenizing spacing yet.

---

## 6. Key Design Decisions

1. **Burger Menu Light/Dark Compliance**: The Burger menu currently lacks dark mode support. It must adopt standard component tokens (`--bg-card`, `--text-primary`, `--border-color`) to guarantee light/dark toggle compliance.
2. **Unified Status Colors (The Canonical Pill)**: To reduce cognitive load and design debt, the pale-background + heavy-text combination native to the Availability Matrix will be the single source of truth for all status indicators across the app (Matrix, Weekly Calendar, Nav Toggles). Extraneous green, deep blue, Tailwind-esque combinations are deprecated.
3. **Semantic Override Approach over Duplication**: Theme toggling will continue to rely entirely on CSS Custom Properties (`[data-theme="dark"]`). Component class names will remain strictly semantic (i.e., `.matrix-card`, `.status-pill`) without hardcoded visual states.
