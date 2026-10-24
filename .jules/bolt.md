# Bolt Performance Journal

## 2025-03-05 - [Drizzle Query Mocking & Aggregate Function Casting]
**Learning:** In Drizzle ORM, chainable database queries must be mocked using non-thenable root DB objects, but thenable leaf elements. Additionally, aggregate functions (count, sum, max) return different output formats depending on the database driver; count/sum may be strings (requiring `Number()` casting) and timestamp aggregates may be strings or dates (requiring `new Date()` wrapping).
**Action:** Always wrap `count`/`sum` results in `Number(...)` and wrap `max(updatedAt)` in `new Date(...)`. Implement chainable Proxy mocks in tests and reset using `setDb(null)` in `afterEach`.
