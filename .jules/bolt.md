## 2025-07-10 - [Database Aggregation Optimization]
**Learning:** Offloading aggregation to the database using SQL aggregate functions (`count`, `sum`, `max`) provides a massive performance win over in-memory processing, especially for $O(N)$ operations that can be reduced to $O(1)$.
**Action:** Always prefer Drizzle's `count()`, `sum()`, and `max()` helpers for calculating metrics instead of fetching full record sets.

## 2025-07-10 - [MySQL Aggregate Type Handling]
**Learning:** Drizzle SQL aggregates on MySQL often return numeric results as strings (e.g., `"15"` instead of `15`).
**Action:** Always wrap `sum()` and `count()` results in `Number()` when assigning to numeric fields to ensure type consistency and prevent downstream bugs.

## 2025-07-10 - [Timestamp Consistency in Tests]
**Learning:** Database results for timestamps (like `max(updatedAt)`) may be returned as ISO strings or Date objects depending on the driver and query structure.
**Action:** Wrap timestamp aggregate results in `new Date()` and use `.toISOString()` in mocks to ensure consistent conversion and avoid flaky equality assertions in tests.
