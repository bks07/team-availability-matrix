---
status: DONE
---

# Bulk change of day values not implemented

## STATUS

**Closed — feature already implemented.**

## CURRENT BEHAVIOR

The availability matrix does not provide a way to bulk change day values for a single user.

Users can only edit values one by one.

## EXPECTED BEHAVIOR

The availability matrix should provide a bulk-change action for day values of a single user.

Users should be able to apply the selected value to multiple day entries in one action.

## IMPACT

- Managing availability is slower because users must update many cells manually.
- Repetitive single-cell editing increases the chance of user error.
- Larger updates become tedious and time-consuming.
- The matrix workflow does not match expected productivity for bulk edits.

## STEPS TO REPRODUCE

1. Log in as user.
2. Navigate to availability matrix.
3. Observe that feature to bulk change the day values of a single user is not available.

## RESOLUTION

Investigation confirmed that the bulk-change feature is fully available. Users can select a contiguous range of days in their own column by shift-clicking, then apply a status (W, V, A) or clear the selection in one action. Options to skip weekends and public holidays are also available.

The bug report was filed before the feature was discovered. No code changes were needed.

## ADDITIONAL INFORMATION

This issue is visible in the availability matrix workflow.

The expected bulk-change capability is not available in the user interface.

There is an existing user story at \`/docs/product-areas/workspace/availability-matrix/bulk-change-of-day-values.md\`.
It describes the required functionality.
