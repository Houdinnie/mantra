## 2025-05-14 - [Database Aggregation]
**Learning:** The `getUserStats` function was fetching all rows for a user and aggregating them in memory. While fine for small datasets, this is a O(n) operation that consumes significant memory and bandwidth as the user's chat history grows.
**Action:** Replace in-memory `reduce` and `sort` with SQL aggregate functions (`count`, `sum`, `max`). This shifts the work to the database and reduces the payload to a single row.

## 2025-05-14 - [Testing with ESM Mocking]
**Learning:** Standard Vitest/Jest mocking of internal module functions is often blocked by ESM constraints. This makes testing database utility functions in `server/db.ts` difficult when they are called by other functions or routers.
**Action:** Implement a `setDb` helper to facilitate dependency injection. This allows tests to provide a mock database instance directly to the module, bypassing the need for complex module-level mocking.

## 2025-05-14 - [Clean PRs and Lockfiles]
**Learning:** Running `pnpm install` in an environment where the lockfile is slightly out of sync or contains different versions of transitive dependencies (like `katex` or `three`) can cause massive noise in the `pnpm-lock.yaml`.
**Action:** Always verify lockfile changes and `git restore pnpm-lock.yaml` if no new dependencies were intentionally added, ensuring the PR focuses strictly on the requested optimization.
