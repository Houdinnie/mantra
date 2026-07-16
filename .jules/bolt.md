## 2025-07-16 - [Aggregation Complexity in Drizzle]
**Learning:** SQL aggregate functions like `sum()` and `count()` can return results as strings instead of numbers depending on the database driver (e.g., mysql2). Additionally, `max(timestamp)` results may need wrapping in `new Date()` to ensure type consistency in the application layer.
**Action:** Always use `Number()` casting for SQL numeric aggregates and `new Date()` for date aggregates in Drizzle to prevent type errors or runtime failures.

## 2025-07-16 - [Testing Database Functions without Connections]
**Learning:** In a project where `getDb` attempts to connect automatically based on `DATABASE_URL`, unit testing database logic without a live DB requires an explicit mock injection pattern (e.g., `setDb`) and clearing `process.env.DATABASE_URL` in tests.
**Action:** Implement a `setDb` helper in `db.ts` to facilitate dependency injection and bypass ESM mocking limitations for the internal `_db` state.
