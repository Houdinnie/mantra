import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MessageSquare, Clock, Zap, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const getSessionsQuery = trpc.chat.getSessions.useQuery({ limit: 100 });



  const sessions = getSessionsQuery.data || [];
  const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount || 0), 0);
  const totalSessions = sessions.length;
  const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-slate-400 mt-2">Your Mantra activity and statistics</p>
          </div>
          <Button
            onClick={() => navigate("/app")}
            className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          >
            <MessageSquare className="w-4 h-4 mr-2" /> New Chat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Total Chats</h3>
              <MessageSquare className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-3xl font-bold">{totalSessions}</p>
            <p className="text-xs text-slate-500 mt-2">Active conversations</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Total Messages</h3>
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{totalMessages}</p>
            <p className="text-xs text-slate-500 mt-2">Across all sessions</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Avg Messages</h3>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{avgMessagesPerSession}</p>
            <p className="text-xs text-slate-500 mt-2">Per conversation</p>
          </div>

          <div className="p-6 bg-slate-800/30 border border-slate-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-400">Last Active</h3>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold">
              {sessions.length > 0 && sessions[0]?.updatedAt
                ? new Date(sessions[0].updatedAt).toLocaleDateString()
                : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-2">Most recent chat</p>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700 bg-slate-900/50">
            <h2 className="text-lg font-semibold">Recent Conversations</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No conversations yet</p>
              <Button
                onClick={() => navigate("/app")}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
              >
                Start Your First Chat
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-96">
              <div className="divide-y divide-slate-700">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="px-6 py-4 hover:bg-slate-700/20 transition-colors cursor-pointer"
                    onClick={() => navigate("/app")}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{session.title}</h3>
                        {session.lastMessage && (
                          <p className="text-sm text-slate-400 truncate mt-1">{session.lastMessage}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>{session.messageCount || 0} messages</span>
                          <span>
                            {session.updatedAt
                              ? new Date(session.updatedAt).toLocaleDateString()
                              : "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="inline-block px-3 py-1 bg-cyan-600/20 border border-cyan-500/50 rounded-full text-xs font-medium text-cyan-400">
                          {session.messageCount || 0} msgs
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}
