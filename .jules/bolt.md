## 2025-05-14 - [Inefficient User Stats Calculation]

**Learning:** The `getUserStats` function was fetching all chat sessions for a user into memory and then performing aggregation (count, sum, max) in TypeScript. This is an O(N) operation in terms of both memory and time relative to the number of sessions, which could be significant for active users.
**Action:** Use SQL aggregate functions (`count()`, `sum()`, `max()`) to perform the calculation on the database side, reducing the payload size to a single row and delegating the work to the database engine.
