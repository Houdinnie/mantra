
## 2026-05-11 - SQL Aggregates for User Stats
**Learning:** Fetching all rows to aggregate in TypeScript (e.g., using `.reduce`) is a performance anti-pattern that leads to O(N) data transfer and memory overhead. Using SQL aggregate functions (`count`, `sum`, `max`) is much more efficient (O(1)).
**Action:** Always prefer SQL aggregates for computing totals or summaries from the database. Wrap aggregate results in `Number()` when using Drizzle with MySQL to ensure type consistency.

## 2026-05-11 - SQL Aggregates for User Stats
**Learning:** Fetching all rows to aggregate in TypeScript (e.g., using `.reduce`) is a performance anti-pattern that leads to O(N) data transfer and memory overhead. Using SQL aggregate functions (`count`, `sum`, `max`) is much more efficient (O(1)).
**Action:** Always prefer SQL aggregates for computing totals or summaries from the database. Wrap aggregate results in `Number()` when using Drizzle with MySQL to ensure type consistency.
