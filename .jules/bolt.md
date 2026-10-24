## 2025-05-15 - [Database Aggregation Optimization]
**Learning:** Fetching all rows from a table and aggregating in memory (e.g., using `.reduce()` or `.sort()`) is a significant bottleneck as data grows. Using SQL aggregate functions (`count`, `sum`, `max`) moves this computation to the database engine, reducing network payload and memory usage.
**Action:** Always prefer SQL-level aggregation for statistics or summary data. Wrap aggregate results in `Number()` when working with Drizzle and MySQL to ensure type consistency, as some drivers return them as strings.
