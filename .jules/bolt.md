## 2025-05-22 - SQL Aggregates over JS Aggregation
**Learning:** Fetching all rows from a table just to compute basic statistics (`count`, `sum`, `max`) in TypeScript is a major performance anti-pattern. As the dataset grows, this leads to linear increases in network bandwidth, memory consumption, and CPU time.

**Action:** Always use SQL aggregate functions (`count`, `sum`, `max`, `min`, `avg`) in `server/db.ts` when retrieving summary statistics. Wrap numeric results in `Number()` when working with Drizzle and MySQL to ensure type consistency, as they often return strings.
