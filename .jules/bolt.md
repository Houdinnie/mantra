## 2025-03-27 - SQL Aggregate Optimization for User Stats
**Learning:** Fetching all rows from a table just to calculate count, sum, or max in memory is a common performance bottleneck as data grows. Drizzle ORM allows using `sql` template tags to perform these operations directly on the database server.
**Action:** Use SQL aggregate functions (`count`, `sum`, `max`, etc.) for calculating statistics to minimize memory usage and network overhead. Wrap numeric results in `Number()` when Drizzle returns them as strings (common with MySQL).

## 2025-03-27 - Database Mocking in ESM
**Learning:** Internal function calls within the same module are difficult to mock with `vi.spyOn` in ESM. Adding a `setDb` helper to the database module allows for clean dependency injection and mocking in unit tests.
**Action:** Implement `setDb` or similar dependency injection patterns for modules that are difficult to mock via standard Vitest/Jest spying.
