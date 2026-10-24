import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Terminal,
  FileText,
  Play,
  Square,
  RefreshCw,
  ChevronRight,
  Folder,
  File,
  Brain,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Download,
  ArrowLeft,
  Upload,
  X as XIcon,
} from "lucide-react";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

// ─── Types ─────────────────────────────────────────────────────
type AgentEvent =
  | { type: "thinking"; text: string }
  | { type: "tool_call"; tool: string; input: Record<string, unknown> }
  | {
      type: "tool_result";
      tool: string;
      output: string;
      exitCode?: number;
      error?: boolean;
    }
  | { type: "file_created"; path: string; content?: string }
  | { type: "file_read"; path: string; content: string }
  | { type: "step_complete"; step: number; total: number }
  | { type: "task_complete"; output: string; files: string[] }
  | { type: "error"; message: string }
  | { type: "status"; text: string }
  | { type: "sandbox_ready"; sandboxId: string; mode: string; workdir: string };

type EventLogEntry = AgentEvent & { id: string; ts: number };

type FileEntry = {
  name: string;
  type: "file" | "dir";
  path: string;
  size?: number;
};

// ─── Tool icons / colours ──────────────────────────────────────
const TOOL_META: Record<string, { emoji: string; color: string }> = {
  shell: { emoji: "💻", color: "text-green-400" },
  write_file: { emoji: "📝", color: "text-blue-400" },
  read_file: { emoji: "📖", color: "text-slate-400" },
  list_files: { emoji: "📁", color: "text-yellow-400" },
  browser: { emoji: "🌐", color: "text-purple-400" },
  upload_file: { emoji: "📤", color: "text-orange-400" },
  task_complete: { emoji: "✅", color: "text-emerald-400" },
};

