import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, Trash2, Menu, Zap, Brain, FileText, LayoutDashboard, Bot, Terminal, Hash } from "lucide-react";
import { StreamingMath } from "@/components/MathRenderer";
import NeuralNetwork from "@/components/NeuralNetwork";
import { useLocation } from "wouter";
import { useCollab } from "@/_core/hooks/useCollab";

function PresenceBar({ users }: { users: Array<{ userId: number; userName: string; isTyping: boolean }> }) {
  if (!users.length) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full">
      {users.slice(0, 5).map(u => (
        <div key={u.userId} className="relative" title={u.userName}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
            {u.userName[0]?.toUpperCase() ?? "?"}
          </div>
          {u.isTyping && <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
        </div>
      ))}
      {users.length > 5 && <span className="text-xs text-slate-400">+{users.length - 5}</span>}
    </div>
  );
}

const THINKING_STEPS = [
  "Parsing your request...",
  "Routing to specialist agent...",
  "Analysing context...",
  "Consulting knowledge base...",
  "Formulating response...",
];

const SKILL_COMMANDS = [
  { cmd: "/task",          label: "Dispatch Task 🦞" },
  { cmd: "/deepread",      label: "DeepRead URL 📥" },
  { cmd: "/sandbox",       label: "Open Sandbox 🖥️" },
  { cmd: "/milliondollaridea", label: "Million Dollar Idea 🥇" },
  { cmd: "/board", label: "Board Session" },
  { cmd: "/brain", label: "Brain Status 🧠" },
  { cmd: "/recall", label: "Brain Recall 🧠" },
  { cmd: "/find-community", label: "Find Community" },
  { cmd: "/validate-idea", label: "Validate Idea" },
  { cmd: "/processize", label: "Processize" },
  { cmd: "/mvp", label: "MVP Builder" },
  { cmd: "/first-customers", label: "First Customers" },
  { cmd: "/pricing", label: "Pricing" },
  { cmd: "/minimalist-review", label: "Minimalist Review" },
  { cmd: "/grow-sustainably", label: "Grow Sustainably" },
  { cmd: "/company-values", label: "Company Values" },
  { cmd: "/marketing-plan", label: "Marketing Plan" },
  { cmd: "/marketing", label: "Franklin: Marketing" },
  { cmd: "/trading", label: "Franklin: Trading" },
  { cmd: "/content", label: "Franklin: Content" },
  { cmd: "/search", label: "Web Search" },
  { cmd: "/digest", label: "Morning Digest" },
];

type Message = {
  role: "user" | "assistant";
  content: string;
  persona?: string;
  personaEmoji?: string;
  skill?: string | null;
  tier?: string | null;
};

type RoutingMeta = {
  persona: string;
  personaEmoji: string;
  skill: string | null;
  tier: string | null;
};

