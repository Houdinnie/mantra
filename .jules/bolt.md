# Bolt's Journal

## 2026-03-01 - [Drizzle Aggregate Queries and Vitest Chain Mocking]
**Learning:**
1. When replacing memory-based array aggregates with Drizzle's native SQL functions (`count`, `sum`, `max`), the DB driver may return count and sum as strings instead of numbers. Explicitly parsing them via `Number()` is critical to preserve downstream type-safety.
2. In Vitest, mocking chainable database query builders (e.g. `db.select().from().where()`) requires that the root database object (`db`) is NOT thenable (does not define `.then`), whereas the terminal/awaited methods (like `limit()` or the returned query promise) are thenables. If `db` itself is thenable, async wrappers like `await getDb()` will prematurely evaluate it as a Promise, throwing TypeError when chained methods are called.

**Action:**
1. Always map database aggregate outputs with type conversion (`Number` or `new Date()`) in the repository layer.
2. Structure the database unit test mocks so that only the final awaited builder methods return a resolved Promise.
