/**
 * MathRenderer — KaTeX math rendering for Mantra
 *
 * Wraps Streamdown output and processes math expressions:
 *   - Block math:  $$...$$  or  \[...\]
 *   - Inline math: $...$    or  \(...\)
 *
 * Falls back to plain text if KaTeX fails to parse.
 * Also adds GitHub-flavored table styling and code block copy buttons.
 */

import { useEffect, useRef, memo } from "react";

// Dynamic KaTeX import to avoid SSR issues
let katex: typeof import("katex") | null = null;
async function loadKatex() {
  if (!katex) {
    katex = await import("katex");
    // Inject KaTeX CSS once
    if (!document.getElementById("katex-css")) {
      const link = document.createElement("link");
      link.id = "katex-css";
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      document.head.appendChild(link);
    }
  }
  return katex;
}

// ─────────────────────────────────────────────────────────────
// Math rendering helpers
// ─────────────────────────────────────────────────────────────

function renderMath(tex: string, displayMode: boolean): string {
  if (!katex) return tex;
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor: "#ff6b6b",
      trust: false,
    });
  } catch {
    return tex;
  }
}

function processMathInHTML(html: string): string {
  // Block math: $$...$$ or \[...\]
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    return `<div class="math-block">${renderMath(tex.trim(), true)}</div>`;
  });
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => {
    return `<div class="math-block">${renderMath(tex.trim(), true)}</div>`;
  });
  // Inline math: $...$ (not $$ which we already handled)
  html = html.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    return `<span class="math-inline">${renderMath(tex.trim(), false)}</span>`;
  });
  // \(...\)
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => {
    return `<span class="math-inline">${renderMath(tex.trim(), false)}</span>`;
  });
  return html;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

type Props = {
  children: string;
  className?: string;
};

export const MathRenderer = memo(function MathRenderer({
  children,
  className = "",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !children) return;

    loadKatex().then(() => {
      if (!containerRef.current) return;
      const processed = processMathInHTML(containerRef.current.innerHTML);
      if (processed !== containerRef.current.innerHTML) {
        containerRef.current.innerHTML = processed;
      }
    });

    // Add copy buttons to code blocks
    const codeBlocks = containerRef.current.querySelectorAll("pre code");
    codeBlocks.forEach(block => {
      const pre = block.parentElement;
      if (!pre || pre.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.className =
        "copy-btn absolute top-2 right-2 text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity";
      btn.textContent = "Copy";
      btn.onclick = () => {
        navigator.clipboard.writeText(block.textContent ?? "");
        btn.textContent = "Copied!";
        setTimeout(() => {
          btn.textContent = "Copy";
        }, 2000);
      };

      pre.style.position = "relative";
      pre.classList.add("group");
      pre.appendChild(btn);
    });
  }, [children]);

  return (
    <div
      ref={containerRef}
      className={`prose prose-invert prose-slate max-w-none
        prose-headings:text-white prose-headings:font-bold
        prose-p:text-slate-200 prose-p:leading-relaxed
        prose-strong:text-white prose-strong:font-semibold
        prose-code:text-cyan-300 prose-code:bg-slate-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-pre:rounded-xl
        prose-blockquote:border-cyan-500/50 prose-blockquote:text-slate-300
        prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
        prose-table:border-collapse prose-th:border prose-th:border-slate-700 prose-th:px-3 prose-th:py-2 prose-th:bg-slate-800/50
        prose-td:border prose-td:border-slate-700/50 prose-td:px-3 prose-td:py-2
        prose-ul:text-slate-200 prose-ol:text-slate-200 prose-li:text-slate-200
        prose-hr:border-slate-700
        [&_.math-block]:my-4 [&_.math-block]:overflow-x-auto [&_.math-block]:text-center
        [&_.math-inline]:mx-0.5
        ${className}`}
      dangerouslySetInnerHTML={{ __html: children }}
    />
  );
});

// ─────────────────────────────────────────────────────────────
// StreamingMath — wraps Streamdown + post-processes for math
// ─────────────────────────────────────────────────────────────

import { Streamdown } from "streamdown";

export function StreamingMath({ children }: { children: string }) {
  const hasMath = /\$|\\\[|\\\(/.test(children);

  if (!hasMath) {
    // Fast path: no math, just use Streamdown directly
    return <Streamdown>{children}</Streamdown>;
  }

  // Math path: render through Streamdown first, then post-process
  return (
    <div className="relative">
      <Streamdown>{children}</Streamdown>
      <MathPostProcessor content={children} />
    </div>
  );
}

function MathPostProcessor({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKatex().then(() => {
      // Find the sibling Streamdown output and process its rendered HTML
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const streamdownOutput = parent.querySelector(
        ".streamdown-output, [data-streamdown], p, div:not([style])"
      );
      if (streamdownOutput) {
        const processed = processMathInHTML(streamdownOutput.innerHTML);
        if (processed !== streamdownOutput.innerHTML) {
          streamdownOutput.innerHTML = processed;
        }
      }
    });
  }, [content]);

  return <div ref={ref} className="hidden" aria-hidden="true" />;
}