export default function Chat() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [showSkills, setShowSkills] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  const AGENT_MENTIONS_CHAT = [
    { mention: "@ideator",    label: "💡 Ideator",           desc: "Startup & validation" },
    { mention: "@tax",        label: "💰 Tax Strategist",    desc: "NHR, UAE, Singapore" },
    { mention: "@legal",      label: "⚖️ Entity Lawyer",     desc: "LLC, corp, structure" },
    { mention: "@compliance", label: "🔐 Compliance",        desc: "GDPR, SOC2, KYC" },
    { mention: "@nomad",      label: "🗺️ Nomad Navigator",   desc: "Visa, relocation" },
    { mention: "@luxury",     label: "✈️ Luxury Concierge",  desc: "Travel, hotels" },
    { mention: "@wellness",   label: "🏥 Wellness Director", desc: "Health, longevity" },
    { mention: "@wealth",     label: "📈 Wealth Architect",  desc: "Portfolio, banking" },
    { mention: "@ceo",        label: "👑 CEO",               desc: "Strategy & vision" },
    { mention: "@cfo",        label: "💹 CFO",               desc: "Finance & unit economics" },
    { mention: "@cto",        label: "⚙️ CTO",               desc: "Architecture & engineering" },
    { mention: "@cmo",        label: "📣 CMO",               desc: "Marketing & growth" },
  ];

  const atMatch = input.match(/@(\w*)$/);
  const mentionQuery = atMatch ? atMatch[1].toLowerCase() : "";
  const filteredMentions = showMentions && atMatch
    ? AGENT_MENTIONS_CHAT.filter(m => m.mention.slice(1).startsWith(mentionQuery))
    : [];

  const insertMentionChat = (mention: string) => {
    setInput(prev => prev.replace(/@\w*$/, mention + " "));
    setShowMentions(false);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const createSessionMutation = trpc.chat.createSession.useMutation();
  const getMessagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
  const getSessionsQuery = trpc.chat.getSessions.useQuery({ limit: 50 });
  const deleteSessionMutation = trpc.chat.deleteSession.useMutation();

  // Collab — join the session room when sessionId and userId are ready
  const { otherUsers, typingUsers, sendTyping } = useCollab({
    sessionId: sessionId ?? "lobby",
    userId: userId ?? 0,
    userName: (user as any)?.name ?? "User",
    onMessage: (msg) => {
      // A collaborator sent a message — append it
      if (msg.role === "user") {
        setMessages(prev => [...prev, { role: "user", content: msg.content }]);
      }
    },
    onDelta: (text, index) => {
      // A collaborator's response is streaming — update that message
      setMessages(prev => {
        const updated = [...prev];
        if (updated[index]) updated[index] = { ...updated[index], content: (updated[index].content ?? "") + text };
        return updated;
      });
    },
  });

  // Capture userId from auth
  useEffect(() => {
    if ((user as any)?.id) setUserId((user as any).id);
  }, [user]);

  useEffect(() => {
    if (!sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (data) => {
          setSessionId(data.sessionId);
          if (data.userId) setUserId(data.userId);
        },
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(
        getMessagesQuery.data.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [getMessagesQuery.data]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % THINKING_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || !userId || isLoading) return;

    const userMessage = input;
    setInput("");
    setShowSkills(false);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setThinkingStep(0);

    // Placeholder for the streaming assistant message
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();
    let routingMeta: RoutingMeta | null = null;
    let accumulated = "";

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: userMessage, userId }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw) as {
              type: string;
              text?: string;
              persona?: string;
              personaEmoji?: string;
              skill?: string | null;
              tier?: string | null;
              message?: string;
            };

            if (event.type === "routing") {
              routingMeta = {
                persona: event.persona ?? "Mantra",
                personaEmoji: event.personaEmoji ?? "🤖",
                skill: event.skill ?? null,
                tier: event.tier ?? null,
              };
              // Attach routing meta to the placeholder message
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  ...updated[assistantIndex],
                  persona: routingMeta!.persona,
                  personaEmoji: routingMeta!.personaEmoji,
                  skill: routingMeta!.skill,
                  tier: routingMeta!.tier,
                };
                return updated;
              });
            } else if (event.type === "redirect") {
              if (event.task) sessionStorage.setItem("mantra_sandbox_task", event.task as string);
              setTimeout(() => navigate(event.url as string), 1200);
            } else if (event.type === "delta" && event.text) {
              accumulated += event.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIndex] = {
                  ...updated[assistantIndex],
                  content: accumulated,
                };
                return updated;
              });
            } else if (event.type === "error") {
              throw new Error(event.message ?? "Stream error");
            }
          } catch (parseErr) {
            // ignore parse errors on individual SSE lines
          }
        }
      }

      getSessionsQuery.refetch();
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      console.error("Stream error:", error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[assistantIndex] = {
          ...updated[assistantIndex],
          content: "I encountered an error. Please try again.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, sessionId, userId, isLoading, messages.length]);

  const handleNewChat = () => {
    abortRef.current?.abort();
    setSessionId(null);
    setMessages([]);
    setInput("");
    createSessionMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
        if (data.userId) setUserId(data.userId);
      },
    });
  };

  const handleDeleteSession = (id: string) => {
    deleteSessionMutation.mutate(
      { sessionId: id },
      {
        onSuccess: () => {
          getSessionsQuery.refetch();
          if (sessionId === id) handleNewChat();
        },
      }
    );
  };

  const insertSkillCommand = (cmd: string) => {
    setInput(cmd + " ");
    setShowSkills(false);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64 md:w-64" : "w-0"
        } bg-slate-900/50 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden flex-shrink-0
        ${sidebarOpen ? "fixed md:relative z-40 h-full" : "relative"}`}
      >
        <div className="p-4 border-b border-slate-800">
          <Button
            onClick={handleNewChat}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {getSessionsQuery.data?.map((session) => (
              <div
                key={session.sessionId}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  sessionId === session.sessionId
                    ? "bg-cyan-600/20 border border-cyan-500/50"
                    : "bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700"
                }`}
                onClick={() => setSessionId(session.sessionId)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    {session.lastMessage && (
                      <p className="text-xs text-slate-400 truncate mt-1">{session.lastMessage}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(session.sessionId);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Nav links */}
        <div className="p-2 border-t border-slate-800 grid grid-cols-6 gap-0.5">
          {[
            { icon: <LayoutDashboard className="w-3.5 h-3.5" />, label: "Dash",     path: "/dashboard", color: "" },
            { icon: <Hash            className="w-3.5 h-3.5" />, label: "Channels", path: "/channels",  color: "hover:text-cyan-300" },
            { icon: <FileText        className="w-3.5 h-3.5" />, label: "Notes",    path: "/notes",     color: "" },
            { icon: <Zap             className="w-3.5 h-3.5" />, label: "Tasks",    path: "/tasks",     color: "hover:text-cyan-400" },
            { icon: <Terminal        className="w-3.5 h-3.5" />, label: "Box",      path: "/sandbox",   color: "hover:text-green-400" },
            { icon: <Brain           className="w-3.5 h-3.5" />, label: "Brain",    path: "/brain",     color: "hover:text-violet-400" },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 ${item.color}`}>
              {item.icon}
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Skills panel in sidebar */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Slash Commands</p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {SKILL_COMMANDS.map((s) => (
              <button
                key={s.cmd}
                onClick={() => insertSkillCommand(s.cmd)}
                className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-cyan-600/20 hover:text-cyan-300 transition-colors font-mono"
              >
                {s.cmd}
                <span className="text-slate-500 font-sans ml-1">— {s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Mantra</h1>
              <p className="text-xs text-cyan-400">Powered by Claude · Agent Router Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {otherUsers.length > 0 && <PresenceBar users={otherUsers} />}
            {typingUsers.length > 0 && <span className="text-xs text-slate-400 animate-pulse">{typingUsers.map(u => u.userName).join(", ")} typing...</span>}
            <div className="text-sm text-slate-400">{user?.name}</div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <h2 className="text-3xl font-bold mb-4">Welcome to Mantra</h2>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Describe a goal, or use a slash command to activate a specialist agent.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg mx-auto">
                  {SKILL_COMMANDS.slice(0, 6).map((s) => (
                    <button
                      key={s.cmd}
                      onClick={() => insertSkillCommand(s.cmd)}
                      className="px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-600/10 transition-colors text-left"
                    >
                      <p className="text-xs font-mono text-cyan-400">{s.cmd}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xl w-full px-4 py-3 rounded-xl ${
                    msg.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-500/50 text-white"
                      : "bg-slate-800/50 border border-slate-700 text-slate-100"
                  }`}
                >
                  {/* Persona + skill badges on assistant messages */}
                  {msg.role === "assistant" && msg.persona && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600 text-xs text-slate-300">
                        {msg.personaEmoji} {msg.persona}
                      </span>
                      {msg.skill && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                            msg.tier === "high"
                              ? "bg-red-900/30 border-red-500/40 text-red-300"
                              : msg.tier === "medium"
                              ? "bg-amber-900/30 border-amber-500/40 text-amber-300"
                              : "bg-slate-700/50 border-slate-600 text-slate-400"
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          {msg.skill}
                        </span>
                      )}
                    </div>
                  )}

                  {msg.role === "assistant" ? (
                    msg.content ? (
                      <StreamingMath>{msg.content}</StreamingMath>
                    ) : (
                      <span className="text-slate-500 text-sm italic">Thinking…</span>
                    )
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="w-64 h-32 bg-slate-800/30 border border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center">
                  <NeuralNetwork isActive={true} compact={true} />
                  <p className="text-xs text-slate-400 mt-2 text-center">{THINKING_STEPS[thinkingStep]}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            {/* @mention autocomplete */}
            {filteredMentions.length > 0 && (
              <div className="mb-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                {filteredMentions.map((m) => (
                  <button key={m.mention} onClick={() => insertMentionChat(m.mention)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center gap-3">
                    <span className="text-violet-400 font-mono text-sm font-bold">{m.mention}</span>
                    <span className="text-white text-sm">{m.label}</span>
                    <span className="text-slate-500 text-xs ml-auto">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Skill command autocomplete */}
            {showSkills && input.startsWith("/") && (
              <div className="mb-2 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                {SKILL_COMMANDS.filter((s) =>
                  s.cmd.startsWith(input.split(" ")[0].toLowerCase())
                ).map((s) => (
                  <button
                    key={s.cmd}
                    onClick={() => insertSkillCommand(s.cmd)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-700 transition-colors flex items-center gap-3"
                  >
                    <span className="text-cyan-400 font-mono text-sm">{s.cmd}</span>
                    <span className="text-slate-400 text-sm">{s.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setShowSkills(e.target.value.startsWith("/"));
                  setShowMentions(e.target.value.includes("@"));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  if (e.key === "Escape") { setShowSkills(false); setShowMentions(false); }
                }}
                placeholder="Describe your goal, type / for skills, or @ to route to an agent…"
                disabled={isLoading}
                className="bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-6"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
