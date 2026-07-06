## 2024-05-23 - Database Aggregation with Drizzle/MySQL
**Learning:** SQL aggregate functions like `count()` and `sum()` in Drizzle may return results as strings depending on the driver and field type. Additionally, `max(timestamp)` might return an ISO string.
**Action:** Always wrap `count()` and `sum()` results in `Number()` and `max()` results in `new Date()` when assigning to strongly-typed numeric or Date fields to ensure consistency and avoid runtime type errors.

## 2024-05-23 - Database Unit Testing Pattern
**Learning:** Testing database logic without a live connection is difficult in this ESM-based environment without a dependency injection pattern.
**Action:** Use an exported `setDb` helper in `server/db.ts` to inject a mock Drizzle instance during unit tests. This bypasses the need for a real `DATABASE_URL` and ensures tests are fast and hermetic.
