## 2025-05-14 - SQL Aggregates and Drizzle Type Casting
**Learning:** Drizzle ORM SQL aggregate functions (like `count` and `sum`) on a MySQL backend may return result values as strings even when typed as numbers in the schema or the `sql<number>` template. This can cause type mismatches or unexpected behavior in the application logic.
**Action:** Always wrap the results of SQL aggregate functions in `Number()` when assigning them to numeric fields to ensure type consistency and runtime safety.

## 2025-05-14 - Clean PR Scope in Shared Environments
**Learning:** Running `pnpm install` or fixing unrelated syntax errors (like the one found in `server/_core/agentLoop.ts`) can introduce noise into a performance-focused PR, making review difficult.
**Action:** Use `git restore` to revert unrelated changes in `pnpm-lock.yaml` and non-performance related files before submission. Address blockers locally to enable testing but exclude them from the final PR unless they are part of the optimization.
