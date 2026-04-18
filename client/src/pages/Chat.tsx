import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, Trash2, Menu } from "lucide-react";
import { Streamdown } from "streamdown";
import NeuralNetwork from "@/components/NeuralNetwork";
import { useLocation } from "wouter";

const THINKING_STEPS = [
  "Parsing your request...",
  "Analyzing intent...",
  "Decomposing into steps...",
  "Consulting knowledge base...",
  "Formulating response...",
];

export default function Chat() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const createSessionMutation = trpc.chat.createSession.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const getMessagesQuery = trpc.chat.getMessages.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
  const getSessionsQuery = trpc.chat.getSessions.useQuery({ limit: 50 });
  const deleteSessionMutation = trpc.chat.deleteSession.useMutation();

  useEffect(() => {
    if (!sessionId) {
      createSessionMutation.mutate(undefined, {
        onSuccess: (data) => {
          setSessionId(data.sessionId);
        },
      });
    }
  }, [sessionId]);

  useEffect(() => {
    if (getMessagesQuery.data) {
      setMessages(getMessagesQuery.data);
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

  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setThinkingStep(0);

    try {
      const response = await sendMessageMutation.mutateAsync({
        sessionId,
        message: userMessage,
      });

      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setInput("");
    createSessionMutation.mutate(undefined, {
      onSuccess: (data) => {
        setSessionId(data.sessionId);
      },
    });
  };

  const handleDeleteSession = (id: string) => {
    deleteSessionMutation.mutate(
      { sessionId: id },
      {
        onSuccess: () => {
          getSessionsQuery.refetch();
          if (sessionId === id) {
            handleNewChat();
          }
        },
      }
    );
  };



  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex">
      <div className={`${sidebarOpen ? "w-64" : "w-0"} bg-slate-900/50 border-r border-slate-800 transition-all duration-300 flex flex-col overflow-hidden`}>
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
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Mantra</h1>
              <p className="text-xs text-slate-400">AI Agent Platform</p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            {user?.name && <span>{user.name}</span>}
          </div>
        </div>

        <ScrollArea ref={scrollRef} className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <h2 className="text-3xl font-bold mb-4">Welcome to Mantra</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  Start by describing a goal or problem. I will break it down into actionable steps.
                </p>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xl px-4 py-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-cyan-600/20 border border-cyan-500/50 text-white"
                      : "bg-slate-800/50 border border-slate-700 text-slate-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="w-64 h-32 bg-slate-800/30 border border-slate-700 rounded-lg p-4 flex flex-col items-center justify-center">
                  <NeuralNetwork isActive={true} compact={true} />
                  <p className="text-xs text-slate-400 mt-2 text-center">{THINKING_STEPS[thinkingStep]}</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-slate-800 bg-slate-900/50 px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Describe your goal or ask a question..."
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
  );
}
