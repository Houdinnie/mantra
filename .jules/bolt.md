## 2025-05-15 - [Canvas Optimization in NeuralNetwork]
**Learning:** Batching `stroke()` calls and pre-rendering radial gradients to an off-screen canvas significantly reduces CPU/GPU overhead in React components using HTML5 Canvas. Additionally, suspending the `requestAnimationFrame` loop when the component is hidden (via CSS `display: none`) saves substantial CPU cycles.
**Action:** Always check if animation loops can be suspended based on visibility props and look for opportunities to pre-render static or semi-static assets in canvas-heavy components.
