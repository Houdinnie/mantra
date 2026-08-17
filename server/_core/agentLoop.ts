/**
 * Mantra Agent Loop
 *
 * Implements the Analyze → Plan → Execute → Observe loop using
 * Claude tool_use. Each iteration yields a streaming event so the
 * frontend can display live progress exactly like Manus.
 *
 * Tools available inside the sandbox:
 *   shell          — run any bash command
 *   write_file     — write/overwrite a file
 *   read_file      — read a file
 *   list_files     — list the workspace
 *   browser_fetch  — HTTP fetch + text extraction
 *   task_complete  — signal the task is done, return final output
 */

import { ENV } from "./env";
import {
  execInSandbox,
  writeFileInSandbox,
  readFileInSandbox,
  listFilesInSandbox,
  type SandboxInfo,
} from "./dockerSandbox";

// ─────────────────────────────────────────────────────────────
// Event types streamed to the frontend
// ─────────────────────────────────────────────────────────────

export type AgentEvent =
  | { type: "thinking";       text: string }
  | { type: "tool_call";      tool: string; input: Record<string, unknown> }
  | { type: "tool_result";    tool: string; output: string; exitCode?: number; error?: boolean }
  | { type: "file_created";   path: string; content?: string }
  | { type: "file_read";      path: string; content: string }
  | { type: "step_complete";  step: number; total: number }
  | { type: "task_complete";  output: string; files: string[] }
  | { type: "error";          message: string }
  | { type: "status";         text: string };

// ─────────────────────────────────────────────────────────────
// Tool definitions for Claude
// ─────────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "shell",
    description: "Run a bash command in the sandbox. Use for: installing packages, running scripts, executing code, managing files via CLI, checking output. Always check exit codes.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The bash command to run. Can be multi-line." },
        description: { type: "string", description: "One-line description of what this command does" },
      },
      required: ["command", "description"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file in the workspace. Creates parent directories automatically. Use for: creating scripts, configs, data files, HTML, markdown.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path, e.g. 'main.py' or 'src/index.ts'" },
        content: { type: "string", description: "Full file content to write" },
        description: { type: "string", description: "What this file is for" },
      },
      required: ["path", "content", "description"],
    },
  },
  {
    name: "read_file",
    description: "Read the full content of a file in the workspace.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Relative file path to read" },
      },
      required: ["path"],
    },
  },
  {
    name: "list_files",
    description: "List all files in the workspace or a subdirectory.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path relative to workspace root. Use '.' for root.", default: "." },
      },
      required: [],
    },
  },
  {
    name: "browser",
    description: "Control a real Chromium browser via Playwright. Use for: scraping JavaScript-heavy sites, filling forms, clicking buttons, taking screenshots, navigating SPAs, logging in. Write a Python script using playwright.sync_api and run it.",
    input_schema: {
      type: "object",
      properties: {
        script: {
          type: "string",
          description: "Python script using playwright.sync_api. Must be complete and runnable. Example:\nfrom playwright.sync_api import sync_playwright\nwith sync_playwright() as p:\n    browser = p.chromium.launch(headless=True)\n    page = browser.new_page()\n    page.goto('https://example.com')\n    print(page.title())\n    browser.close()"
        },
        description: { type: "string", description: "What this browser script does" },
      },
      required: ["script", "description"],
    },
  },
  {
    name: "upload_file",
    description: "Reference a file that was uploaded by the user into the workspace. Use this to acknowledge and process user-uploaded files.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "The filename in /workspace that was uploaded" },
        action: { type: "string", description: "What to do with this file" },
      },
      required: ["path", "action"],
    },
  },
  {
    name: "task_complete",
    description: "Call this when the task is fully complete. Provide a clear summary of what was accomplished and what files were created.",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Clear summary of what was done and what was produced" },
        files: {
          type: "array",
          items: { type: "string" },
          description: "List of important files created or modified",
        },
      },
      required: ["summary"],
    },
  },
];

// ─────────────────────────────────────────────────────────────
// System prompt
// ─────────────────────────────────────────────────────────────

