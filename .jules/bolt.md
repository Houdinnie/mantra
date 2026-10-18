## 2025-05-18 - Aggregate Database Metrics in Drizzle
**Learning:** `getUserStats` loaded all session records into Node.js memory to compute session counts, message sums, and max active timestamps via in-memory array operations (`reduce` and `sort`). This caused unnecessary memory allocation and network data payload scaling linearly with user session history (O(N)).
**Action:** Use Drizzle ORM native SQL aggregate functions (`count()`, `sum()`, `max()`) in a single query to compute metrics directly in the database engine (O(1) payload and memory).
