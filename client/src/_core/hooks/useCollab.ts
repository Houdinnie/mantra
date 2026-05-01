/**
 * useCollab — React hook for real-time collaboration
 *
 * Connects to /ws/collab, joins a session room, and exposes:
 *   - users: who is currently in the session
 *   - typingUsers: who is currently typing
 *   - sendTyping(isTyping): broadcast typing state
 *   - onMessage: callback when a collaborator sends a message
 *   - onDelta: callback for live message streaming from collaborators
 */

import { useEffect, useRef, useState, useCallback } from "react";

export type CollabUser = {
  userId: number;
  userName: string;
  joinedAt: number;
  isTyping: boolean;
};

type CollabMessage = {
  role: "user" | "assistant";
  content: string;
  persona?: string;
  personaEmoji?: string;
  skill?: string | null;
};

type UseCollabOptions = {
  sessionId: string;
  userId: number;
  userName: string;
  onMessage?: (msg: CollabMessage) => void;
  onDelta?: (text: string, index: number) => void;
  onSandboxEvent?: (event: object) => void;
};

export function useCollab({
  sessionId,
  userId,
  userName,
  onMessage,
  onDelta,
  onSandboxEvent,
}: UseCollabOptions) {
  const [users, setUsers] = useState<CollabUser[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendTyping = useCallback((isTyping: boolean) => {
    wsRef.current?.send(JSON.stringify({ type: "typing", sessionId, userId, isTyping }));
  }, [sessionId, userId]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/collab`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join", sessionId, userId, userName }));
      // Keepalive ping every 25s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25_000);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data) as Record<string, unknown>;
        switch (msg.type) {
          case "presence":
            setUsers((msg.users as CollabUser[]) ?? []);
            break;
          case "joined":
          case "left":
            // presence broadcast follows immediately
            break;
          case "typing":
            setUsers(prev => prev.map(u =>
              u.userId === (msg.userId as number)
                ? { ...u, isTyping: msg.isTyping as boolean }
                : u
            ));
            break;
          case "message":
            onMessage?.(msg as unknown as CollabMessage);
            break;
          case "delta":
            onDelta?.(msg.text as string, msg.messageIndex as number);
            break;
          case "sandbox_event":
            onSandboxEvent?.(msg.event as object);
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      setUsers([]);
      if (pingRef.current) clearInterval(pingRef.current);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    return () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave", sessionId, userId }));
        ws.close();
      }
    };
  }, [sessionId, userId, userName]);

  const typingUsers = users.filter(u => u.userId !== userId && u.isTyping);
  const otherUsers  = users.filter(u => u.userId !== userId);

  return { users, otherUsers, typingUsers, connected, sendTyping };
}
