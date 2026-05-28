## 2025-03-27 - [Optimization: getUserStats SQL Aggregation]
**Learning:** Fetching all rows from a database to perform aggregation in application memory (e.g., using `reduce` or `.length`) is a significant performance anti-pattern as the data grows. Drizzle ORM provides `sql` and aggregate helpers that delegate this work to the database engine.
**Action:** Always check if a metric can be calculated via SQL `count`, `sum`, `avg`, `min`, or `max` before pulling the raw dataset into Node.js.

## 2025-03-27 - [Testing: Database Mocking with setDb]
**Learning:** In projects using ESM and tRPC, mocking a singleton database instance can be tricky due to how imports are resolved and cached. Providing a `setDb` helper in the database module allows for clean dependency injection in unit tests without complex mocking libraries.
**Action:** Use a dedicated `setDb` or similar pattern when global state or singleton instances need to be swapped for testing.
