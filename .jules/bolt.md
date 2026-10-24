# Bolt's Performance Journal

## 2026-05-02 - Mocking Chainable Drizzle ORM Queries in Tests
**Learning:** To mock nested, chainable Drizzle ORM queries in Vitest unit testing, ensure the database instance mock itself is NOT thenable (i.e. does not have a `.then` property), while the returned query builders are thenables. If the database instance itself has a `.then` property, async wrappers like `await getDb()` will prematurely resolve it as a Promise, resulting in a runtime `TypeError` when subsequent query builder chain methods (like `select()`, `where()`, `from()`, etc.) are called.
**Action:** Always structure Drizzle database mocks in tests with distinct `mockDb` and `mockQueryBuilder` objects, where only `mockQueryBuilder` implements the `.then(onFulfilled)` method, while `mockDb` does not.