const AGENT_SYSTEM = `You are Mantra's autonomous execution agent — a Manus-like AI that completes tasks inside an isolated Linux sandbox.

You have access to a full Ubuntu Linux environment with Python 3, Node.js, npm, pip, curl, wget, and git pre-installed. You can install additional packages freely.

You also have a FULL HEADLESS CHROMIUM BROWSER via Playwright. For any web task — scraping, form filling, screenshots, SPAs — use the browser tool with a Python playwright script.

Your working directory is /workspace. All files you create will be there.

Operating principles:
1. PLAN first — before executing, write a todo.md with your numbered plan
2. EXECUTE step by step — one tool call per logical action
3. OBSERVE carefully — always read command output before proceeding
4. VERIFY your work — run the code/script to confirm it works
5. COMPLETE cleanly — call task_complete with a clear summary and file list

When writing code:
- Always test it by running it
- Handle errors and edge cases
- Leave clear comments

When using the browser:
- Always use headless=True
- Use page.wait_for_load_state('networkidle') for SPAs
- Take screenshots with page.screenshot(path='screenshot.png') to verify
- Save scraped data to files

When errors occur:
- Read the error message carefully
- Fix the root cause, not the symptom
- Try a different approach if stuck

You are thorough, methodical, and always verify before declaring done.`;

// ─────────────────────────────────────────────────────────────
// Message types for the multi-turn conversation with tool results
// ─────────────────────────────────────────────────────────────

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

type Message = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

// ─────────────────────────────────────────────────────────────
// Main agent loop — async generator of events
// ─────────────────────────────────────────────────────────────

const MAX_ITERATIONS = 30;
const API_URL = "https://api.anthropic.com/v1/messages";

