# Transfer team ownership

## STORY

**IN ORDER TO** step back from managing a team while keeping it alive
**AS** the team owner
**I WANT TO** hand over ownership to another team member

## ACCEPTANCE CRITERIA

1. Only the current team owner can initiate an ownership transfer.
2. The owner can transfer ownership to any accepted team member (regular member or administrator).
3. After the transfer the previous owner becomes a regular **member** of the team.
4. The new owner receives the full set of owner capabilities immediately.
5. The team continues to have exactly one owner at all times (atomic swap).
6. The previous owner receives confirmation that the transfer was successful.
7. The ownership change is immediately reflected in the member list for all team members.

## IN-SCOPE

- Transferring ownership to another team member.
- Demoting the previous owner to regular member.
- Atomic role swap (no moment where the team has zero or two owners).

## OUT-OF-SCOPE

- Transferring ownership to someone who is not a member of the team.
- Requiring acceptance from the new owner before the transfer completes.

## ADDITIONAL INFORMATION

### Assumptions

- The transfer is executed in a single transaction to maintain the single-owner invariant.
- No confirmation step is required from the receiving member; the transfer is immediate.

### Dependencies

- Create team and team owner role features are implemented.
- At least one other accepted member exists in the team.

### Validation scenarios

1. Owner transfers ownership to member A — member A becomes owner, previous owner becomes member.
2. Owner transfers ownership to admin B — admin B becomes owner, previous owner becomes member.
3. Owner tries to transfer to themselves — action is blocked or not available.
4. Owner is the only member — transfer option is not available (no eligible target).
5. Admin tries to transfer ownership — action is not available.
