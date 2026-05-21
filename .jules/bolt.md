## 2025-05-15 - NeuralNetwork Animation Loop Optimization
**Learning:** Redundant object creation and draw calls in a `requestAnimationFrame` loop can significantly impact frontend performance. Specifically, calling `createRadialGradient` and `stroke` for every individual element in every frame leads to high CPU/GPU usage and potential frame drops.

**Action:**
1. Pre-render static or reusable assets (like gradients) to off-screen canvases and use `drawImage` instead.
2. Batch draw calls (like `stroke`) whenever multiple paths share the same style.
3. Move invariant style assignments outside of loops.
4. Document the expected impact: ~90% reduction in gradient creation overhead and ~80% reduction in draw calls for edges.
