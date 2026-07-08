## 2025-05-14 - [Database Aggregation]
**Learning:** The `getUserStats` function was fetching all user sessions and aggregating in-memory. In Drizzle ORM with MySQL, it is significantly more efficient to use `count()`, `sum()`, and `max()` helpers to perform these operations at the database level.
**Action:** Always check for opportunities to replace in-memory array operations (`.length`, `.reduce`, `.sort`) with SQL aggregate functions when dealing with database result sets.

## 2025-05-14 - [Broken Agent Loop Switch Case]
**Learning:** A missing `case "task_complete":` in `server/_core/agentLoop.ts` caused `vite:esbuild` transformation errors during test execution, even for unrelated files.
**Action:** When adding or modifying tools in the agent loop, ensure the `switch` statement is syntactically valid and exhaustive to prevent global build/test failures.
