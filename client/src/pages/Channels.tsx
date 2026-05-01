import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Plus, Send, Trash2, Settings, Loader2, ArrowLeft,
  CheckCircle, Zap, Edit2, X, ChevronRight
} from "lucide-react";
import { StreamingMath } from "@/components/MathRenderer";
import { nanoid } from "nanoid";

// ─── Types ─────────────────────────────────────────────────────
type Channel = {
  id: number; name: string; description?: string | null; emoji: string;
  personaId: string; systemPromptOverride?: string | null; modelOverride?: string | null;
  color: string; messageCount: number; lastMessage?: string | null; pinned: boolean;
};

type Message = { role: "user" | "assistant"; content: string; persona?: string; personaEmoji?: string };

// ─── @mention autocomplete data ────────────────────────────────
const AGENT_MENTIONS = [
  { mention: "@ideator",    label: "Ideator 💡",          desc: "Startup ideas & validation" },
  { mention: "@tax",        label: "Tax Strategist 💰",    desc: "NHR, UAE, Singapore" },
  { mention: "@legal",      label: "Entity Lawyer ⚖️",     desc: "LLC, corp, structure" },
  { mention: "@compliance", label: "Compliance Officer 🔐", desc: "GDPR, SOC2, KYC" },
  { mention: "@nomad",      label: "Nomad Navigator 🗺️",   desc: "Visa, presence, relocation" },
  { mention: "@luxury",     label: "Luxury Concierge ✈️",  desc: "Travel, hotels, VIP" },
  { mention: "@wellness",   label: "Wellness Director 🏥",  desc: "Health, longevity" },
  { mention: "@wealth",     label: "Wealth Architect 📈",   desc: "Portfolio, banking" },
  { mention: "@ceo",        label: "CEO 👑",               desc: "Strategy & vision" },
  { mention: "@cto",        label: "CTO ⚙️",               desc: "Architecture & engineering" },
  { mention: "@cmo",        label: "CMO 📣",               desc: "Marketing & growth" },
];

