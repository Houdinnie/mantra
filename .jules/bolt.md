## 2025-05-14 - Optimized getUserStats with SQL Aggregates
**Learning:** The `getUserStats` function was previously fetching all chat sessions for a user into memory to calculate totals and find the last active date. This is an O(N) operation in terms of data transfer and memory, where N is the number of sessions. By using SQL aggregate functions (`count`, `sum`, `max`), we reduce this to O(1) data transfer and leverage the database's optimized aggregation.

**Action:** Always prefer SQL aggregate functions over in-memory aggregation for dashboard stats and summaries.

## 2025-05-14 - Mocking Database with Drizzle/ESM
**Learning:** Testing functions that call `getDb()` internally can be challenging due to ESM mocking limitations. Adding a `setDb` helper to the database module allows for clean dependency injection in unit tests without complex mock setups.

**Action:** Include a `setDb` or similar provider pattern in the database module to facilitate unit testing.
