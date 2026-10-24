## 2025-05-14 - [Aggregation Optimization & Lockfile Noise]
**Learning:** SQL aggregate functions (count, sum) in Drizzle with MySQL may return string values instead of numbers, requiring explicit conversion. Also, `pnpm install` in some environments can introduce significant unrelated changes to `pnpm-lock.yaml` which should be reverted before submission to maintain a clean PR.
**Action:** Always wrap Drizzle aggregate results in `Number()` when a numeric type is expected. Use `git restore pnpm-lock.yaml` to clean up lockfile noise if no dependencies were explicitly added.
>>>>>>> REPLACE
