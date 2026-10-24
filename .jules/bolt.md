# Bolt's Performance Journal

## 2026-03-31 - SQL Aggregates vs. In-Memory Calculation in Drizzle
**Learning:** In the database layer (`server/db.ts`), the helper function `getUserStats` originally fetched all chat session records for a user into application memory to calculate counts, sums, and max updatedAt timestamps. This resulted in O(N) complexity for bandwidth, memory, and runtime, creating a major performance bottleneck for active users with many sessions. Utilizing native Drizzle aggregate functions (`count`, `sum`, `max`) performs the aggregation directly on the database engine, reducing the operation complexity to O(1) and minimizing the data payload transferred over the network.
**Action:** Always scan database fetching functions for in-memory reduction/aggregation logic and replace them with SQL aggregate functions from the ORM. Ensure to explicitly handle casting since driver aggregates can return numeric metrics as strings.
