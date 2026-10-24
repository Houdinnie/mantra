## 2024-05-24 - SQL Aggregates and Test Blockers

**Learning:** Database aggregation functions in Drizzle with MySQL (count, sum, max) can return numeric values as strings. Additionally, a syntax error in the agent loop (`server/_core/agentLoop.ts`) can block global test execution due to esbuild transformation failures.

**Action:** Always wrap SQL aggregate results in `Number()` or `new Date()` as appropriate to ensure type consistency. When fixing blockers for tests that are unrelated to the main task, ensure they are correctly implemented with proper `case` and `break` statements to avoid breaking the build.
