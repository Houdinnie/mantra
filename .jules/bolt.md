## 2025-05-14 - SQL Aggregation for User Metrics
**Learning:** `getUserStats` was previously fetching all chat session rows into Node.js memory and sorting them in JS ($O(N)$ memory transfer + $O(N \log N)$ sort). Replacing it with Drizzle `count()`, `sum()`, and `max()` delegates the aggregation to MySQL and transfers only 1 row ($O(1)$ memory).
**Action:** Always favor native ORM/SQL aggregate functions (`count`, `sum`, `max`, `avg`) over fetching all rows and aggregating in JS.
