## 2025-05-14 - [SQL Aggregate Optimization for User Stats]
**Learning:** Using SQL aggregate functions (`count`, `sum`, `max`) via Drizzle's `sql` helper is significantly more efficient than fetching full rows and aggregating in memory, especially as the dataset grows ($O(N) \to O(1)$ for network and memory overhead).
**Action:** Always prefer database-level aggregation for statistics and summaries. Ensure `sql` is correctly imported from `drizzle-orm`.

## 2025-05-14 - [ESM Mocking Limitations]
**Learning:** Internal calls within a module (e.g., `getUserStats` calling `getDb` in `server/db.ts`) are difficult to mock with `vi.spyOn` due to ESM module behavior where functions are bound at load time.
**Action:** Use a helper function like `setDb` to inject a mocked database instance into the module's internal state for testing.
