## 2025-05-14 - [SQL Aggregation for Stats]
**Learning:** Fetching all rows for a user and aggregating in-memory (O(N)) is a significant bottleneck as data grows. Using native SQL aggregate functions like count(), sum(), and max() reduces this to O(1) complexity at the application layer and minimizes network overhead.
**Action:** Always prefer database-level aggregation for metrics and statistics rather than retrieving raw rows.
