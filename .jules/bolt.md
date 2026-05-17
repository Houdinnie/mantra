
## 2026-05-17 - SQL Aggregates for User Stats
**Learning:** Fetching all database rows and aggregating them in memory (e.g., using `reduce`) is inefficient as it increases data transfer and memory usage linearly with the number of rows.
**Action:** Use SQL aggregate functions (`count`, `sum`, `max`) to perform computations on the database side. Wrap Drizzle's SQL aggregate results in `Number()` as MySQL may return them as strings.
