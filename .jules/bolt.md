## 2025-05-15 - [Optimize getUserStats with SQL aggregates]
**Learning:** In Drizzle ORM with MySQL, aggregate functions like `sum` and `count` may return values as strings or bigints that need explicit casting to `Number()` in TypeScript to maintain type consistency with existing logic.
**Action:** Always wrap `sum()` and `count()` results in `Number()` when assigning to numeric fields in the return object.

## 2025-05-15 - [Database Mocking with setDb]
**Learning:** Directly mocking `getDb` is difficult in ESM/Vitest environments when the module is already loaded. Adding a `setDb` setter in the production `db.ts` file is a clean way to allow dependency injection for unit tests without a live database.
**Action:** Use a `setDb` helper for database unit tests and router tests.
