## 2025-02-19 - [Drizzle Query Builder Chain Mocking in Vitest]
**Learning:** When mocking nested, chainable Drizzle ORM queries in Vitest unit testing, ensuring that the database instance mock itself is NOT thenable, while the returned query builders (e.g., at the end of the select/from/where chain) are thenables is critical. If the database instance itself is thenable, async wrappers like `await getDb()` will prematurely resolve it, resulting in runtime TypeErrors when chain-calling query builder methods.
**Action:** Always mock Drizzle ORM chainable methods by returning non-thenable intermediate builders, ending with a thenable query leaf builder or result wrapper.

## 2025-02-19 - [Aggregate Query O(N) to O(1) Performance Win]
**Learning:** Fetching all rows into memory and doing map/reduce/sort in the application layer is a common database anti-pattern. Drizzle ORM has native aggregate functions (`count`, `sum`, `max`) that push aggregation to the database, resulting in O(1) database responses instead of O(N) application logic.
**Action:** Prefer database-level aggregation via `count`, `sum`, `max` from `drizzle-orm` instead of fetching full raw datasets and processing them in Node.js memory.
