# Bolt Performance Journal

## 2026-11-08 - SQL Aggregation for getUserStats

**Learning:** Fetching full entity rows into application memory to perform operations like counting, summing, or finding the max timestamp scales linearly O(N) with data growth, wasting database bandwidth, network I/O, and Node.js heap memory. Using Drizzle's SQL aggregate helpers (`count`, `sum`, `max`) shifts the aggregation computation to MySQL and returns an O(1) single-row response.
**Action:** When gathering table summary statistics or metrics, always utilize SQL aggregate functions rather than in-memory JavaScript reduce/sort routines.
