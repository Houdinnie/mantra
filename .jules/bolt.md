## 2025-05-14 - Optimizing Database Aggregations
**Learning:** Fetching all rows for application-side aggregation creates a significant performance bottleneck (O(N) complexity) as data grows. Using SQL aggregate functions like `count`, `sum`, and `max` shifts the burden to the database engine and reduces data transfer, resulting in O(1) complexity for the application.
**Action:** Always prefer SQL-level aggregation for stats and metrics. Use the `setDb` helper to mock database responses in unit tests to avoid live connection requirements.
