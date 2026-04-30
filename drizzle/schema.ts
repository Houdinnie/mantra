import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, index, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const chatSessions = mysqlTable("chat_sessions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  lastMessage: text("lastMessage"),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  updatedAtIdx: index("idx_updated_at").on(table.updatedAt),
  userIdIdx: index("idx_user_id").on(table.userId),
}));

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

export const chatMessages = mysqlTable("chat_messages", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("idx_session_id").on(table.sessionId),
  createdAtIdx: index("idx_created_at").on(table.createdAt),
}));

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/** Memory — persistent key-value facts per user */
export const userMemory = mysqlTable("user_memory", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  key: varchar("key", { length: 255 }).notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userKeyIdx: index("idx_user_key").on(table.userId, table.key),
}));

export type UserMemory = typeof userMemory.$inferSelect;

/** Notes — markdown notes with tags */
export const userNotes = mysqlTable("user_notes", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: varchar("tags", { length: 512 }).default(""),
  pinned: boolean("pinned").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_notes_user_id").on(table.userId),
}));

export type UserNote = typeof userNotes.$inferSelect;

/** Sandbox sessions — Docker containers per chat session */
export const sandboxSessions = mysqlTable("sandbox_sessions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  sandboxId: varchar("sandboxId", { length: 128 }).notNull().unique(),
  containerId: varchar("containerId", { length: 128 }),
  mode: varchar("mode", { length: 16 }).default("docker").notNull(),
  status: mysqlEnum("status", ["running", "stopped", "error"]).default("running").notNull(),
  workdir: varchar("workdir", { length: 512 }).notNull(),
  taskCount: int("taskCount").default(0).notNull(),
  lastTask: text("lastTask"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("idx_sandbox_user_id").on(table.userId),
  sessionIdIdx: index("idx_sandbox_session_id").on(table.sessionId),
}));

export type SandboxSession = typeof sandboxSessions.$inferSelect;
export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.sessionId],
  }),
}));
