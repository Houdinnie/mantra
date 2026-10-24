## 2026-06-17 - SQL Aggregates for User Stats
**Learning:** In the initial implementation, `getUserStats` fetched all user sessions into memory and aggregated them using `reduce` and `sort`. This is inefficient for users with many sessions. Using SQL aggregate functions like `count()`, `sum()`, and `max()` moves this work to the database and reduces network overhead.
**Action:** Always check if collection-wide statistics can be computed via SQL aggregates before fetching data to the application layer.