// ─── Event row ─────────────────────────────────────────────────
function EventRow({ event }: { event: EventLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  if (event.type === "status") {
    return <p className="text-xs text-slate-500 italic py-0.5">{event.text}</p>;
  }

  if (event.type === "sandbox_ready") {
    return (
      <div className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-500/20 rounded px-3 py-1.5 my-1">
        🏗️ Sandbox ready · {event.mode} mode · {event.workdir}
      </div>
    );
  }

  if (event.type === "thinking") {
    return (
      <div className="my-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200 w-full text-left"
        >
          <Brain className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">
            {event.text.split("\n")[0].slice(0, 100)}
          </span>
          <ChevronRight
            className={`w-3 h-3 ml-auto flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </button>
        {expanded && (
          <div className="mt-1 ml-5 text-xs text-slate-300 bg-slate-800/50 rounded p-2 leading-relaxed whitespace-pre-wrap">
            {event.text}
          </div>
        )}
      </div>
    );
  }

  if (event.type === "tool_call") {
    const meta = TOOL_META[event.tool] ?? {
      emoji: "⚡",
      color: "text-slate-400",
    };
    const preview =
      event.tool === "shell"
        ? (event.input.command as string)?.split("\n")[0]?.slice(0, 80)
        : event.tool === "write_file"
          ? `→ ${event.input.path}`
          : event.tool === "browser_fetch"
            ? (event.input.url as string)?.slice(0, 60)
            : event.tool === "task_complete"
              ? "Completing task..."
              : JSON.stringify(event.input).slice(0, 60);

    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 py-1 hover:bg-slate-800/30 rounded px-1 text-left group"
      >
        <span className="text-sm">{meta.emoji}</span>
        <span className={`text-xs font-mono font-bold ${meta.color}`}>
          {event.tool}
        </span>
        <span className="text-xs text-slate-400 truncate flex-1">
          {preview}
        </span>
        <ChevronRight
          className={`w-3 h-3 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
        />
        {expanded && (
          <pre className="absolute left-0 right-0 mt-6 ml-6 text-xs text-slate-300 bg-slate-900 border border-slate-700 rounded p-2 z-10 overflow-auto max-h-48 whitespace-pre-wrap">
            {JSON.stringify(event.input, null, 2)}
          </pre>
        )}
      </button>
    );
  }

  if (event.type === "tool_result") {
    const isErr = event.error;
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-2 py-0.5 text-left"
      >
        <span
          className={`text-xs mt-0.5 font-mono ${isErr ? "text-red-400" : "text-slate-500"}`}
        >
          {isErr ? "✗" : "✓"}
        </span>
        <span
          className={`text-xs truncate flex-1 ${isErr ? "text-red-300" : "text-slate-400"}`}
        >
          {event.output.split("\n")[0].slice(0, 100)}
        </span>
        {expanded && (
          <pre className="absolute left-0 right-0 mt-4 ml-4 text-xs bg-slate-900 border border-slate-700 rounded p-2 z-10 overflow-auto max-h-64 whitespace-pre-wrap font-mono text-slate-300">
            {event.output}
          </pre>
        )}
      </button>
    );
  }

  if (event.type === "file_created") {
    return (
      <div className="flex items-center gap-2 py-0.5 text-xs text-blue-400">
        <File className="w-3 h-3 flex-shrink-0" />
        <span>
          Created <span className="font-mono">{event.path}</span>
        </span>
      </div>
    );
  }

  if (event.type === "task_complete") {
    return (
      <div className="my-2 p-3 bg-emerald-900/20 border border-emerald-500/30 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-emerald-300">
            Task Complete
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">{event.output}</p>
        {event.files?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {event.files.map(f => (
              <span
                key={f}
                className="text-xs font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div className="my-1 flex items-start gap-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-xs text-red-300">
        <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
        {event.message}
      </div>
    );
  }

  if (event.type === "step_complete") {
    return (
      <div className="flex items-center gap-2 py-1 border-t border-slate-800/50 mt-1">
        <div className="flex-1 h-px bg-slate-800" />
        <span className="text-xs text-slate-600">Step {event.step}</span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>
    );
  }

  return null;
}

// ─── Upload Zone ───────────────────────────────────────────────
function UploadZone({
  sessionId,
  userId,
  onUploaded,
}: {
  sessionId: string;
  userId: number | null;
  onUploaded: (filename: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploads, setUploads] = useState<
    Array<{ name: string; status: "ok" | "err" }>
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!userId) return;
    setUploading(true);
    try {
      const res = await fetch("/api/sandbox/upload", {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
          "x-session-id": sessionId,
          "x-user-id": String(userId),
          "x-filename": encodeURIComponent(file.name),
        },
        body: file,
      });
      const data = await res.json();
      if (data.ok) {
        setUploads(prev => [...prev, { name: file.name, status: "ok" }]);
        onUploaded(file.name);
      } else {
        setUploads(prev => [...prev, { name: file.name, status: "err" }]);
      }
    } catch {
      setUploads(prev => [...prev, { name: file.name, status: "err" }]);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    Array.from(e.dataTransfer.files).forEach(uploadFile);
  };

  return (
    <div className="p-3 border-b border-slate-800">
      <div
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-cyan-500 bg-cyan-900/20"
            : "border-slate-700 hover:border-slate-600"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={e => Array.from(e.target.files ?? []).forEach(uploadFile)}
        />
        {uploading ? (
          <p className="text-xs text-cyan-400 flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Uploading...
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            <Upload className="w-3 h-3 inline mr-1" />
            Drop files or click to upload into sandbox
          </p>
        )}
      </div>
      {uploads.length > 0 && (
        <div className="mt-2 space-y-1">
          {uploads.slice(-3).map((u, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${u.status === "ok" ? "text-emerald-400" : "text-red-400"}`}
            >
              {u.status === "ok" ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {u.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File viewer ───────────────────────────────────────────────
function FileViewer({ sessionId }: { sessionId: string }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const filesQuery = trpc.sandbox.listFiles.useQuery(
    { sessionId, path: "." },
    { refetchInterval: 3000 }
  );
  const fileQuery = trpc.sandbox.readFile.useQuery(
    { sessionId, path: selectedPath! },
    { enabled: !!selectedPath }
  );

  const files = (filesQuery.data ?? []) as FileEntry[];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 flex-shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Workspace
        </span>
        <button
          onClick={() => filesQuery.refetch()}
          className="text-slate-600 hover:text-slate-400"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* File list */}
        <div className="w-40 border-r border-slate-800 overflow-y-auto flex-shrink-0">
          {files.length === 0 && (
            <p className="text-xs text-slate-600 p-3">Empty workspace</p>
          )}
          {files
            .filter(f => f.type === "file")
            .map(f => (
              <button
                key={f.path}
                onClick={() => setSelectedPath(f.path)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-800/50 ${selectedPath === f.path ? "bg-slate-800 text-white" : "text-slate-400"}`}
              >
                <File className="w-3 h-3 flex-shrink-0" />
                <span className="text-xs truncate font-mono">{f.name}</span>
              </button>
            ))}
        </div>

        {/* File content */}
        <div className="flex-1 overflow-auto p-3">
          {selectedPath ? (
            fileQuery.isLoading ? (
              <p className="text-xs text-slate-500">Loading...</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400">
                    {selectedPath}
                  </span>
                  <a
                    href={`/api/sandbox/download?sessionId=${encodeURIComponent(sessionId)}&path=${encodeURIComponent(selectedPath)}`}
                    download
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                  >
                    <Download className="w-3 h-3" /> Download
                  </a>
                </div>
                <pre className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
                  {fileQuery.data?.content}
                </pre>
              </>
            )
          ) : (
            <p className="text-xs text-slate-600 text-center mt-8">
              Select a file to view
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Sandbox page ─────────────────────────────────────────
export default function SandboxPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [task, setTask] = useState("");
  const [sessionId] = useState(() => `sandbox-${nanoid(8)}`);
  const [userId, setUserId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "upload">(
    "terminal"
  );

  const handleUpload = (filename: string) => {
    // Pre-fill task with context about the uploaded file
    if (!task) setTask(`Process the uploaded file: ${filename}`);
    setActiveTab("terminal");
  };
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const capabilitiesQuery = trpc.sandbox.capabilities.useQuery();
  const statusQuery = trpc.sandbox.status.useQuery(
    { sessionId },
    { enabled: done || running }
  );
  const killMutation = trpc.sandbox.kill.useMutation({
    onSuccess: () => {
      setRunning(false);
      setDone(false);
    },
  });

  useEffect(() => {
    if ((user as any)?.id) setUserId((user as any).id);
  }, [user]);

  useEffect(() => {
    const prefill = sessionStorage.getItem("mantra_sandbox_task");
    if (prefill) {
      setTask(prefill);
      sessionStorage.removeItem("mantra_sandbox_task");
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  const addEvent = useCallback((event: AgentEvent) => {
    setEvents(prev => [...prev, { ...event, id: nanoid(6), ts: Date.now() }]);
  }, []);

  const runTask = async () => {
    if (!task.trim() || !userId || running) return;
    setRunning(true);
    setDone(false);
    setEvents([]);
    setStep(0);
    setActiveTab("terminal");

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), sessionId, userId }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No response stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const event = JSON.parse(raw) as AgentEvent;
            addEvent(event);
            if (event.type === "step_complete") setStep(event.step);
            if (event.type === "task_complete" || event.type === "error") {
              setDone(true);
              setRunning(false);
              setActiveTab("files");
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        addEvent({ type: "error", message: (err as Error).message });
      }
    } finally {
      setRunning(false);
    }
  };

  const stopTask = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const EXAMPLE_TASKS = [
    "Write a Python web scraper that fetches the top 10 Hacker News stories and saves them to a JSON file",
    "Create a simple REST API in Node.js with Express that has /health and /echo endpoints",
    "Write a Python script that generates a CSV with 100 rows of fake business data",
    "Build a Markdown to HTML converter in Python with syntax highlighting",
    "Write and run a Python script that calculates compound interest and outputs a table",
  ];

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-3 flex items-center gap-4 flex-shrink-0">
        <button
          onClick={() => navigate("/app")}
          className="text-slate-500 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <Terminal className="w-5 h-5 text-cyan-400" />
        <div>
          <h1 className="text-base font-bold">Mantra Sandbox</h1>
          <p className="text-xs text-slate-500">
            {capabilitiesQuery.data?.docker
              ? "🐳 Docker · isolated containers"
              : "⚡ Process mode · restricted sandbox"}
          </p>
        </div>

        {running && (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 h-3 bg-cyan-500 rounded-full"
                  animate={{ scaleY: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-cyan-400">Step {step}</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {done && (
            <button
              onClick={() => navigate("/tasks")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Automate
            </button>
          )}
          {(running || done) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => killMutation.mutate({ sessionId })}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs"
            >
              <Square className="w-3 h-3 mr-1" /> Kill
            </Button>
          )}
        </div>
      </div>

      {/* Task input */}
      <div className="border-b border-slate-800 px-4 py-3 flex gap-2 flex-shrink-0 bg-slate-900/30">
        <Input
          value={task}
          onChange={e => setTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && runTask()}
          placeholder="Describe what you want to build or automate..."
          disabled={running}
          className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 font-mono text-sm"
        />
        <Button
          onClick={running ? stopTask : runTask}
          disabled={!task.trim() || !userId}
          className={
            running
              ? "bg-red-600 hover:bg-red-700"
              : "bg-cyan-600 hover:bg-cyan-700"
          }
        >
          {running ? (
            <>
              <Square className="w-4 h-4 mr-1.5" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1.5" />
              Run
            </>
          )}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Events / Files area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-800 flex-shrink-0">
            {[
              {
                id: "terminal",
                label: "Terminal",
                icon: <Terminal className="w-3.5 h-3.5" />,
              },
              {
                id: "files",
                label: "Files",
                icon: <Folder className="w-3.5 h-3.5" />,
              },
              {
                id: "upload",
                label: "Upload",
                icon: <Upload className="w-3.5 h-3.5" />,
              },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === t.id
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Terminal */}
          {activeTab === "terminal" && (
            <ScrollArea
              ref={scrollRef}
              className="flex-1 p-4 font-mono text-sm"
            >
              {events.length === 0 && !running && (
                <div className="h-full flex flex-col items-center justify-center">
                  <Terminal className="w-14 h-14 text-slate-800 mb-5" />
                  <h2 className="text-lg font-bold text-slate-600 mb-2">
                    Mantra Sandbox
                  </h2>
                  <p className="text-sm text-slate-600 mb-6 text-center max-w-sm">
                    Describe a task and the agent will autonomously write code,
                    run commands, and produce results — just like Manus.
                  </p>
                  <div className="space-y-2 w-full max-w-lg">
                    {EXAMPLE_TASKS.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setTask(ex)}
                        className="w-full text-left px-4 py-2.5 bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 hover:bg-slate-800/60 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <ChevronRight className="inline w-3 h-3 mr-1.5 text-cyan-600" />
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-0.5 relative">
                {events.map(event => (
                  <EventRow key={event.id} event={event} />
                ))}
                {running && (
                  <motion.div
                    className="flex items-center gap-2 mt-2 text-xs text-cyan-400"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Agent working...
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* File viewer */}
          {activeTab === "files" && (
            <div className="flex-1 overflow-hidden">
              <FileViewer sessionId={sessionId} />
            </div>
          )}

          {/* Upload */}
          {activeTab === "upload" && (
            <div className="flex-1 overflow-auto p-4">
              <h2 className="text-sm font-bold mb-1">
                Upload Files into Sandbox
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Files land in <code className="text-cyan-400">/workspace/</code>
                . The agent can read and process them immediately.
              </p>
              <UploadZone
                sessionId={sessionId}
                userId={userId}
                onUploaded={handleUpload}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
