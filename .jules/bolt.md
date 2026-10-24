## 2025-05-15 - [Database aggregation in getUserStats]
**Learning:** Fetching all rows from a database table to perform aggregation in memory (counting, summing, finding max) is a major performance bottleneck as the data grows (O(N) data transfer and computation). Using SQL aggregate functions (`count`, `sum`, `max`) offloads this work to the database, resulting in O(1) data transfer and much faster execution.
**Action:** Always prefer SQL aggregate functions for statistics and summary data instead of in-memory aggregation.
