## 2026-07-20 - [Drizzle ORM Chain Mocking]
**Learning:** Mocking chained database queries with ESM-based or dynamic loaders can lead to complex and brittle tests. Utilizing a single chainable, Thenable mock object (`queryMock`) that returns itself on every chain step, and intercepts resolution inside `then()`, is a highly robust, lightweight, and type-safe testing strategy.
**Action:** Implement a generic `queryMock` that tracks the current SQL operation (select/insert/update/delete) and returns custom overrides when `then()` is invoked.
