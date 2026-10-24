# Bolt's Performance Journal

## 2025-05-15 - [Database Aggregation Optimization]
**Learning:** In-memory aggregation of large datasets (like chat histories) is a significant bottleneck. Moving this to the database using SQL aggregates (`count`, `sum`, `max`) reduces data transfer and CPU usage on the server. Drizzle ORM supports these via `count()`, `sum()`, and `max()` functions.

**Action:** Always prefer SQL-level aggregation for stats and summaries instead of fetching all rows and calculating in JavaScript.

## 2025-05-15 - [Drizzle/MySQL Type Consistency]
**Learning:** When using SQL aggregates like `sum` or `count` with Drizzle on MySQL, the results may be returned as strings instead of numbers.

**Action:** Always wrap aggregate results in `Number()` when assigning to numeric fields to ensure type consistency and prevent downstream bugs.

## 2025-05-15 - [Pnpm Lockfile Pollution]
**Learning:** Running `pnpm install` in some environments can lead to massive changes in `pnpm-lock.yaml` that are unrelated to the current task (e.g., adding missing optional dependencies or updating existing ones).

**Action:** Be vigilant about `pnpm-lock.yaml` changes. Use `git restore pnpm-lock.yaml` to revert unrelated changes before submitting a PR to keep the diff clean and focused.
