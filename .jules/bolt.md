## 2026-07-07 - SQL Aggregation for User Stats
**Learning:** In-memory aggregation of database results (using `.reduce()`, `.sort()`, and `.length`) scales poorly as data grows (O(N) memory and processing). Using native SQL aggregate functions (`count`, `sum`, `max`) is significantly more efficient and shifts the load to the database engine.
**Action:** Always prefer Drizzle's aggregate helpers for calculating metrics instead of fetching full row sets.
