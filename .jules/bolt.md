
## 2024-06-15 - [Database Aggregation Optimization]
**Learning:** Performing data aggregation (count, sum, max) in the database using SQL aggregate functions is significantly more efficient than fetching all rows and aggregating in memory, especially as the data grows.
**Action:** Always prefer SQL aggregate functions (`count`, `sum`, `avg`, `max`, `min`) for computing statistics over large datasets.
