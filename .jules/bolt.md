## 2025-05-14 - Pausing Canvas Animation Loops When Inactive
**Learning:** Background HTML5 canvas animation loops continue scheduling `requestAnimationFrame` even if hidden or not performing active renders, draining CPU and battery resources unnecessarily on digital nomad platforms. Pausing scheduling entirely when `isActive` is false eliminates this CPU overhead.
**Action:** Always return early from the animation frame loop without calling `requestAnimationFrame` when the visual component is not active, allowing React's effect dependency array to recreate and kick-off the loop again when it returns to an active state.

## 2025-05-14 - Database Aggregation Performance
**Learning:** In memory array reductions (O(N)) of database records fetched for user stats calculations are highly unscalable and memory-intensive as user sessions grow. Moving to native Drizzle SQL aggregators (`count()`, `sum()`, `max()`) ensures highly scalable O(1) performance direct from the database layer.
**Action:** When calculating session or message metrics, prioritize database aggregates over fetching multiple rows and performing client-side reductions. Ensure returned metrics are properly casted to `Number` since SQL aggregates might return string types in certain MySQL configurations.
