## 2025-05-14 - [Database aggregation vs In-memory aggregation]
**Learning:** Functions like `getUserStats` that aggregate data across many rows should use SQL aggregate functions (`count`, `sum`, `max`) from `drizzle-orm` instead of fetching all rows and aggregating in memory. This is critical for performance as the dataset grows.
**Action:** Always check if a query fetching many rows can be replaced by an aggregate query when only summary data is needed.

## 2025-05-14 - [Testing with Drizzle and ESM]
**Learning:** `vi.spyOn` or `vi.mock` on local modules can be tricky with ESM. Adding a `setDb` helper to the database module allows for clean dependency injection and mocking in tests without fighting the module system.
**Action:** Use a `setDb` pattern for database mocking in this codebase to ensure tests are reliable and easy to write.
