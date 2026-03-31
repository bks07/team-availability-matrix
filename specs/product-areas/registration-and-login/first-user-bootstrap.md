# First user bootstrap

## STORY

**IN ORDER TO** set up and administer the system from the very first use
**AS** the first person to register
**I WANT TO** be automatically granted super-administrator privileges

## ACCEPTANCE CRITERIA

1. When the first user registers (user ID = 1), all available permissions are granted automatically: `admin`, `manage_locations`, `manage_public_holidays`, and `super_admin`.
2. The permission grant happens atomically as part of the registration transaction — if it fails, the registration is rolled back.
3. Subsequent users (ID > 1) do not receive any automatic permissions.
4. The first user's permissions are included in the authentication response immediately after registration.
5. The first user can access the administration area right after registration without any manual intervention.

## IN-SCOPE

- Detecting that the newly registered user is the first user.
- Automatically assigning all permissions to the first user.
- Including the permissions in the registration response.

## OUT-OF-SCOPE

- Resetting or reassigning the bootstrap role if the first user is deleted.
- A dedicated setup wizard or onboarding flow.
- Allowing the first user to choose which permissions to activate.

## ADDITIONAL INFORMATION

### Rationale

On a fresh installation there is no administrator to grant permissions. The first registered user must be able to administer the system so that further configuration (locations, public holidays, user management, self-registration settings) can proceed.

### Implementation note

The check should be based on the user ID returned by the INSERT, not on a count query, to avoid race conditions with concurrent registrations.
