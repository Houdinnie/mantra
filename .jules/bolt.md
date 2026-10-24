## 2025-05-14 - Canvas Rendering and Frame Loop Optimization in NeuralNetwork

**Learning:** Running `requestAnimationFrame` loops continuously while a canvas component is inactive (`isActive === false`) drains CPU/GPU cycles unnecessarily. Additionally, calling `stroke()` per line segment inside a Canvas 2D render loop causes frequent context state changes; batching line path segments into a single `beginPath()` + `stroke()` call reduces draw call overhead significantly.

**Action:** Always short-circuit `useEffect` animation setup when `isActive` is false, and batch static line paths in Canvas 2D render loops before calling `stroke()`.
