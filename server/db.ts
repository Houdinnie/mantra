import { eq, desc, asc, sql, like, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatSessions, chatMessages, userMemory, userNotes } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Chat Sessions ──────────────────────────────────────────────────

export async function createChatSession(userId: number, sessionId: string, title?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatSessions).values({ userId, sessionId, title: title || "New Chat", messageCount: 0 });
}

export async function getChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSessions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)).limit(limit);
}

export async function updateSessionMetadata(sessionId: string, title: string, lastMessage: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ title, lastMessage: lastMessage.substring(0, 240), updatedAt: new Date() }).where(eq(chatSessions.sessionId, sessionId));
}

export async function incrementMessageCount(sessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ messageCount: sql`messageCount + 1`, updatedAt: new Date() }).where(eq(chatSessions.sessionId, sessionId));
}

export async function deleteChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId));
  await db.delete(chatSessions).where(eq(chatSessions.sessionId, sessionId));
}

export async function addChatMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(chatMessages).values({ sessionId, role, content });
}

export async function getSessionMessages(sessionId: string, limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(asc(chatMessages.createdAt)).limit(limit);
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalSessions: 0, totalMessages: 0, lastActive: null };

  // Use SQL aggregations to avoid fetching all sessions and reducing in JS
  // This reduces memory usage and network transfer for users with many sessions
  const result = await db
    .select({
      totalSessions: sql<number>`count(${chatSessions.id})`,
      totalMessages: sql<number>`sum(${chatSessions.messageCount})`,
      lastActive: sql<Date | null>`max(${chatSessions.updatedAt})`,
    })
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId));

  const stats = result[0];
  return {
    totalSessions: Number(stats?.totalSessions ?? 0),
    totalMessages: Number(stats?.totalMessages ?? 0),
    lastActive: stats?.lastActive ? new Date(stats.lastActive) : null,
  };
}

// ── Memory ────────────────────────────────────────────────────────

export async function getMemory(userId: number, key: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userMemory).where(and(eq(userMemory.userId, userId), eq(userMemory.key, key))).limit(1);
  return result.length > 0 ? result[0].value : null;
}

export async function setMemory(userId: number, key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(userMemory).values({ userId, key, value }).onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
}

export async function getAllMemory(userId: number): Promise<Array<{ key: string; value: string }>> {
  const db = await getDb();
  if (!db) return [];
  return db.select({ key: userMemory.key, value: userMemory.value }).from(userMemory).where(eq(userMemory.userId, userId));
}

export async function deleteMemory(userId: number, key: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(userMemory).where(and(eq(userMemory.userId, userId), eq(userMemory.key, key)));
}

// ── Notes ─────────────────────────────────────────────────────────

export async function createNote(userId: number, title: string, content: string, tags: string[] = []) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(userNotes).values({ userId, title, content, tags: tags.join(",") });
  return result;
}

export async function getNotes(userId: number, search?: string) {
  const db = await getDb();
  if (!db) return [];
  if (search) {
    return db.select().from(userNotes).where(and(eq(userNotes.userId, userId), like(userNotes.title, `%${search}%`))).orderBy(desc(userNotes.updatedAt)).limit(50);
  }
  return db.select().from(userNotes).where(eq(userNotes.userId, userId)).orderBy(desc(userNotes.updatedAt)).limit(50);
}

export async function updateNote(noteId: number, userId: number, updates: { title?: string; content?: string; tags?: string[]; pinned?: boolean }) {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = {};
  if (updates.title) set.title = updates.title;
  if (updates.content) set.content = updates.content;
  if (updates.tags) set.tags = updates.tags.join(",");
  if (updates.pinned !== undefined) set.pinned = updates.pinned;
  await db.update(userNotes).set(set).where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)));
}

export async function deleteNote(noteId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(userNotes).where(and(eq(userNotes.id, noteId), eq(userNotes.userId, userId)));
}

// ── Sandbox Sessions ──────────────────────────────────────────

import { sandboxSessions } from "../drizzle/schema";

export async function createSandboxSession(data: {
  userId: number;
  sessionId: string;
  sandboxId: string;
  containerId?: string;
  mode: string;
  workdir: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(sandboxSessions).values({
    userId: data.userId,
    sessionId: data.sessionId,
    sandboxId: data.sandboxId,
    containerId: data.containerId,
    mode: data.mode,
    status: "running",
    workdir: data.workdir,
    taskCount: 0,
  });
}

export async function getSandboxSession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sandboxSessions)
    .where(eq(sandboxSessions.sessionId, sessionId)).limit(1);
  return result[0] ?? undefined;
}

export async function getUserSandboxes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sandboxSessions)
    .where(eq(sandboxSessions.userId, userId))
    .orderBy(desc(sandboxSessions.lastActiveAt))
    .limit(20);
}

export async function updateSandboxStatus(
  sandboxId: string,
  status: "running" | "stopped" | "error",
  lastTask?: string
) {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = { status, lastActiveAt: new Date() };
  if (lastTask) { set.lastTask = lastTask; set.taskCount = sql`taskCount + 1`; }
  await db.update(sandboxSessions).set(set)
    .where(eq(sandboxSessions.sandboxId, sandboxId));
}

// ── Agent Channels ────────────────────────────────────────────

import { agentChannels } from "../drizzle/schema";

export async function createChannel(data: {
  userId: number;
  name: string;
  description?: string;
  emoji?: string;
  personaId?: string;
  systemPromptOverride?: string;
  modelOverride?: string;
  color?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(agentChannels).values({
    userId: data.userId,
    name: data.name,
    description: data.description,
    emoji: data.emoji ?? "💬",
    personaId: data.personaId ?? "default",
    systemPromptOverride: data.systemPromptOverride,
    modelOverride: data.modelOverride,
    color: data.color ?? "#00f5ff",
    messageCount: 0,
    pinned: false,
  });
}

export async function getUserChannels(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentChannels)
    .where(eq(agentChannels.userId, userId))
    .orderBy(desc(agentChannels.updatedAt));
}

export async function getChannel(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agentChannels)
    .where(and(eq(agentChannels.id, id), eq(agentChannels.userId, userId))).limit(1);
  return result[0];
}

export async function updateChannel(id: number, userId: number, updates: {
  name?: string; description?: string; emoji?: string;
  personaId?: string; systemPromptOverride?: string;
  modelOverride?: string; color?: string; pinned?: boolean;
  lastMessage?: string;
}) {
  const db = await getDb();
  if (!db) return;
  const set: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(updates)) if (v !== undefined) set[k] = v;
  if (updates.lastMessage !== undefined) set.messageCount = sql`messageCount + 1`;
  await db.update(agentChannels).set(set)
    .where(and(eq(agentChannels.id, id), eq(agentChannels.userId, userId)));
}

export async function deleteChannel(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(agentChannels)
    .where(and(eq(agentChannels.id, id), eq(agentChannels.userId, userId)));
}
