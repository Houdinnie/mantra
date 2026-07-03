## 2025-05-14 - [Optimize getUserStats with SQL Aggregates]

**Learning:** Replacing in-memory aggregation of database results with SQL aggregate functions (`count`, `sum`, `max`) significantly improves performance by reducing data transfer and memory usage from O(N) to O(1).
**Action:** Always prefer database-level aggregation for metrics and statistics. Ensure that numeric results from SQL aggregates are explicitly cast to `Number` in TypeScript, as some database drivers (like `mysql2`) may return them as strings.
