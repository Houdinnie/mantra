## 2025-05-14 - Optimize In-Memory Aggregation with SQL Aggregates
**Learning:** Functions fetching all user entity records into application memory to aggregate totals via JavaScript (`Array.prototype.reduce`, `Array.prototype.sort`) create massive memory overhead and network payload bloat as data scales.
**Action:** Always prefer native ORM aggregate functions (`count`, `sum`, `max`) directly in database SELECT statements to stream O(1) single-row results to the application layer.
