import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Plus, Play, Trash2, Clock, CheckCircle, XCircle,
  Loader2, Terminal, Globe, RefreshCw, ExternalLink, Wifi, WifiOff
} from "lucide-react";

const TEMPLATES = [
  { id: "morningBriefing", label: "☀️ Morning Briefing", desc: "Daily digest at 7am", params: ["channels"] },
  { id: "urlMonitor",      label: "🔍 URL Monitor",      desc: "Watch a URL for changes", params: ["url", "checkEveryHours"] },
  { id: "researchTask",    label: "📚 Research Task",    desc: "Deep-research any topic", params: ["topic"] },
  { id: "tradingAlert",    label: "📊 Trading Alert",    desc: "Asset price check on schedule", params: ["asset"] },
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  failed:    <XCircle    className="w-4 h-4 text-red-400" />,
  running:   <Loader2    className="w-4 h-4 text-cyan-400 animate-spin" />,
  pending:   <Clock      className="w-4 h-4 text-slate-400" />,
};

type FlowStep = { id: string; type: string; content?: string; tool?: string; waitMs?: number; onSuccess?: string };
type Flow = { id?: string; name: string; description?: string; trigger: string; cronExpression?: string; steps: FlowStep[]; enabled?: boolean };

function FlowCard({ flow, onTrigger, onDelete }: { flow: Flow; onTrigger: (id: string) => void; onDelete: (id: string) => void }) {
  const triggerEmoji = { cron: "⏰", manual: "▶️", webhook: "🔗", message: "💬" }[flow.trigger] ?? "⚡";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 hover:border-cyan-500/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span>{triggerEmoji}</span>
            <h3 className="text-sm font-bold text-white truncate">{flow.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${flow.enabled !== false ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400" : "bg-slate-800 border-slate-600 text-slate-500"}`}>
              {flow.enabled !== false ? "Active" : "Paused"}
            </span>
          </div>
          {flow.description && <p className="text-xs text-slate-500 mt-1">{flow.description}</p>}
          {flow.cronExpression && <p className="text-xs text-slate-600 font-mono mt-1">{flow.cronExpression}</p>}
        </div>
        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
          <Button size="sm" variant="ghost" onClick={() => flow.id && onTrigger(flow.id)}
            className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/30">
            <Play className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => flow.id && onDelete(flow.id)}
            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {flow.steps.map((s) => (
          <span key={s.id} className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            {s.type}{s.tool ? `: ${s.tool}` : ""}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Tasks() {
  const [tab, setTab] = useState<"flows" | "dispatch" | "ledger" | "deepread">("flows");
  const [taskText, setTaskText] = useState("");
  const [deepReadUrls, setDeepReadUrls] = useState("");
  const [showNewFlow, setShowNewFlow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});

  const statusQuery  = trpc.task.status.useQuery(undefined, { refetchInterval: 5000 });
  const flowsQuery   = trpc.task.getFlows.useQuery();
  const ledgerQuery  = trpc.task.getLedger.useQuery({ limit: 30 }, { refetchInterval: 3000 });

  const sendMutation     = trpc.task.send.useMutation({ onSuccess: () => setTaskText("") });
  const triggerMutation  = trpc.task.triggerFlow.useMutation({ onSuccess: () => ledgerQuery.refetch() });
  const deleteMutation   = trpc.task.deleteFlow.useMutation({ onSuccess: () => flowsQuery.refetch() });
  const templateMutation = trpc.task.createFromTemplate.useMutation({ onSuccess: () => { flowsQuery.refetch(); setShowNewFlow(false); setTemplateParams({}); setSelectedTemplate(null); } });
  const deepReadMutation = trpc.task.deepRead.useMutation({ onSuccess: () => setDeepReadUrls("") });

  const online = statusQuery.data?.online ?? false;
  const status = statusQuery.data?.status;

  const submitTemplate = () => {
    if (!selectedTemplate) return;
    const params: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(templateParams)) {
      if (k === "channels") params[k] = v.split(",").map(s => s.trim());
      else if (k === "checkEveryHours") params[k] = parseInt(v) || 6;
      else params[k] = v;
    }
    templateMutation.mutate({ template: selectedTemplate as any, params });
  };

  const TABS = [
    { id: "flows",    label: "Flows",    icon: <Zap className="w-3.5 h-3.5" /> },
    { id: "dispatch", label: "Dispatch", icon: <Terminal className="w-3.5 h-3.5" /> },
    { id: "deepread", label: "DeepRead", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "ledger",   label: "Ledger",   icon: <Clock className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold">Task Automation</h1>
            <p className="text-xs text-slate-400">OpenClaw Gateway · Flows · DeepReeder</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Gateway status pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
            online
              ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-400"
              : "bg-slate-800 border-slate-700 text-slate-500"
          }`}>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {online ? `Gateway · ${status?.model ?? "online"}` : "Gateway offline"}
          </div>

          {online && status && (
            <div className="hidden md:flex items-center gap-4 text-xs text-slate-500">
              <span>{status.sessions} session{status.sessions !== 1 ? "s" : ""}</span>
              <span>{status.activeFlows} active flow{status.activeFlows !== 1 ? "s" : ""}</span>
              <span>{status.channels?.join(", ")}</span>
            </div>
          )}

          <Button size="sm" variant="ghost" onClick={() => statusQuery.refetch()} className="text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 px-6 flex gap-1 bg-slate-900/30 flex-shrink-0">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* ── Flows tab ──────────────────────────────────────── */}
        {tab === "flows" && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <p className="text-sm text-slate-400">
                {flowsQuery.data?.length ?? 0} automation{(flowsQuery.data?.length ?? 0) !== 1 ? "s" : ""} configured
              </p>
              <Button size="sm" onClick={() => setShowNewFlow(!showNewFlow)} className="bg-cyan-600 hover:bg-cyan-700">
                <Plus className="w-4 h-4 mr-1.5" /> New Flow
              </Button>
            </div>

            <AnimatePresence>
              {showNewFlow && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="border-b border-slate-800 overflow-hidden flex-shrink-0">
                  <div className="p-4 bg-slate-900/50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Choose a template</p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {TEMPLATES.map(t => (
                        <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setTemplateParams({}); }}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedTemplate === t.id
                              ? "bg-cyan-900/30 border-cyan-500/50"
                              : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                          }`}>
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                        </button>
                      ))}
                    </div>

                    {selectedTemplate && (
                      <div className="space-y-2 mb-3">
                        {TEMPLATES.find(t => t.id === selectedTemplate)?.params.map(param => (
                          <div key={param}>
                            <label className="text-xs text-slate-400 mb-1 block capitalize">{param.replace(/([A-Z])/g, " $1")}</label>
                            <Input
                              value={templateParams[param] ?? ""}
                              onChange={e => setTemplateParams(p => ({ ...p, [param]: e.target.value }))}
                              placeholder={
                                param === "channels" ? "main, whatsapp" :
                                param === "url" ? "https://example.com" :
                                param === "topic" ? "AI agents in 2026" :
                                param === "asset" ? "EURUSD" :
                                param === "checkEveryHours" ? "6" : ""
                              }
                              className="bg-slate-800 border-slate-600 text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button size="sm" onClick={submitTemplate} disabled={!selectedTemplate || !online || templateMutation.isPending}
                        className="bg-cyan-600 hover:bg-cyan-700">
                        {templateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                        Create Flow
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowNewFlow(false)} className="text-slate-400">Cancel</Button>
                    </div>

                    {!online && <p className="text-xs text-amber-400 mt-2">⚠️ OpenClaw gateway is offline — flows will be created but not executed</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {flowsQuery.isLoading && <p className="text-slate-500 text-sm text-center py-8">Loading flows...</p>}
                {flowsQuery.data?.length === 0 && !flowsQuery.isLoading && (
                  <div className="text-center py-16">
                    <Zap className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium mb-2">No automations yet</p>
                    <p className="text-slate-600 text-sm">Create a flow from a template above, or use<br /><code className="text-cyan-400">/task</code> in chat to dispatch tasks ad-hoc.</p>
                  </div>
                )}
                {flowsQuery.data?.map((flow: any) => (
                  <FlowCard key={flow.id ?? flow.name} flow={flow}
                    onTrigger={(id) => triggerMutation.mutate({ id })}
                    onDelete={(id) => deleteMutation.mutate({ id })}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* ── Dispatch tab ───────────────────────────────────── */}
        {tab === "dispatch" && (
          <div className="h-full flex flex-col p-6 max-w-2xl">
            <h2 className="text-lg font-bold mb-1">Dispatch a Task</h2>
            <p className="text-sm text-slate-400 mb-6">
              Send a natural language instruction to your OpenClaw agent. It will execute autonomously using its available tools — shell commands, browser automation, file ops, messaging.
            </p>

            <textarea
              value={taskText}
              onChange={e => setTaskText(e.target.value)}
              placeholder={"Examples:\n• Send a summary of my last 5 chat sessions to my Telegram\n• Search the web for the latest news on EURUSD and save to memory\n• Read the file ~/Desktop/todo.txt and create tasks from it\n• Monitor https://news.ycombinator.com and notify me of top AI stories"}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 resize-none font-mono min-h-48"
            />

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => taskText.trim() && sendMutation.mutate({ task: taskText.trim() })}
                disabled={!taskText.trim() || sendMutation.isPending || !online}
                className="bg-cyan-600 hover:bg-cyan-700 font-semibold"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Dispatch to OpenClaw
              </Button>
              {!online && <p className="text-xs text-amber-400">OpenClaw is offline</p>}
              {sendMutation.isSuccess && <p className="text-xs text-emerald-400">✓ Task dispatched — check Ledger for status</p>}
            </div>
          </div>
        )}

        {/* ── DeepRead tab ───────────────────────────────────── */}
        {tab === "deepread" && (
          <div className="h-full flex flex-col p-6 max-w-2xl">
            <h2 className="text-lg font-bold mb-1">DeepRead — URL Ingestion</h2>
            <p className="text-sm text-slate-400 mb-6">
              Paste one or more URLs. OpenClaw's DeepReeder skill will scrape each one — articles, X/Twitter threads, Reddit posts, YouTube transcripts — convert to clean Markdown, and save to agent memory. Use <code className="text-cyan-400">/recall</code> in chat to surface the content later.
            </p>

            <textarea
              value={deepReadUrls}
              onChange={e => setDeepReadUrls(e.target.value)}
              placeholder={"One URL per line or space-separated:\n\nhttps://example.com/article\nhttps://x.com/user/status/123456\nhttps://www.reddit.com/r/MachineLearning/comments/xyz/\nhttps://youtube.com/watch?v=dQw4w9WgXcQ"}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500/50 resize-none font-mono min-h-48"
            />

            <div className="mt-4 flex items-center gap-3">
              <Button
                onClick={() => {
                  const urls = deepReadUrls.split(/[\n\s]+/).filter(u => u.startsWith("http"));
                  if (urls.length) deepReadMutation.mutate({ urls });
                }}
                disabled={!deepReadUrls.trim() || deepReadMutation.isPending || !online}
                className="bg-violet-600 hover:bg-violet-700 font-semibold"
              >
                {deepReadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Globe className="w-4 h-4 mr-2" />}
                Ingest URLs
              </Button>
              {!online && <p className="text-xs text-amber-400">OpenClaw is offline</p>}
              {deepReadMutation.isSuccess && <p className="text-xs text-emerald-400">✓ Queued — content will be saved to agent memory</p>}
            </div>
          </div>
        )}

        {/* ── Ledger tab ─────────────────────────────────────── */}
        {tab === "ledger" && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
              <p className="text-sm text-slate-400">Recent task executions</p>
              <Button size="sm" variant="ghost" onClick={() => ledgerQuery.refetch()} className="text-slate-400">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {!online && (
                  <div className="text-center py-12">
                    <WifiOff className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">OpenClaw is offline — no execution history available</p>
                  </div>
                )}
                {online && ledgerQuery.data?.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-12">No tasks have run yet.</p>
                )}
                {ledgerQuery.data?.map((entry: any) => (
                  <div key={entry.id} className="flex items-start gap-3 p-3 bg-slate-800/40 border border-slate-700 rounded-lg">
                    <div className="mt-0.5">{STATUS_ICONS[entry.status] ?? STATUS_ICONS.pending}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white truncate">{entry.flowName}</p>
                        <span className={`text-xs flex-shrink-0 ${
                          entry.status === "completed" ? "text-emerald-400" :
                          entry.status === "failed" ? "text-red-400" :
                          entry.status === "running" ? "text-cyan-400" : "text-slate-500"
                        }`}>{entry.status}</span>
                      </div>
                      {entry.output && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.output}</p>}
                      {entry.error && <p className="text-xs text-red-400 mt-1">{entry.error}</p>}
                      <p className="text-xs text-slate-600 mt-1">
                        {new Date(entry.startedAt).toLocaleString()}
                        {entry.completedAt && ` · ${Math.round((entry.completedAt - entry.startedAt) / 1000)}s`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