// ─── Channel chat pane ─────────────────────────────────────────
function ChannelChat({ channel, userId }: { channel: Channel; userId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `ch-${channel.id}-${nanoid(8)}`);
  const [showMentions, setShowMentions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const historyQuery = trpc.channel.getHistory.useQuery({ channelId: channel.id, sessionId });

  useEffect(() => {
    if (historyQuery.data) {
      setMessages(historyQuery.data.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })));
    }
  }, [historyQuery.data]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Detect @mention in input
  const atMatch = input.match(/@(\w*)$/);
  const mentionQuery = atMatch ? atMatch[1].toLowerCase() : "";
  const filteredMentions = showMentions && atMatch
    ? AGENT_MENTIONS.filter(m => m.mention.includes(mentionQuery))
    : [];

  const insertMention = (mention: string) => {
    setInput(prev => prev.replace(/@\w*$/, mention + " "));
    setShowMentions(false);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    setShowMentions(false);
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setIsLoading(true);

    const assistantIdx = messages.length + 1;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();
    let accumulated = "";

    try {
      const res = await fetch(`/api/channels/${channel.id}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, userId, sessionId }),
        signal: abortRef.current.signal,
      });

      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw) as { type: string; text?: string; persona?: string; personaEmoji?: string };
            if (evt.type === "routing") {
              setMessages(prev => {
                const u = [...prev];
                u[assistantIdx] = { ...u[assistantIdx], persona: evt.persona, personaEmoji: evt.personaEmoji };
                return u;
              });
            } else if (evt.type === "delta" && evt.text) {
              accumulated += evt.text;
              setMessages(prev => {
                const u = [...prev];
                u[assistantIdx] = { ...u[assistantIdx], content: accumulated };
                return u;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages(prev => { const u = [...prev]; u[assistantIdx] = { ...u[assistantIdx], content: "Error — please try again." }; return u; });
      }
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages.length, channel.id, userId, sessionId]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Channel header */}
      <div className="border-b border-slate-800 px-5 py-3 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottomColor: channel.color + "30" }}>
        <span className="text-2xl">{channel.emoji}</span>
        <div>
          <h2 className="font-bold text-white">{channel.name}</h2>
          {channel.description && <p className="text-xs text-slate-400">{channel.description}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>{channel.messageCount} messages</span>
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: channel.color }} />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-5 py-5">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">{channel.emoji}</div>
              <h3 className="text-lg font-bold text-slate-400 mb-2">{channel.name}</h3>
              <p className="text-sm text-slate-600 mb-4">{channel.description ?? "Your dedicated AI channel"}</p>
              <p className="text-xs text-slate-600">Type a message or use <code className="text-cyan-400">@mention</code> to route to a specific agent</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xl w-full px-4 py-3 rounded-xl ${
                msg.role === "user"
                  ? "border text-white ml-12"
                  : "bg-slate-800/50 border border-slate-700 mr-12"
              }`} style={msg.role === "user" ? { borderColor: channel.color + "60", backgroundColor: channel.color + "15" } : {}}>
                {msg.role === "assistant" && (msg.persona || channel.emoji) && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm">{msg.personaEmoji ?? channel.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: channel.color }}>
                      {msg.persona ?? channel.name}
                    </span>
                  </div>
                )}
                {msg.role === "assistant"
                  ? msg.content ? <StreamingMath>{msg.content}</StreamingMath> : <span className="text-slate-500 text-sm italic">Thinking…</span>
                  : <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                }
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: channel.color }}
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* @mention autocomplete */}
      <div className="px-5 pb-1 flex-shrink-0">
        <AnimatePresence>
          {filteredMentions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden mb-2 shadow-2xl">
              {filteredMentions.map(m => (
                <button key={m.mention} onClick={() => insertMention(m.mention)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-800 text-left">
                  <span className="text-cyan-400 font-mono text-sm font-bold">{m.mention}</span>
                  <span className="text-white text-sm">{m.label}</span>
                  <span className="text-slate-500 text-xs ml-auto">{m.desc}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="px-5 pb-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input value={input}
            onChange={e => { setInput(e.target.value); setShowMentions(e.target.value.includes("@")); }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              if (e.key === "Escape") setShowMentions(false);
            }}
            placeholder={`Message ${channel.name}… or @mention an agent`}
            disabled={isLoading}
            className="bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:border-opacity-60"
            style={{ "--tw-ring-color": channel.color } as any}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}
            className="text-black font-semibold px-5"
            style={{ backgroundColor: channel.color }}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-slate-600 mt-1.5 ml-1">Type @ to route to a specific agent · / for skill commands</p>
      </div>
    </div>
  );
}

// ─── Channel editor ────────────────────────────────────────────
function ChannelEditor({ channel, onSave, onClose }: {
  channel?: Partial<Channel>; onSave: () => void; onClose: () => void;
}) {
  const personasQuery = trpc.channel.personas.useQuery();
  const createMutation = trpc.channel.create.useMutation({ onSuccess: () => { onSave(); onClose(); } });
  const updateMutation = trpc.channel.update.useMutation({ onSuccess: () => { onSave(); onClose(); } });

  const [name, setName] = useState(channel?.name ?? "");
  const [description, setDescription] = useState(channel?.description ?? "");
  const [emoji, setEmoji] = useState(channel?.emoji ?? "💬");
  const [personaId, setPersonaId] = useState(channel?.personaId ?? "default");
  const [color, setColor] = useState(channel?.color ?? "#00f5ff");
  const [systemPrompt, setSystemPrompt] = useState(channel?.systemPromptOverride ?? "");
  const [modelOverride, setModelOverride] = useState(channel?.modelOverride ?? "");

  const save = () => {
    const data = { name, description, emoji, personaId, color,
      systemPromptOverride: systemPrompt || undefined,
      modelOverride: modelOverride || undefined };
    if (channel?.id) updateMutation.mutate({ id: channel.id, ...data });
    else createMutation.mutate(data);
  };

  const COLORS = ["#00f5ff","#ffd700","#ff00aa","#00ff88","#ff6600","#8844ff","#ff4444","#00ffcc"];

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">{channel?.id ? "Edit Channel" : "New Channel"}</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
      </div>

      <div className="flex gap-2">
        <Input value={emoji} onChange={e => setEmoji(e.target.value)} className="w-16 bg-slate-800 border-slate-700 text-center text-2xl" />
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Channel name" className="flex-1 bg-slate-800 border-slate-700" />
      </div>

      <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className="bg-slate-800 border-slate-700" />

      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Persona</label>
        <select value={personaId} onChange={e => setPersonaId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white">
          {(personasQuery.data ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Colour</label>
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-white scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">System prompt override (optional)</label>
        <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
          placeholder="Leave blank to use the persona's default prompt…"
          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-white h-24 resize-none" />
      </div>

      <div>
        <label className="text-xs text-slate-400 mb-1.5 block">Model override (optional)</label>
        <Input value={modelOverride} onChange={e => setModelOverride(e.target.value)}
          placeholder="e.g. claude-opus-4-20250514 — leave blank for default"
          className="bg-slate-800 border-slate-700 text-sm font-mono" />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={save} disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
          className="flex-1 bg-cyan-600 hover:bg-cyan-700">
          {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          {channel?.id ? "Save Changes" : "Create Channel"}
        </Button>
        <Button variant="ghost" onClick={onClose} className="text-slate-400">Cancel</Button>
      </div>
    </div>
  );
}

// ─── Main Channels page ────────────────────────────────────────
export default function ChannelsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [userId, setUserId] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Partial<Channel> | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  const channelsQuery = trpc.channel.list.useQuery();
  const presetsQuery  = trpc.channel.presets.useQuery();
  const deleteMutation = trpc.channel.delete.useMutation({ onSuccess: () => { channelsQuery.refetch(); setSelectedChannel(null); } });
  const presetsMutation = trpc.channel.createFromPresets.useMutation({
    onSuccess: () => { channelsQuery.refetch(); setShowPresets(false); setSelectedPresets([]); }
  });

  useEffect(() => { if ((user as any)?.id) setUserId((user as any).id); }, [user]);

  const channels = (channelsQuery.data ?? []) as Channel[];

  return (
    <div className="h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900/50 border-r border-slate-800 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/app")} className="text-slate-500 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="font-bold text-lg">Channels</h1>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setShowPresets(!showPresets)} className="text-slate-400 text-xs">Presets</Button>
              <Button size="sm" onClick={() => { setEditingChannel(null); setShowEditor(true); }} className="bg-cyan-600 hover:bg-cyan-700 h-7 w-7 p-0">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Preset picker */}
          <AnimatePresence>
            {showPresets && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden">
                <p className="text-xs text-slate-400 mb-2">Select presets to add:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto mb-2">
                  {(presetsQuery.data ?? []).map((p: any) => (
                    <label key={p.personaId} className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-800/50">
                      <input type="checkbox" checked={selectedPresets.includes(p.personaId)}
                        onChange={e => setSelectedPresets(prev => e.target.checked ? [...prev, p.personaId] : prev.filter(x => x !== p.personaId))}
                        className="accent-cyan-500" />
                      <span>{p.emoji}</span>
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
                <Button size="sm" onClick={() => presetsMutation.mutate({ presetIds: selectedPresets })}
                  disabled={!selectedPresets.length || presetsMutation.isPending}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-xs">
                  Add {selectedPresets.length} channel{selectedPresets.length !== 1 ? "s" : ""}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Editor panel */}
        <AnimatePresence>
          {showEditor && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="border-b border-slate-800 bg-slate-900/80">
              <ChannelEditor channel={editingChannel ?? undefined}
                onSave={() => channelsQuery.refetch()}
                onClose={() => { setShowEditor(false); setEditingChannel(null); }} />
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {channels.length === 0 && !channelsQuery.isLoading && (
              <p className="text-slate-600 text-xs text-center py-8">No channels yet.<br />Add presets or create one above.</p>
            )}
            {channels.map(ch => (
              <button key={ch.id} onClick={() => setSelectedChannel(ch)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
                  selectedChannel?.id === ch.id ? "bg-slate-800 border" : "hover:bg-slate-800/50 border border-transparent"
                }`} style={selectedChannel?.id === ch.id ? { borderColor: ch.color + "40" } : {}}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: ch.color + "20", border: `1px solid ${ch.color}40` }}>
                  {ch.emoji}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">{ch.name}</p>
                  {ch.lastMessage && <p className="text-xs text-slate-500 truncate">{ch.lastMessage}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); setEditingChannel(ch); setShowEditor(true); }}
                    className="p-1 hover:text-white text-slate-600"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); deleteMutation.mutate({ id: ch.id }); }}
                    className="p-1 hover:text-red-400 text-slate-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* @mention reference */}
        <div className="p-3 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">@Agent Routing</p>
          <div className="space-y-0.5 max-h-32 overflow-y-auto">
            {AGENT_MENTIONS.slice(0,6).map(m => (
              <div key={m.mention} className="flex items-center gap-2 px-1 py-0.5">
                <span className="text-xs font-mono text-cyan-600">{m.mention}</span>
                <span className="text-xs text-slate-600 truncate">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main pane */}
      {selectedChannel && userId ? (
        <ChannelChat channel={selectedChannel} userId={userId} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-5">📡</div>
            <h2 className="text-2xl font-bold text-slate-600 mb-2">Select a Channel</h2>
            <p className="text-slate-600 text-sm max-w-sm">Each channel is an independent agent context with its own persona, system prompt, and message history.</p>
            <p className="text-slate-700 text-xs mt-4">Use <code className="text-cyan-700">@mention</code> inside any channel to route to a specific agent</p>
          </div>
        </div>
      )}
    </div>
  );
}