export async function* runAgentLoop(
  task: string,
  sandbox: SandboxInfo,
  context?: string       // optional extra context (memory, prior chat)
): AsyncGenerator<AgentEvent, void, unknown> {
  if (!ENV.anthropicApiKey) {
    yield { type: "error", message: "ANTHROPIC_API_KEY not configured" };
    return;
  }

  const messages: Message[] = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `${context ? `Context about me:\n${context}\n\n---\n\n` : ""}Task: ${task}\n\nBegin by writing a todo.md with your plan, then execute step by step.`,
        },
      ],
    },
  ];

  const createdFiles: string[] = [];
  let iteration = 0;

  yield { type: "status", text: "🤖 Agent initialising..." };

  while (iteration < MAX_ITERATIONS) {
    iteration++;

    // Call Claude with tools
    let response: Response;
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ENV.anthropicApiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: AGENT_SYSTEM,
          tools: TOOLS,
          messages,
        }),
      });
    } catch (err) {
      yield { type: "error", message: `API call failed: ${(err as Error).message}` };
      return;
    }

    if (!response.ok) {
      const errText = await response.text();
      yield { type: "error", message: `Claude API error ${response.status}: ${errText.slice(0, 200)}` };
      return;
    }

    const data = await response.json() as {
      stop_reason: string;
      content: ContentBlock[];
    };

    // Extract thinking text (any text blocks)
    const thinkingBlocks = data.content.filter(b => b.type === "text") as Array<{ type: "text"; text: string }>;
    for (const block of thinkingBlocks) {
      if (block.text.trim()) {
        yield { type: "thinking", text: block.text };
      }
    }

    // Add assistant message to history
    messages.push({ role: "assistant", content: data.content });

    // Check stop reason
    if (data.stop_reason === "end_turn") {
      // No more tool calls — task complete without explicit task_complete call
      const finalText = thinkingBlocks.map(b => b.text).join("\n").trim();
      yield { type: "task_complete", output: finalText || "Task completed.", files: createdFiles };
      return;
    }

    if (data.stop_reason !== "tool_use") {
      yield { type: "error", message: `Unexpected stop reason: ${data.stop_reason}` };
      return;
    }

    // Process tool calls
    const toolUseBlocks = data.content.filter(b => b.type === "tool_use") as Array<{
      type: "tool_use"; id: string; name: string; input: Record<string, unknown>;
    }>;

    const toolResults: ContentBlock[] = [];

    for (const toolCall of toolUseBlocks) {
      yield { type: "tool_call", tool: toolCall.name, input: toolCall.input };

      let toolOutput = "";
      let isError = false;

      try {
        switch (toolCall.name) {

          case "shell": {
            const cmd = toolCall.input.command as string;
            yield { type: "status", text: `$ ${cmd.split("\n")[0].slice(0, 80)}${cmd.length > 80 ? "…" : ""}` };
            const result = await execInSandbox(sandbox, cmd);
            toolOutput = [
              result.stdout && `STDOUT:\n${result.stdout}`,
              result.stderr && `STDERR:\n${result.stderr}`,
              `EXIT CODE: ${result.exitCode}`,
              result.timedOut ? "TIMED OUT after 30s" : "",
            ].filter(Boolean).join("\n");
            isError = result.exitCode !== 0 && !result.timedOut;
            yield {
              type: "tool_result", tool: "shell",
              output: toolOutput.slice(0, 2000),
              exitCode: result.exitCode,
              error: isError,
            };
            break;
          }

          case "write_file": {
            const path = toolCall.input.path as string;
            const content = toolCall.input.content as string;
            await writeFileInSandbox(sandbox, path, content);
            toolOutput = `File written: ${path} (${content.length} bytes)`;
            createdFiles.push(path);
            yield { type: "file_created", path, content: content.slice(0, 500) };
            yield { type: "tool_result", tool: "write_file", output: toolOutput };
            break;
          }

          case "read_file": {
            const path = toolCall.input.path as string;
            const content = await readFileInSandbox(sandbox, path);
            toolOutput = content;
            yield { type: "file_read", path, content: content.slice(0, 500) };
            yield { type: "tool_result", tool: "read_file", output: toolOutput.slice(0, 3000) };
            break;
          }

          case "list_files": {
            const path = (toolCall.input.path as string) || ".";
            const files = await listFilesInSandbox(sandbox, path);
            toolOutput = files.length
              ? files.map(f => `${f.type === "dir" ? "📁" : "📄"} ${f.path}${f.size ? ` (${f.size}b)` : ""}`).join("\n")
              : "(empty directory)";
            yield { type: "tool_result", tool: "list_files", output: toolOutput };
            break;
          }

          case "browser": {
            const script = toolCall.input.script as string;
            yield { type: "status", text: `🌐 ${toolCall.input.description ?? "Running browser script..."}` };
            // Write script to temp file and execute
            await writeFileInSandbox(sandbox, ".browser_tmp.py", script);
            const result = await execInSandbox(sandbox, "cd /workspace && python3 .browser_tmp.py 2>&1");
            toolOutput = [
              result.stdout && `OUTPUT:\n${result.stdout}`,
              result.stderr && `STDERR:\n${result.stderr}`,
              `EXIT CODE: ${result.exitCode}`,
              result.timedOut ? "TIMED OUT after 30s" : "",
            ].filter(Boolean).join("\n");
            isError = result.exitCode !== 0;
            // Check if a screenshot was saved
            const screenshotCheck = await execInSandbox(sandbox, "ls /workspace/*.png 2>/dev/null | head -5");
            if (screenshotCheck.stdout.trim()) {
              const screenshots = screenshotCheck.stdout.trim().split("\n").map(p => p.replace("/workspace/", ""));
              screenshots.forEach(s => { if (!createdFiles.includes(s)) createdFiles.push(s); });
              yield { type: "file_created", path: screenshots[screenshots.length - 1] };
            }
            yield { type: "tool_result", tool: "browser", output: toolOutput.slice(0, 3000), exitCode: result.exitCode, error: isError };
            break;
          }

          case "upload_file": {
            const path = toolCall.input.path as string;
            const action = toolCall.input.action as string;
            // Verify file exists
            const checkResult = await execInSandbox(sandbox, `ls -la /workspace/${path} 2>/dev/null && echo EXISTS || echo MISSING`);
            if (checkResult.stdout.includes("EXISTS")) {
              toolOutput = `File /workspace/${path} is available. ${action}`;
              yield { type: "file_read", path, content: `User-uploaded file ready: ${path}` };
            } else {
              toolOutput = `File ${path} not found in workspace. Available files: $(ls /workspace 2>/dev/null)`;
              isError = true;
            }
            yield { type: "tool_result", tool: "upload_file", output: toolOutput };
            break;
          }

          case "task_complete": {
            const summary = toolCall.input.summary as string;
            const files = (toolCall.input.files as string[]) || createdFiles;
            yield { type: "task_complete", output: summary, files };
            return;
          }

          default: {
            toolOutput = `Unknown tool: ${toolCall.name}`;
            isError = true;
            yield { type: "tool_result", tool: toolCall.name, output: toolOutput, error: true };
          }
        }
      } catch (err) {
        toolOutput = `Tool execution error: ${(err as Error).message}`;
        isError = true;
        yield { type: "tool_result", tool: toolCall.name, output: toolOutput, error: true };
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolCall.id,
        content: toolOutput.slice(0, 10_000), // cap tool results sent back to Claude
      });
    }

    // Add tool results to message history
    messages.push({ role: "user", content: toolResults });
    yield { type: "step_complete", step: iteration, total: MAX_ITERATIONS };
  }

  yield { type: "error", message: `Agent reached maximum iterations (${MAX_ITERATIONS}). Task may be incomplete.` };
}
