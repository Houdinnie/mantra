## 2025-05-14 - Optimized getUserStats with SQL Aggregates
**Learning:** In-memory aggregation of database results (using `.reduce()` or `.length` on an array of all rows) scales poorly as data grows. Drizzle ORM provides first-class support for SQL aggregate functions like `count`, `sum`, and `max`.
**Action:** Always prefer SQL-level aggregation for computing statistics or summaries from database tables to minimize memory usage and network overhead.
