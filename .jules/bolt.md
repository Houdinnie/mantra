## 2025-05-15 - Optimize getUserStats with SQL aggregations
**Learning:** Fetching all rows and aggregating in TypeScript (e.g., using `reduce` or `sort`) is a major performance anti-pattern. Using SQL aggregate functions (`count`, `sum`, `max`) significantly reduces memory and network overhead.
**Action:** Always prefer Drizzle's `sql` template tags for aggregations over in-memory calculations in `server/db.ts`.

## 2025-05-15 - Fixed core syntax error in agentLoop
**Learning:** A missing `case` label in a critical `switch` statement (like the agent loop) can block the entire application and prevent testing.
**Action:** Ensure the agent loop remains syntactically valid to allow for automated verification of other features.
