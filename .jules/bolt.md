## 2025-05-14 - Database Aggregation in getUserStats
**Learning:** In Drizzle ORM, fetching full table rows to compute aggregate statistics in Node.js (via `.reduce()` and `.sort()`) introduces O(N) memory allocation and O(N log N) runtime overhead. Using Drizzle's native aggregate helpers (`count()`, `sum()`, `max()`) executes a single O(1) SQL query and transfers only 1 record over the network.
**Action:** Always prefer native SQL aggregates (`count()`, `sum()`, `max()`, `avg()`) for summary and stats endpoints rather than fetching raw rows into application memory.
