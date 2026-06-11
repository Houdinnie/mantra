## 2025-06-11 - Drizzle sum() returns string on MySQL
**Learning:** When using `sum()` aggregate in Drizzle ORM with the `mysql2` driver, the result is often returned as a string rather than a number. This can lead to type mismatches if the expected return type is `number`.
**Action:** Always wrap the result of a `sum()` operation in `Number()` to ensure type consistency, e.g., `Number(result.totalMessages ?? 0)`.
