## 2025-05-14 - Optimizing getUserStats with SQL aggregates
**Learning:** Replacing in-memory array manipulation (`reduce`, `length`, `sort`) with SQL aggregate functions (`count`, `sum`, `max`) provides a significant O(N) to O(1) performance win by reducing data egress and application-side processing. Drizzle aggregate results on MySQL (like `count` or `sum`) often return as strings, requiring explicit `Number()` casting.
**Action:** Always prefer database-level aggregation for metrics. Use `setDb` helper to inject mock database instances for unit testing query builder chains.
