import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Brain, Search, Save, Zap, RefreshCw, Wifi, WifiOff } from "lucide-react";

type BrainCtx = {
  online: boolean;
  state: {
    development_stage: string;
    total_neurons: number;
    total_synapses: number;
    uptime_hours: number;
    memory_count: number;
    learning_rate: number;
    attention_level: number;
    active_regions: string[];
    neuromodulators: { dopamine: number; acetylcholine: number; norepinephrine: number; serotonin: number };
  } | null;
  insights: {
    novelty_score: number;
    energy_level: number;
    recent_patterns: string[];
    cross_references: Array<{ a: string; b: string; strength: number }>;
  } | null;
  learned: {
    top_concepts: Array<{ concept: string; count: number }>;
    recent_memories: Array<{ text: string; source: string; ts: number }>;
    total_memories: number;
  } | null;
};

function NeuroBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className={color}>{pct}%</span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BrainPage() {
  const [recallQuery, setRecallQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const statusQuery = trpc.brain.status.useQuery(undefined, { refetchInterval: 5000 });
  const recallQuery_ = trpc.brain.recall.useQuery(
    { query: submitted, limit: 10 },
    { enabled: submitted.length > 0 }
  );
  const sleepQuery = trpc.brain.sleepInsights.useQuery({ limit: 15 });
  const saveMutation = trpc.brain.save.useMutation();

  const ctx = statusQuery.data as BrainCtx | undefined;
  const online = ctx?.online ?? false;

  const submitRecall = () => {
    if (recallQuery.trim()) setSubmitted(recallQuery.trim());
  };

  const nm = ctx?.state?.neuromodulators;

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-violet-400" />
          <div>
            <h1 className="text-xl font-bold">NeuroLinked Brain</h1>
            <p className="text-xs text-slate-400">100,000 neuron neuromorphic system</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {online ? (
            <span className="flex items-center gap-2 text-xs bg-emerald-900/30 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-400">
              <Wifi className="w-3 h-3" />
              {(ctx as any)?.mode === "neurolinked" ? "NeuroLinked" : "Embedded"} · {ctx?.state?.development_stage}
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-full">
              <WifiOff className="w-3 h-3" /> OFFLINE
            </span>
          )}
          <Button size="sm" variant="ghost" onClick={() => statusQuery.refetch()} className="text-slate-400">
            <RefreshCw className="w-4 h-4" />
          </Button>
          {online && (
            <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-violet-600 hover:bg-violet-700 text-xs">
              <Save className="w-4 h-4 mr-1" /> Save Brain
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left column */}
        <div className="w-80 border-r border-slate-800 flex flex-col flex-shrink-0">
          <ScrollArea className="flex-1 p-4 space-y-5">

            {/* Stats */}
            {online && ctx?.state && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brain State</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Neurons", value: ctx.state.total_neurons.toLocaleString() },
                    { label: "Synapses", value: ctx.state.total_synapses.toLocaleString() },
                    { label: "Memories", value: ctx.state.memory_count.toLocaleString() },
                    { label: "Uptime", value: `${ctx.state.uptime_hours.toFixed(1)}h` },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-xs text-slate-500">{s.label}</p>
                      <p className="text-sm font-bold text-violet-300">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Neuromodulators */}
            {online && nm && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neuromodulators</h3>
                <div className="space-y-3 bg-slate-800/30 border border-slate-700 rounded-lg p-3">
                  <NeuroBar label="Dopamine (learning)" value={nm.dopamine} color="text-yellow-400" />
                  <NeuroBar label="Acetylcholine (attention)" value={nm.acetylcholine} color="text-blue-400" />
                  <NeuroBar label="Norepinephrine (arousal)" value={nm.norepinephrine} color="text-red-400" />
                  <NeuroBar label="Serotonin (calm)" value={nm.serotonin} color="text-emerald-400" />
                </div>
              </div>
            )}

            {/* Active regions */}
            {online && ctx?.state?.active_regions?.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Regions</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ctx.state.active_regions.map((r) => (
                    <span key={r} className="text-xs px-2 py-1 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300">{r.replace(/_/g, " ")}</span>
                  ))}
                </div>
              </div>
            )}

            {!online && (
              <div className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg text-center">
                <p className="text-xs text-slate-500">Brain initialising...</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right column — recall + insights */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Recall search */}
          <div className="border-b border-slate-800 p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Associative Recall</h3>
            <div className="flex gap-2">
              <Input
                value={recallQuery}
                onChange={(e) => setRecallQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitRecall()}
                placeholder="Search your brain's memory..."
                className="bg-slate-800 border-slate-700 text-sm"
                disabled={!online}
              />
              <Button onClick={submitRecall} disabled={!online || !recallQuery.trim()} className="bg-violet-600 hover:bg-violet-700">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Recall results */}
            {submitted && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Recall: "{submitted}" — {recallQuery_.data?.length ?? 0} results
                </h3>
                {recallQuery_.isLoading ? (
                  <p className="text-slate-500 text-sm">Searching...</p>
                ) : recallQuery_.data?.length === 0 ? (
                  <p className="text-slate-500 text-sm">No memories found.</p>
                ) : (
                  <div className="space-y-2">
                    {(recallQuery_.data ?? []).map((m: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-violet-400">{m.source}</span>
                          <span className="text-xs text-slate-500">score: {m.score?.toFixed(3)}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{m.text}</p>
                        {m.tags?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {m.tags.map((t: string) => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{t}</span>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top concepts */}
            {online && ctx?.learned?.top_concepts?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Top Concepts Learned</h3>
                <div className="flex flex-wrap gap-2">
                  {ctx.learned.top_concepts.slice(0, 20).map((c: any) => (
                    <button key={c.concept} onClick={() => { setRecallQuery(c.concept); setSubmitted(c.concept); }}
                      className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-violet-500/50 hover:bg-violet-600/10 transition-colors text-sm text-slate-300">
                      {c.concept} <span className="text-xs text-slate-500">×{c.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cross-references */}
            {online && ctx?.insights?.cross_references?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  <Zap className="inline w-3 h-3 mr-1 text-yellow-400" />Cross-References Found
                </h3>
                <div className="space-y-2">
                  {ctx.insights.cross_references.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 bg-slate-800/30 border border-slate-700 rounded-lg text-sm">
                      <span className="text-violet-300 font-medium">{r.a}</span>
                      <span className="text-slate-600">↔</span>
                      <span className="text-violet-300 font-medium">{r.b}</span>
                      <span className="ml-auto text-xs text-slate-500">{r.strength?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sleep insights */}
            {sleepQuery.data && sleepQuery.data.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  <Activity className="inline w-3 h-3 mr-1 text-emerald-400" />Sleep Consolidation Insights
                </h3>
                <div className="space-y-2">
                  {sleepQuery.data.map((ins: any, i: number) => (
                    <div key={i} className={`p-3 border rounded-lg ${ins.kind === "cross-reference" ? "bg-violet-900/20 border-violet-500/30" : ins.kind === "pattern" ? "bg-amber-900/20 border-amber-500/30" : "bg-slate-800/40 border-slate-700"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-300">{ins.title}</span>
                        <span className="text-xs text-slate-500 ml-auto">{ins.kind}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{ins.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent memories */}
            {online && ctx?.learned?.recent_memories?.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Recent Memories</h3>
                <div className="space-y-2">
                  {ctx.learned.recent_memories.slice(0, 8).map((m: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-violet-400">{m.source}</span>
                        <span className="text-xs text-slate-600">{new Date(m.ts * 1000).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{m.text?.substring(0, 150)}{m.text?.length > 150 ? "…" : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
