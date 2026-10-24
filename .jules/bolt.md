## 2025-05-15 - [Optimize Database Aggregation]
**Learning:** Fetching all rows from a database table and aggregating them in Node.js is an O(n) operation in memory and network, which significantly slows down as the user's history grows.
**Action:** Use SQL aggregate functions (`count`, `sum`, `max`) via Drizzle ORM's `sql` template tag to perform the computation at the database level, resulting in O(1) data transfer and faster response times.

## 2025-05-15 - [Unit Testing with Drizzle and ESM]
**Learning:** Mocking Drizzle database instances in an ESM environment where functions are called internally (e.g., `getUserStats` calls `getDb`) can be tricky because ESM mocks often don't apply to internal module calls.
**Action:** Implement a `setDb` helper in the database module to allow explicit dependency injection of mock database instances during tests, ensuring reliable and predictable testing of database logic without a live connection.

## 2025-05-15 - [Agent Loop Syntax Error]
**Learning:** A missing `case` keyword or misplaced code within a `switch` statement (like in `server/_core/agentLoop.ts`) can cause global `vite:esbuild` transformation failures, blocking all tests even if they don't import the file directly.
**Action:** Always verify that every `switch` case in complex loops is properly closed and that no logic exists outside of valid `case` or `default` blocks.
