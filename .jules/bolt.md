## 2025-05-14 - [Database Aggregation Performance]
**Learning:** In-memory aggregation of database results (e.g., using `reduce` or `length` on a result set) scales poorly as the number of records grows. Moving these operations to the database using SQL aggregate functions (`count`, `sum`, `max`) significantly reduces memory footprint and network payload.
**Action:** Always prefer SQL aggregate functions for computing statistics or summaries from large tables.

## 2025-05-14 - [Database Mocking Pattern]
**Learning:** In ESM-based Node.js projects, mocking internal module dependencies (like a database instance) can be challenging with traditional `vi.mock`. Providing a `setDb` (or similar) setter for dependency injection makes unit testing much simpler and more reliable.
**Action:** Include a test-only setter for singleton-like dependencies to facilitate clean mocking in unit tests.
