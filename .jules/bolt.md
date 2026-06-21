## 2025-06-21 - Aggregating stats in SQL vs Memory
**Learning:** In-memory aggregation of database records (e.g., using `reduce` on a result set) scales poorly as the number of records grows, leading to O(N) memory and data transfer overhead. Using SQL aggregate functions like `count`, `sum`, and `max` offloads this work to the database and reduces the transfer to O(1) rows.
**Action:** Always check if summary statistics can be computed directly in the database before fetching rows for manual processing.

## 2025-06-21 - Mocking Drizzle with ESM
**Learning:** Direct ESM mocking of the database instance can be flaky in some environments. Adding a simple `setDb` helper in the database module allows for reliable dependency injection during unit tests.
**Action:** Use a `setDb` pattern for testability in Drizzle/Node.js projects to bypass module mocking limitations.
