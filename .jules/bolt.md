## 2025-07-15 - Throttling animation loops in React
**Learning:** Returning early from a requestAnimationFrame loop in a React useEffect based on a dependency (like `isActive`) effectively terminates the loop. The loop must be re-initiated when the dependency changes if it was not scheduled to continue.
**Action:** Always ensure that the animation loop is either re-triggered by the effect hook or continues to schedule itself (possibly at a lower frequency) when "inactive" if state persistence is required, or explicitly rely on the effect's re-run to restart it.
