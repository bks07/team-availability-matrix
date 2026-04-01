# Failed to load availability data

## CURRENT BEHAVIOR

After editing values in the availability matrix and reloading the page, the system displays the following error message instead of the availability matrix:

```
Failed to load availability data: error occurred while decoding column "status_date": mismatched types; Rust type `alloc::string::String` (as SQL type `TEXT`) is not compatible with SQL type `DATE`
```

The same type mismatch issue also affects the public holidays feature, where `holiday_date` uses the same pattern.

## EXPECTED BEHAVIOR

After editing values and reloading the page, the availability matrix should load normally, displaying all employees and their availability statuses for the selected year.

Public holidays should also load and display correctly without type mismatch errors.

## IMPACT

- The availability matrix is completely unusable — no user can view or edit availability data.
- Public holiday management is also broken by the same underlying issue.
- This is a **critical** blocker since the matrix is the core feature of the application.

## STEPS TO REPRODUCE

1. Start the application with a running PostgreSQL database.
2. Register a user and log in.
3. Navigate to the availability matrix.
4. Edit one or more availability values.
5. Reload the page.
6. Observe the error message instead of the matrix.

## ADDITIONAL INFORMATION

This issue was introduced during the SQLite-to-PostgreSQL migration. The database schema was updated to use PostgreSQL-native `DATE` columns for date fields, but the corresponding Rust struct field types were not updated to match — they remain as `String`, which was compatible with SQLite's `TEXT` storage but is incompatible with PostgreSQL's `DATE` type.

Two database row structs are affected:
- The availability status row struct, where `status_date` is declared as `String` but the column is `DATE`.
- The public holiday row struct, where `holiday_date` is declared as `String` but the column is `DATE`.
