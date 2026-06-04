## 2025-05-15 - Optimize database aggregation for user stats
**Learning:** In-memory aggregation of database results (using `.reduce` or `.length` on arrays) is an O(N) operation that scales poorly as user data grows. Drizzle ORM provides SQL aggregate functions like `count`, `sum`, and `max` which allow the database to perform these calculations in O(1) time (or near-O(1) with proper indexing), significantly reducing data transfer and application memory usage.

**Action:** Always prefer SQL aggregate functions (`count`, `sum`, `avg`, `min`, `max`) for computing statistics over collections of records instead of fetching all records and aggregating in application code.
