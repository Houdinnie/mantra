## 2025-05-15 - Optimize getUserStats with SQL aggregates

**Learning:** Fetching all records and aggregating in JavaScript (O(N) data transfer) is a common bottleneck when using ORMs like Drizzle. SQL aggregate functions (`count`, `sum`, `max`) significantly reduce network and memory overhead.

**Action:** Always prefer SQL aggregate functions for statistics and summaries. Wrap results in `Number()` when using Drizzle with MySQL to ensure type consistency, as it may return aggregates as strings.
