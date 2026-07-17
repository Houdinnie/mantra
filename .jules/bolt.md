## 2026-05-26 - SQL Aggregates over JS Aggregation
**Learning:** Fetching all rows from a table just to compute basic statistics (`count`, `sum`, `max`) in TypeScript is a major performance anti-pattern. As the dataset grows, this leads to linear increases in network bandwidth, memory consumption, and CPU time. Sorting array values in memory to find timestamps mutates original structures and degrades performance to O(N log N).

**Action:** Always use SQL aggregate functions (`count`, `sum`, `max`, `min`, `avg`) in `server/db.ts` when retrieving summary statistics to execute the calculation directly on the database. Wrap numeric results in `Number()` and dates in `new Date()` when working with Drizzle and MySQL to ensure type consistency across different driver implementations.
