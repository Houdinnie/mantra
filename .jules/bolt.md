## 2025-05-18 - Off-Screen Sprite Caching and Path Batching in Canvas 2D
**Learning:** HTML5 Canvas rendering loops (`requestAnimationFrame`) suffer significant overhead when calling `createRadialGradient` and issuing per-element `stroke()` / `fill()` calls on every frame.
**Action:** Pre-render radial gradient particle/halo sprites onto off-screen HTMLCanvasElements during setup, and batch multiple arc/line paths into single `stroke()` and `fill()` draw calls per frame to reduce CPU-to-GPU state switches from O(N) to O(1).
