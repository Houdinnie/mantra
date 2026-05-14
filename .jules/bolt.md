## 2025-05-15 - SQL aggregates for getUserStats
**Learning:** Fetching all rows and aggregating in TypeScript (via reduce/length) creates significant network and memory overhead as the dataset grows. Using SQL aggregate functions (count, sum, max) is far more efficient.
**Action:** Always prefer SQL aggregates for counts, sums, and ranges when using Drizzle ORM on MySQL.

## 2025-05-15 - Mocking internal functions in ESM
**Learning:** Functions exported from the same module that call each other (like getUserStats calling getDb) are hard to mock with vitest's vi.mock or vi.spyOn due to how ESM handles bindings.
**Action:** Implement a setDb helper or similar dependency injection mechanism to allow tests to override internal state safely.
