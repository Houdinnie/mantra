## 2025-05-18 - MathRenderer Text Content Checks
**Learning:** Checking `children` props directly with Regex in React components can fail if `children` is a JSX element/Node rather than a raw string (`[object Object]`). Always check `containerRef.current.textContent` or safely handle string types when testing for math delimiters.
**Action:** Use `containerRef.current.textContent || (typeof children === "string" ? children : "")` prior to KaTeX module loading.
