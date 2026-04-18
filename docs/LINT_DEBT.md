# Lint Debt Process

Run the following auto-fix passes before closing this ticket:

- `pnpm -C apps/mobile lint --fix`
- `pnpm -C apps/api lint --fix`

## Findings Table

| File | Rule | Description | Auto-fixable |
| --- | --- | --- | --- |
| _TBD after lint run_ |  |  |  |

All auto-fixable warnings must be committed before this ticket is closed.

## Remaining Manual-Fix Warnings

Track warnings that need human judgment (for example `@typescript-eslint/no-explicit-any` or complex-hooks unused variables) in this section after running lint.
