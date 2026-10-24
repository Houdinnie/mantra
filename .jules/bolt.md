# Bolt's Performance Journal

## 2026-08-06 - Preventing Animation Busy-Waiting & Aggregating on the Database
**Learning:**
1. Busy-waiting in `requestAnimationFrame` loops is an insidious CPU resource leak. In `NeuralNetwork.tsx`, even when `isActive` was false, the animation loop recursively called `requestAnimationFrame(animate)`. This kept the main thread waking up at 60fps in the background, consuming battery and CPU cycles for hidden canvases. Pause the recursion entirely when inactive.
2. In-memory array manipulation (`reduce` and `sort`) on query results for user session statistics (`getUserStats`) scales poorly to O(N). Leveraging native SQL aggregate helpers (`count()`, `sum()`, and `max()`) from Drizzle ORM shifts this overhead to the database engine, ensuring O(1) memory and runtime complexity on the application side.

**Action:**
1. Always verify that canvas animation loops in React are conditionally scheduled, and completely avoid scheduling new animation frames when components are inactive or offscreen.
2. Avoid fetching entire tables or collections to compute simple counts, sums, or maximums. Query using database-level aggregate functions (`count()`, `sum()`, `max()`) to minimize server memory footprint and network bandwidth overhead.
