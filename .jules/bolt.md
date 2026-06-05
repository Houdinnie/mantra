## 2025-05-14 - Optimized getUserStats with SQL aggregates
**Learning:** The `getUserStats` function was previously fetching all session records for a user and aggregating them in memory (O(N) where N is the number of sessions). For users with long chat histories, this is a significant bottleneck. Using Drizzle's `count`, `sum`, and `max` functions moves this computation to the database.
**Action:** Always prefer SQL aggregate functions over in-memory aggregation for database-backed statistics.

## 2025-05-14 - Database Mocking with Drizzle
**Learning:** Mocking Drizzle's chaining API (`select().from().where()`) can be complex. Providing a `setDb` helper in `server/db.ts` allows for easier dependency injection in tests, bypassing ESM mocking limitations for internal calls.
**Action:** Use `setDb` pattern for database mocking in unit tests to ensure they remain fast and isolated.
