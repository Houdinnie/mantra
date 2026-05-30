## 2025-05-15 - [Database] Optimize getUserStats with SQL aggregates
**Learning:** Fetching all rows and aggregating in memory (e.g., using `.length`, `.reduce`, and `.sort`) is a significant performance bottleneck as data grows. Drizzle SQL aggregates (`count`, `sum`, `max`) provide a much more efficient way to compute these values directly in the database.
**Action:** Always prefer SQL aggregate functions over in-memory processing for statistics and summaries.
