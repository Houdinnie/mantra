# Bolt Performance Journal

## 2026-03-01 - O(N) to O(1) Database Aggregation via SQL helpers in Drizzle ORM
**Learning:** Fetching all rows of a model (e.g. `chatSessions`) from a database and calculating metrics like counts, sums, or maximum timestamps in application memory scales linearly O(N) with the volume of data. This causes high network, CPU, and memory overhead as datasets grow. Using Drizzle ORM's native aggregate helpers (`count`, `sum`, `max`) pushes the computation to the database layer, shifting the complexity to O(1) in application memory and dramatically reducing network payload size.
**Action:** Always identify metrics endpoints that retrieve lists of records and optimize them to use native SQL aggregate functions instead of fetching raw rows and iterating/reducing them in the application layer. Ensure aggregate function results are safely cast (e.g., `Number()` or `new Date()`) due to variations in database driver return types.
