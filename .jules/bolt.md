## 2025-05-15 - [Database Aggregation Anti-pattern]
**Learning:** The `getUserStats` function was fetching all user sessions into memory to calculate counts and sums, which is an $O(N)$ operation that scales poorly with chat history size.
**Action:** Always use SQL aggregate functions (`count`, `sum`, `max`) for statistics to ensure $O(1)$ data transfer and offload computation to the database.

## 2025-05-15 - [Drizzle/MySQL Aggregate Type Casting]
**Learning:** Drizzle SQL aggregates (like `count` or `sum`) on MySQL often return results as strings in the driver, even if the underlying column is numeric.
**Action:** Wrap aggregate results in `Number()` when assigning to numeric TypeScript fields to maintain type safety and avoid runtime bugs.
