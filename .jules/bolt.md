## 2025-05-15 - Optimizing User Stats Aggregation
**Learning:** Fetching all database rows and performing aggregation in application memory is an $O(N)$ bottleneck for memory and network that scales poorly. Using SQL aggregate functions (`count`, `sum`, `max`) offloads this work to the database engine.
**Action:** Always check if `reduce()` or `length` is being used on full table result sets for metrics that could be computed via SQL aggregates.

## 2025-05-15 - Lockfile Pollution during pnpm install
**Learning:** Running `pnpm install` in an environment with missing local `node_modules` can cause `pnpm-lock.yaml` to update with unrelated dependency changes (e.g., `katex`) if the registry version differs from the lockfile or if optional dependencies are resolved differently.
**Action:** Always verify `git status` after `pnpm install` and use `git restore pnpm-lock.yaml` to revert unrelated changes before submitting performance-focused PRs.
