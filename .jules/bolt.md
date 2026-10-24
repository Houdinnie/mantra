## 2024-05-22 - [SQL Aggregate Optimization]
**Learning:** Using JS-side `reduce()` and `sort()` on database results (like `chatSessions`) scales poorly (O(N)) and increases memory/network overhead as users accumulate more data.
**Action:** Always prefer Drizzle's `count()`, `sum()`, and `max()` helpers for stats to perform aggregation on the database side (O(1)).

## 2024-05-22 - [Canvas Draw Call Batching]
**Learning:** Calling `ctx.stroke()` within a loop for each edge in a neural network visualization causes a bottleneck due to excessive draw calls to the GPU.
**Action:** Use `ctx.beginPath()` before the loop, `ctx.moveTo()`/`ctx.lineTo()` inside, and a single `ctx.stroke()` after to batch line segments into a single draw call.
