## 2025-05-14 - [Scope management in performance PRs]
**Learning:** Including unrelated syntax fixes (like a missing case in a switch) or lockfile updates in a performance-focused PR can lead to rejection and noise in reviews.
**Action:** Always verify the diff before submitting and revert any unrelated changes. Keep performance PRs strictly focused on the optimization.

## 2025-05-14 - [Drizzle SQL aggregates performance]
**Learning:** Fetching all rows to aggregate in memory is O(N) in data transfer and JS processing. Using SQL aggregate functions (`count`, `sum`, `max`) moves the computation to the database and reduces data transfer to O(1).
**Action:** Prefer SQL aggregates for statistics and counters.
