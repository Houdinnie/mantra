/**
 * SwarmHub — Live Command Cockpit
 * All data is real: digest from AI, activity from sessions, presence from memory,
 * command bar navigates to chat with pre-filled commands.
 */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import NeuralGlobe from "./NeuralGlobe";
import { Loader2, Mic, MicOff, Send, Brain, FileText, MessageSquare, Zap, Terminal } from "lucide-react";

// ─── Persona pillars (visual only, clicking routes to chat) ───
const PILLARS = [
  { id: "nomad",      name: "Nomad Navigator",   icon: "🗺️", color: "#00f5ff", desc: "Visa, presence, relocation" },
  { id: "tax",        name: "Tax Strategist",     icon: "💰", color: "#ffd700", desc: "NHR, treaty, entity structuring" },
  { id: "legal",      name: "Entity Lawyer",      icon: "⚖️", color: "#ff00aa", desc: "LLC, corp, compliance" },
  { id: "wellness",   name: "Wellness Director",  icon: "🏥", color: "#00ffcc", desc: "Health, longevity, insurance" },
  { id: "luxury",     name: "Luxury Concierge",   icon: "✈️", color: "#ff6600", desc: "Travel, hotels, VIP access" },
  { id: "wealth",     name: "Wealth Architect",   icon: "📈", color: "#8844ff", desc: "Portfolio, banking, crypto" },
  { id: "compliance", name: "Compliance Officer", icon: "🔐", color: "#00ff88", desc: "SOC2, GDPR, KYC/AML" },
];

const SKILL_SHORTCUTS = [
  { cmd: "/milliondollaridea", label: "💡 Million Dollar Idea" },
  { cmd: "/validate-idea",     label: "✅ Validate Idea" },
  { cmd: "/board",             label: "🏛️ Board Session" },
  { cmd: "/trading",           label: "📊 Trading Research" },
  { cmd: "/marketing",         label: "📣 Marketing Agent" },
  { cmd: "/content",           label: "✍️ Content Agent" },
  { cmd: "/brain",             label: "🧠 Brain Status" },
  { cmd: "/digest",            label: "☀️ Morning Digest" },
];

// ─── Live activity feed from real sessions ─────────────────────
function useActivityFeed() {
  const sessionsQuery = trpc.chat.getSessions.useQuery({ limit: 8 });
  return (sessionsQuery.data ?? []).map((s, i) => ({
    title: s.title ?? "Chat session",
    preview: s.lastMessage ?? "…",
    updatedAt: s.updatedAt,
    sessionId: s.sessionId,
  }));
}

// ─── Presence gauge from memory ────────────────────────────────
function usePresenceData() {
  const memQuery = trpc.memory.getAll.useQuery();
  const memories = memQuery.data ?? [];
  const presenceMem = memories.find(m => m.key === "portugal_days");
  const days = presenceMem ? parseInt(presenceMem.value) : null;
  return { days, total: 183 };
}

