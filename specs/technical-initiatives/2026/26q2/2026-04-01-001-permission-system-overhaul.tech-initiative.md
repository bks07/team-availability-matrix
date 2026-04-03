---
status: DONE
---

# Permission System Overhaul

## What

Migrate the access control system from a flat user→permission model to a profile-based permission system inspired by Atlassian Jira's permission schemes.

Key changes:

1. **System-defined permissions** — All permissions are defined in the codebase. Administrators cannot create, edit, or delete individual permissions. The full permission catalog is rendered at runtime.
2. **Permission Profiles** — Administrators group permissions into named profiles. Each profile bundles one or more permissions from the system catalog.
3. **Profile-based assignment** — Users receive permissions exclusively through a single assigned Permission Profile. Direct user→permission assignments are eliminated.
4. **Built-in Super Admin profile** — A non-editable, non-deletable profile bundling all permissions is created automatically at system startup and auto-assigned to the first registered user (id=1).

### Permission Catalog

All permissions derived from backend handler access control requirements:

| Category | Permission Key | Description | Current Equivalent |
|---|---|---|---|
| **User Administration** | `users.list` | View list of all users in admin area | `admin` |
| | `users.create` | Create new user accounts via admin | `admin` |
| | `users.edit` | Edit user details, work schedules, bulk-assign locations | `admin` |
| | `users.delete` | Delete user accounts | `admin` |
| **Location Management** | `locations.view` | View list of locations | `manage_locations` |
| | `locations.create` | Create new locations | `manage_locations` |
| | `locations.edit` | Edit existing locations | `manage_locations` |
| | `locations.delete` | Delete locations | `manage_locations` |
| **Public Holiday Management** | `public_holidays.view` | View public holidays | `manage_public_holidays` |
| | `public_holidays.create` | Create public holidays | `manage_public_holidays` |
| | `public_holidays.edit` | Edit existing public holidays | `manage_public_holidays` |
| | `public_holidays.delete` | Delete public holidays | `manage_public_holidays` |
| **Permission Management** | `permission_profiles.view` | View permission profiles and user assignments | `super_admin` |
| | `permission_profiles.create` | Create new permission profiles | `super_admin` |
| | `permission_profiles.edit` | Edit permission profile name and permissions | `super_admin` |
| | `permission_profiles.delete` | Delete permission profiles | `super_admin` |
| | `permission_profiles.assign` | Assign or unassign profiles to/from users | `super_admin` |
| **System Settings** | `settings.manage` | Manage system settings (e.g., self-registration toggle) | `super_admin` |

**Total: 18 system-defined permissions across 5 categories.**

### Actions Not Permission-Gated (Authenticated Only, Unchanged)

- View and update own profile, photo, and password
- View availability matrix and update/delete own status entries
- Bulk status update for own entries
- Team CRUD (governed by team role, not system permissions)
- Team invitations, leave team, transfer ownership
- User search (for team invitations)

### Built-in Super Admin Profile

- **Name:** Super Admin
- **Permissions:** All 18 permissions
- **Constraints:** Cannot be edited, renamed, or deleted
- **Auto-assignment:** Assigned to the first registered user (id=1) at system startup
- **Lockout prevention:** The Super Admin profile cannot be unassigned from user id=1

### Database Schema Changes

**New tables:**

```sql
CREATE TABLE IF NOT EXISTS permission_profiles (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL UNIQUE,
	is_built_in BOOLEAN NOT NULL DEFAULT FALSE,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profile_permissions (
	profile_id BIGINT NOT NULL REFERENCES permission_profiles(id) ON DELETE CASCADE,
	permission_key TEXT NOT NULL,
	PRIMARY KEY (profile_id, permission_key)
);

CREATE TABLE IF NOT EXISTS user_permission_profiles (
	user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	profile_id BIGINT NOT NULL REFERENCES permission_profiles(id) ON DELETE RESTRICT,
	assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (user_id)
);
```

