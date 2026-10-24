## 2025-05-14 - [Database Aggregation & ESM Mocking]
**Learning:** Fetching all rows from a database to aggregate in memory (e.g., `sessions.length`, `sessions.reduce`) is a significant bottleneck as data grows. Using SQL aggregate functions (`count`, `sum`, `max`) is much more efficient. Additionally, internal calls within ESM modules are difficult to mock with `vi.spyOn`; a `setDb` helper function allows for clean dependency injection in unit tests.

**Action:** Always prefer SQL aggregates for statistics. Implement a `setDb` or similar registry pattern when unit testing ESM modules that have internal function calls to shared state like a database connection.