// ─── Morning Digest widget ─────────────────────────────────────
function MorningDigestWidget() {
  const [digest, setDigest] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const generateMutation = trpc.digest.generate.useMutation({
    onSuccess: (data) => { setDigest(data.digest); setLoading(false); },
    onError: () => setLoading(false),
  });

  useEffect(() => {
    setLoading(true);
    generateMutation.mutate({});
  }, []);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden h-full">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-sm font-bold text-white">☀️ Morning Digest</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
        </div>
        <div className="flex-1 overflow-y-auto text-xs text-slate-300 leading-relaxed space-y-1">
          {loading && !digest && (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-3 bg-slate-700/50 rounded animate-pulse" style={{ width: `${70 + i * 5}%` }} />
              ))}
            </div>
          )}
          {digest && digest.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className={
              line.startsWith("##") ? "text-cyan-400 font-bold text-xs mt-2" :
              line.startsWith("###") ? "text-slate-400 font-semibold text-xs mt-1" :
              line.startsWith("🔴") ? "text-red-400" :
              line.startsWith("🟡") ? "text-amber-400" :
              line.startsWith("🟢") ? "text-emerald-400" :
              "text-slate-400"
            }>{line.replace(/^#+\s*/, "")}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Activity feed widget ──────────────────────────────────────
function ActivityFeed({ onSelectSession }: { onSelectSession: (id: string) => void }) {
  const activity = useActivityFeed();

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-4 h-full flex flex-col">
      <h3 className="text-xs font-bold text-cyan-400 mb-3 flex items-center gap-2 flex-shrink-0">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Recent Sessions
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2">
        {activity.length === 0 && (
          <p className="text-slate-600 text-xs text-center py-4">No sessions yet — start chatting</p>
        )}
        {activity.map((item, i) => (
          <motion.button
            key={item.sessionId}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectSession(item.sessionId)}
            className="w-full flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer text-left"
          >
            <MessageSquare className="w-3.5 h-3.5 text-cyan-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{item.title}</p>
              <p className="text-xs text-slate-500 truncate">{item.preview}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Presence gauge ────────────────────────────────────────────
function PresenceGauge() {
  const { days, total } = usePresenceData();
  const memMutation = trpc.memory.set.useMutation();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const displayDays = days ?? 0;
  const pct = (displayDays / total) * 100;
  const risk = pct > 90 ? "High" : pct > 70 ? "Medium" : "Low";
  const riskColor = risk === "High" ? "#ff4444" : risk === "Medium" ? "#ffaa00" : "#00ff88";

  const save = () => {
    const n = parseInt(input);
    if (!isNaN(n) && n >= 0 && n <= 183) {
      memMutation.mutate({ key: "portugal_days", value: String(n) });
    }
    setEditing(false);
  };

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3">
      <h3 className="text-xs font-bold text-white mb-2 flex items-center gap-1">
        🇵🇹 Portugal Presence
      </h3>
      {editing ? (
        <div className="flex gap-1">
          <input
            autoFocus value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            placeholder="Days (0-183)"
            className="flex-1 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-white"
          />
          <button onClick={save} className="px-2 py-1 bg-cyan-600 rounded text-xs text-white">✓</button>
        </div>
      ) : (
        <>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <button onClick={() => { setEditing(true); setInput(String(displayDays)); }} className="hover:text-white">
              {days !== null ? `${displayDays} days` : "Set days →"}
            </button>
            <span>{total} limit</span>
          </div>
          {days !== null && (
            <>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: riskColor }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: riskColor }}>{risk} Risk</span>
                <span className="text-xs text-slate-500">NHR</span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ─── Voice recorder widget ─────────────────────────────────────
function VoiceWidget({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "recording" | "uploading" | "transcribing">("idle");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const transcribeMutation = trpc.voice.transcribe.useMutation({
    onSuccess: (data) => { onTranscript(data.text); setStatus("idle"); },
    onError: () => setStatus("idle"),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setStatus("uploading");
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const res = await fetch("/api/voice/upload", {
          method: "POST", body: blob,
          headers: { "Content-Type": "audio/webm" },
        });
        const { url } = await res.json();
        setStatus("transcribing");
        transcribeMutation.mutate({ audioUrl: url });
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setStatus("recording");
    } catch { setStatus("idle"); }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const label = { idle: "Voice", recording: "Stop", uploading: "Uploading…", transcribing: "Transcribing…" }[status];

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      disabled={status === "uploading" || status === "transcribing"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        recording ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
        : status !== "idle" ? "bg-slate-700 text-slate-400 cursor-wait"
        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
      }`}
    >
      {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

// ─── Pillar card ───────────────────────────────────────────────
function PillarCard({ pillar, onClick }: { pillar: typeof PILLARS[0]; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-slate-900/50 border rounded-xl p-3 cursor-pointer group relative overflow-hidden text-left w-full"
      style={{ borderColor: pillar.color + "40" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity"
        style={{ background: `radial-gradient(circle at 50% 0%, ${pillar.color}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-1">
          <span className="text-lg">{pillar.icon}</span>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: pillar.color }} />
        </div>
        <p className="text-xs font-bold" style={{ color: pillar.color }}>{pillar.name}</p>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{pillar.desc}</p>
      </div>
    </motion.button>
  );
}

// ─── Command bar ───────────────────────────────────────────────
function CommandBar({ onNavigate }: { onNavigate: (cmd: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.startsWith("/")
    ? SKILL_SHORTCUTS.filter(s => s.cmd.startsWith(query.split(" ")[0]))
    : SKILL_SHORTCUTS;

  const submit = () => {
    if (!query.trim()) return;
    onNavigate(query.trim());
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative flex-1">
      <div className="flex items-center bg-slate-900/80 border border-cyan-500/30 rounded-xl px-3 py-2 backdrop-blur-xl gap-2">
        <span className="text-cyan-400 text-sm">⟨</span>
        <input ref={inputRef} type="text" value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setOpen(false); }}
          placeholder="Command the swarm… or type / for skills"
          className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
        />
        <button onClick={submit} className="text-cyan-500 hover:text-cyan-300">
          <Send className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl z-50">
            <div className="p-2 grid grid-cols-2 gap-1">
              {filtered.map(s => (
                <button key={s.cmd} onClick={() => { onNavigate(s.cmd); setQuery(""); setOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 text-left">
                  <span className="text-xs text-slate-100">{s.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main SwarmHub ─────────────────────────────────────────────
export default function SwarmHub() {
  const [, navigate] = useLocation();
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);

  const goToChat = (cmd: string) => {
    // Store the prefilled command in sessionStorage so Chat.tsx can pick it up
    sessionStorage.setItem("mantra_prefill", cmd);
    navigate("/app");
  };

  const handlePillarClick = (pillar: typeof PILLARS[0]) => {
    setActivePillar(activePillar === pillar.id ? null : pillar.id);
    goToChat(pillar.desc + " — help me with " + pillar.name);
  };

  const handleVoiceTranscript = (text: string) => {
    setVoiceTranscript(text);
    goToChat(text);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-5 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold">
            <span className="text-cyan-400">VENTURE</span><span className="text-white">MIND</span>
          </h1>
          <p className="text-xs text-slate-500">Neon Nomad Empire · 7 Pillars</p>
        </div>

        <CommandBar onNavigate={goToChat} />

        <VoiceWidget onTranscript={handleVoiceTranscript} />

        <PresenceGauge />

        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/notes")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-300">
            <FileText className="w-3.5 h-3.5" /> Notes
          </button>
          <button onClick={() => navigate("/sandbox")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-green-400">
            <Terminal className="w-3.5 h-3.5" /> Sandbox
          </button>
          <button onClick={() => navigate("/tasks")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-cyan-400">
            <Zap className="w-3.5 h-3.5" /> Tasks
          </button>
          <button onClick={() => navigate("/brain")} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-violet-400">
            <Brain className="w-3.5 h-3.5" /> Brain
          </button>
          <button onClick={() => navigate("/app")} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-semibold">
            Open Chat →
          </button>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-12 gap-4" style={{ height: "calc(100vh - 120px)" }}>
        {/* Left — digest + activity */}
        <div className="col-span-3 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0"><MorningDigestWidget /></div>
          <div className="flex-1 min-h-0">
            <ActivityFeed onSelectSession={(id) => { sessionStorage.setItem("mantra_session", id); navigate("/app"); }} />
          </div>
        </div>

        {/* Center — globe */}
        <div className="col-span-6 bg-slate-900/30 border border-slate-700/30 rounded-2xl overflow-hidden">
          <NeuralGlobe activePillar={activePillar ?? undefined} />
        </div>

        {/* Right — pillars */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">7 Pillars</p>
          <div className="grid grid-cols-2 gap-2">
            {PILLARS.map(p => (
              <PillarCard key={p.id} pillar={p} onClick={() => handlePillarClick(p)} />
            ))}
          </div>

          {/* Quick skills */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Quick Skills</p>
          <div className="space-y-1">
            {SKILL_SHORTCUTS.slice(0, 5).map(s => (
              <button key={s.cmd} onClick={() => goToChat(s.cmd)}
                className="w-full text-left px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                <span className="text-xs text-slate-200">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
