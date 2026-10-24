## 2025-05-14 - DB Aggregations vs Application-level Aggregation
**Learning:** Fetching all rows (`db.select().from(table)`) and performing aggregations like `count`, `sum`, or `max` in JavaScript memory leads to O(N) bandwidth and memory usage. Replacing this with Drizzle ORM aggregate functions (`count()`, `sum()`, `max()`) executes aggregations in the database engine and returns a single row, achieving O(1) space and network transfer.
**Action:** Always prefer native ORM/SQL aggregate functions over `Array.prototype.reduce` or `Array.prototype.sort` on raw query results.
