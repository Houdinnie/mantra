## 2025-05-15 - SQL Aggregation for User Metrics
**Learning:** Fetching all rows and aggregating in memory (O(N)) is a common bottleneck as datasets grow. Drizzle ORM provides native SQL aggregate functions like `count()`, `sum()`, and `max()` which push this work to the database (O(1) data transfer).
**Action:** Always prefer SQL-level aggregation for counts, sums, and extrema over `array.reduce()` or `array.length` on full result sets.

## 2025-05-15 - Unit Testing with Database Mocking
**Learning:** ESM mocking of database modules can be brittle. Providing a `setDb` helper in the database module allows for clean dependency injection in tests.
**Action:** Use `setDb` to mock the Drizzle instance in unit tests for routers and database helpers.
