## 2025-10-27 - Database Aggregation Performance
**Learning:** Fetching all rows and aggregating in memory (e.g., in `getUserStats`) is a major bottleneck for users with large chat histories. SQL aggregate functions (`count`, `sum`, `max`) are significantly more efficient as they offload the computation to the database engine and reduce network payload.
**Action:** Always use SQL aggregate functions for statistics and summaries. Wrap MySQL results in `Number()` where necessary to ensure type safety in Drizzle.

## 2025-10-27 - Canvas Animation Optimization
**Learning:** `createRadialGradient` and multiple `stroke()` calls inside a `requestAnimationFrame` loop are CPU-intensive. Pre-rendering static or repetitive gradients to off-screen canvases and batching draw calls (like lines) can drastically reduce frame time.
**Action:** Pre-render gradients to off-screen canvases. Use `ctx.drawImage()` for repeating elements. Batch `moveTo/lineTo` calls and execute a single `stroke()` where possible.

## 2025-10-27 - ESM Module Mocking with Drizzle
**Learning:** Mocking internal calls within the same module is difficult in ESM. A `setDb` helper for dependency injection is a reliable pattern for unit testing database-dependent functions without requiring a live connection or complex mocking libraries.
**Action:** Implement and export a `setDb` helper in `db.ts` to facilitate clean unit testing.
