## 2025-05-15 - [Database] Optimized Aggregate Stats Retrieval
**Learning:** The `getUserStats` function was fetching all user sessions and aggregating them in memory. In a production environment with many sessions, this creates O(N) data transfer and memory overhead.
**Action:** Use Drizzle ORM's `count()`, `sum()`, and `max()` aggregate functions to perform the calculation at the database level, reducing complexity to O(1).
