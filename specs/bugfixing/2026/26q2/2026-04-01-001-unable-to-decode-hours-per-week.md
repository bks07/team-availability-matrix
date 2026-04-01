---
status: DONE
---

# Unable to decode hours per week

## CURRENT BEHAVIOR

I edited the hours per week of one of the users to 40 hours. Since then, I experience the following bug.

After logging in and being brought to the availability matrix, the system displays the following:

```
Failed to load work schedules: error occurred while decoding column "hours_per_week": mismatched types; Rust type `core::option::Option<f64>` (as SQL type `FLOAT8`) is not compatible with SQL type `NUMERIC`
```

## EXPECTED BEHAVIOR

The system should correctly decode and display the "hours per week" value for all users without errors. The availability matrix should load successfully, and no decoding issues should occur.

## IMPACT

- Users are unable to view or edit the availability matrix.
- This issue blocks critical workflows for managing team schedules.
- It creates confusion and reduces trust in the system's reliability.

## STEPS TO REPRODUCE

1. Log in as an admin user.
2. Navigate to the "User Management" section.
3. Edit the "hours per week" value for any user to 40 hours.
4. Save the changes.
5. Log out and log back in.
6. Navigate to the availability matrix.

## ADDITIONAL INFORMATION

- This issue may be related to a mismatch between the Rust type `Option<f64>` and the SQL type `NUMERIC` in the database schema.
- The `hours_per_week` column in the database should be reviewed to ensure compatibility with the expected Rust type.
- Consider adding validation to prevent incompatible data types from being saved.
