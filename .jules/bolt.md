## 2026-05-29 - Optimize getUserStats with SQL aggregates
**Learning:** In-memory aggregation of database results (like `.reduce()` on an array of rows) is a performance anti-pattern as it scales poorly with data size. Drizzle ORM provides a clean way to use SQL aggregate functions (`count`, `sum`, `max`) which offloads computation to the database and reduces data transfer.
**Action:** Always prefer SQL aggregates for metrics and statistics over manual in-memory calculations.
