/**
 * Mantra Collaboration Server
 *
 * WebSocket-based real-time collaboration:
 *   - Shared chat sessions — multiple users see messages as they stream
 *   - Presence — who is in the room right now
 *   - Cursor / typing indicators
 *   - Sandbox terminal sharing — observers watch live execution
 *
 * Protocol (JSON over WS):
 *   Client → Server:
 *     { type: "join", sessionId, userId, userName }
 *     { type: "leave", sessionId, userId }
 *     { type: "typing", sessionId, userId, isTyping }
 *     { type: "cursor", sessionId, userId, position }
 *
 *   Server → Client (broadcast to room):
 *     { type: "presence", users: [...] }
 *     { type: "message", role, content, persona, skill }
 *     { type: "delta", text, messageIndex }
 *     { type: "typing", userId, userName, isTyping }
 *     { type: "sandbox_event", event }
 *     { type: "joined", userId, userName }
 *     { type: "left", userId, userName }
 */

import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type CollabUser = {
  userId: number;
  userName: string;
  ws: WebSocket;
  joinedAt: number;
  isTyping: boolean;
};

type Room = {
  sessionId: string;
  users: Map<number, CollabUser>;
};

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();

function getOrCreateRoom(sessionId: string): Room {
  if (!rooms.has(sessionId)) {
    rooms.set(sessionId, { sessionId, users: new Map() });
  }
  return rooms.get(sessionId)!;
}

function broadcast(room: Room, data: object, excludeUserId?: number) {
  const msg = JSON.stringify(data);
  for (const [userId, user] of room.users) {
    if (excludeUserId !== undefined && userId === excludeUserId) continue;
    if (user.ws.readyState === WebSocket.OPEN) {
      user.ws.send(msg);
    }
  }
}

function broadcastAll(room: Room, data: object) {
  broadcast(room, data, undefined);
}

function presencePayload(room: Room) {
  return {
    type: "presence",
    users: Array.from(room.users.values()).map(u => ({
      userId: u.userId,
      userName: u.userName,
      joinedAt: u.joinedAt,
      isTyping: u.isTyping,
    })),
  };
}

// ─────────────────────────────────────────────────────────────
// Broadcast helpers — called from other parts of the server
// ─────────────────────────────────────────────────────────────

/**
 * Broadcast a new/updated message to all collaborators in a session.
 * Called from the chat SSE handler when a message arrives.
 */
export function broadcastMessage(
  sessionId: string,
  payload: {
    role: "user" | "assistant";
    content: string;
    persona?: string;
    personaEmoji?: string;
    skill?: string | null;
  }
) {
  const room = rooms.get(sessionId);
  if (!room) return;
  broadcastAll(room, { type: "message", ...payload });
}

/**
 * Broadcast a streaming delta to all collaborators.
 * Called on each SSE chunk so observers see live typing.
 */
export function broadcastDelta(
  sessionId: string,
  text: string,
  messageIndex: number
) {
  const room = rooms.get(sessionId);
  if (!room) return;
  broadcastAll(room, { type: "delta", text, messageIndex });
}

/**
 * Broadcast a sandbox agent event to all collaborators watching.
 */
export function broadcastSandboxEvent(sessionId: string, event: object) {
  const room = rooms.get(sessionId);
  if (!room) return;
  broadcastAll(room, { type: "sandbox_event", event });
}

// ─────────────────────────────────────────────────────────────
// WebSocket server setup
// ─────────────────────────────────────────────────────────────

export function setupCollabServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/collab" });

  wss.on("connection", (ws: WebSocket, req) => {
    let currentRoom: Room | null = null;
    let currentUserId: number | null = null;

    ws.on("message", raw => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "join": {
          const sessionId = msg.sessionId as string;
          const userId = msg.userId as number;
          const userName = (msg.userName as string) || `User ${userId}`;

          const room = getOrCreateRoom(sessionId);
          currentRoom = room;
          currentUserId = userId;

          // Remove any stale entry for this user
          room.users.delete(userId);
          room.users.set(userId, {
            userId,
            userName,
            ws,
            joinedAt: Date.now(),
            isTyping: false,
          });

          // Tell everyone else
          broadcast(room, { type: "joined", userId, userName }, userId);

          // Send presence to the joiner
          ws.send(JSON.stringify(presencePayload(room)));

          // Broadcast updated presence to all
          broadcastAll(room, presencePayload(room));
          break;
        }

        case "leave": {
          if (!currentRoom || !currentUserId) break;
          const user = currentRoom.users.get(currentUserId);
          currentRoom.users.delete(currentUserId);
          broadcast(currentRoom, {
            type: "left",
            userId: currentUserId,
            userName: user?.userName,
          });
          broadcastAll(currentRoom, presencePayload(currentRoom));
          if (currentRoom.users.size === 0) rooms.delete(currentRoom.sessionId);
          currentRoom = null;
          currentUserId = null;
          break;
        }

        case "typing": {
          if (!currentRoom || !currentUserId) break;
          const user = currentRoom.users.get(currentUserId);
          if (user) user.isTyping = !!msg.isTyping;
          broadcast(
            currentRoom,
            {
              type: "typing",
              userId: currentUserId,
              userName: user?.userName,
              isTyping: !!msg.isTyping,
            },
            currentUserId
          );
          break;
        }

        case "ping": {
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        }
      }
    });

    ws.on("close", () => {
      if (!currentRoom || !currentUserId) return;
      const user = currentRoom.users.get(currentUserId);
      currentRoom.users.delete(currentUserId);
      broadcast(currentRoom, {
        type: "left",
        userId: currentUserId,
        userName: user?.userName,
      });
      broadcastAll(currentRoom, presencePayload(currentRoom));
      if (currentRoom.users.size === 0) rooms.delete(currentRoom.sessionId);
    });

    ws.on("error", () => {
      // Handled by close
    });
  });

  // Cleanup empty rooms every 5 minutes
  setInterval(
    () => {
      for (const [id, room] of rooms) {
        if (room.users.size === 0) rooms.delete(id);
      }
    },
    5 * 60 * 1000
  );

  console.log("[Collab] WebSocket server ready at /ws/collab");
  return wss;
}

// ─────────────────────────────────────────────────────────────
// Room info — for tRPC to query active collaborators
// ─────────────────────────────────────────────────────────────

export function getRoomPresence(sessionId: string) {
  const room = rooms.get(sessionId);
  if (!room) return [];
  return Array.from(room.users.values()).map(u => ({
    userId: u.userId,
    userName: u.userName,
    joinedAt: u.joinedAt,
    isTyping: u.isTyping,
  }));
}

export function getActiveRooms() {
  return Array.from(rooms.values()).map(r => ({
    sessionId: r.sessionId,
    userCount: r.users.size,
    users: Array.from(r.users.values()).map(u => ({
      userId: u.userId,
      userName: u.userName,
    })),
  }));
}
