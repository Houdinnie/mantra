# Bolt's Performance Journal

## 2026-02-15 - HTML5 Canvas requestAnimationFrame Inactive Overhead
**Learning:** Returning early inside requestAnimationFrame callback is insufficient if requestAnimationFrame is still queued recursively within the early return block. This schedules infinite micro-tasks (60-120fps) in the background, consuming significant standby CPU cycles.
**Action:** When a canvas animation component goes inactive, completely halt recursive requestAnimationFrame scheduling and conditionally initiate/kick off the cycle only when active status is resumed.