**Dropped table (after migration):**

```sql
DROP TABLE IF EXISTS user_permissions;
```

### Migration Strategy

1. Create the `permission_profiles`, `profile_permissions`, and `user_permission_profiles` tables.
2. Insert the built-in Super Admin profile with all 18 permissions.
3. Scan `user_permissions` for each user's current permission set.
4. For each unique combination of permissions found:
   a. Check if a profile with exactly those permissions already exists.
   b. If not, auto-create a custom profile named `Migrated — <permission_list>`.
5. Assign each user to the matching profile in `user_permission_profiles`.
6. Assign user id=1 to the Super Admin profile (overriding any migration-generated assignment).
7. Verify all users with prior permissions now have a profile assignment.
8. Drop the `user_permissions` table.

### Backend Refactoring

- Replace `require_permission()` to query through `user_permission_profiles` → `profile_permissions` instead of `user_permissions`.
- Replace `get_user_permissions()` to resolve permissions via the assigned profile.
- Replace `KNOWN_PERMISSIONS` and `FIRST_USER_PERMISSIONS` constants with the new 18-permission catalog.
- Update `PERMISSION_ADMIN`, `PERMISSION_MANAGE_LOCATIONS`, etc. constants to the new permission keys.
- Update all handler `require_permission()` calls to use the new permission keys.
- Update the `AuthResponse` and `PublicUser` response types to include the assigned profile name alongside the resolved permission list.

## Why

- The current flat model assigns permissions individually per user, making management tedious for large teams.
- Grouping permissions into profiles simplifies onboarding — assign one profile instead of configuring multiple permissions.
- A profile-based model provides a clear audit trail of access changes.
- Aligns with industry-standard permission systems (e.g., Atlassian Jira permission schemes).

## In-Scope

- Full permission catalog (18 permissions across 5 categories) defined in codebase.
- New database schema for permission profiles, profile permissions, and user profile assignments.
- Migration strategy from `user_permissions` to the new profile-based tables.
- Built-in Super Admin profile with lockout prevention.
- Refactoring of `require_permission()` and related auth functions to query through profiles.
- Update to all handlers to use the new permission keys.
- Update to API responses to include profile information.

## Out-of-Scope

- UI/UX redesign for permission management (covered by product-area stories).
- Integration with third-party authentication or authorization systems.
- Team-level or project-level permission schemes (teams use role-based access, not system permissions).
- Permission audit logging (covered by separate product-area story: `permission-audit-log.md`).
- Multiple profiles per user (one profile per user by design).

## Acceptance Criteria

1. All 18 system-defined permissions are registered in the codebase and available at runtime.
2. The `permission_profiles`, `profile_permissions`, and `user_permission_profiles` tables are created at startup.
3. The built-in Super Admin profile is auto-created with all 18 permissions if it does not exist.
4. The first registered user (id=1) is auto-assigned the Super Admin profile.
5. `require_permission()` resolves permissions through the user's assigned profile, not through direct `user_permissions` rows.
6. Existing `user_permissions` data is migrated to auto-generated profiles without permission loss.
7. The `user_permissions` table is dropped after successful migration.
8. All handler permission checks use the new permission keys.
9. API responses include the user's assigned profile name and resolved permissions.
10. The Super Admin profile cannot be edited, deleted, or unassigned from user id=1.
11. Users without an assigned profile have no admin-level permissions (authenticated-only actions remain functional).

## Additional Information

- Audit logging of permission changes begins from the migration point. No retroactive entries are generated for pre-migration changes.
- The permission catalog can be extended in future releases by adding new permission keys to the codebase. Existing profiles are unaffected by additions.
- Admin area access gating should be revisited after migration. The current `admin` permission check will need to be replaced with a check for any admin-area permission in the user's profile.
- If a user needs permissions from two different profiles, the administrator must create a third profile combining both permission sets. This is an intentional simplification.