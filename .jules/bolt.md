## 2025-05-15 - SQL Aggregate Optimization for User Stats
**Learning:** Fetching all rows from a database table only to aggregate them in TypeScript (e.g., using `.length` or `.reduce`) is a major performance anti-pattern. It leads to unnecessary network bandwidth consumption and high memory usage as the dataset grows.
**Action:** Use SQL aggregate functions like `count()`, `sum()`, and `max()` via Drizzle's `sql` template literal to perform computations on the database side. This ensures only the final result is sent over the wire, keeping the application fast and efficient.
