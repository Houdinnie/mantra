## 2025-05-15 - [Database Aggregation Optimization]
**Learning:** Fetching all rows for a user and aggregating in memory is a significant bottleneck as the user's data grows ($O(N)$). Using SQL aggregate functions ($count$, $sum$, $max$) reduces this to $O(1)$ and minimizes network payload.
**Action:** Always prefer Drizzle's native aggregate functions for counts, sums, and timestamps over in-memory logic.

## 2025-05-15 - [Singleton Database Testing]
**Learning:** ESM modules and singleton patterns make mocking difficult without architectural changes. Adding a `setDb` helper in the core database file is a clean way to support dependency injection for unit tests.
**Action:** Use `setDb` helper pattern to mock database interactions in repositories with global state.
