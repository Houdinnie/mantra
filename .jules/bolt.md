## 2025-05-15 - Optimize getUserStats with SQL aggregates
**Learning:** In-memory aggregation of database results (using `.reduce()` or `.sort()` on large arrays) scales poorly as data grows. Drizzle ORM provides `sql` and aggregate functions (`count`, `sum`, `max`) that push this work to the database engine.
**Action:** Always prefer SQL aggregates for statistics and counters over fetching full record sets.

## 2025-05-15 - Critical test blockers
**Learning:** Syntax errors in core files (like `agentLoop.ts`) can prevent Vitest from running even unrelated tests due to transformation failures.
**Action:** Address critical syntax errors or missing cases in core logic if they block the verification of performance optimizations, but document them as necessary infrastructure fixes.
