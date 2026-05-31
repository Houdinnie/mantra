## 2025-05-14 - [Aggregate-based Stats]
**Learning:** Fetching and aggregating large datasets in-memory is a major bottleneck as the database grows. Drizzle ORM's `sql` template tag allows for efficient server-side aggregation using SQL primitives like `COUNT`, `SUM`, and `MAX`.
**Action:** Always prefer SQL aggregate functions for dashboard statistics and counters to minimize data transfer and memory pressure.

## 2025-05-14 - [Test Mocking with Drizzle]
**Learning:** Mocking Drizzle DB instances in ESM environments can be tricky due to module caching. Providing a `setDb` helper for dependency injection is a clean way to support unit tests without requiring a live database.
**Action:** Include `setDb` in core database modules to facilitate easier mocking in Vitest.
