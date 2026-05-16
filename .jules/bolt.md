## 2025-05-14 - Optimized getUserStats with SQL Aggregates
**Learning:** Fetching all rows from a table (like `chat_sessions`) and aggregating them in TypeScript is a performance anti-pattern that leads to $O(N)$ memory usage and network transfer. SQL aggregate functions (`count`, `sum`, `max`) are significantly more efficient.
**Action:** Always prefer SQL aggregates for computing statistics. In Drizzle, use `sql<T>` template literals for counts and sums on MySQL to ensure correct typing.
