## 2026-07-04 - [Database Aggregation Optimization]
**Learning:** Fetching all rows into memory for aggregation ((N)$) is a significant bottleneck as data grows. Using Drizzle's native aggregate functions ($, $, $) shifts computation to the database engine, reducing data transfer and memory usage to (1)$.
**Action:** Always prefer SQL aggregate functions over in-memory JavaScript aggregation for computing metrics across large datasets.
