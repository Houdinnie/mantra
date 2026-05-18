## 2026-05-18 - SQL Aggregate Optimization for User Stats

**Learning:** Fetching all database rows and aggregating them in memory (e.g., using `reduce`) is inefficient as the dataset grows. Using SQL aggregate functions like `count`, `sum`, and `max` offloads the computation to the database and reduces network payload.
**Action:** Always prefer SQL aggregates for metrics. Be aware that some ORMs/drivers may return aggregate results as strings; wrap them in `Number()` for type safety.
