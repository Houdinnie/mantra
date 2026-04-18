CREATE INDEX `idx_session_id` ON `chat_messages` (`sessionId`);--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `chat_messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_updated_at` ON `chat_sessions` (`updatedAt`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `chat_sessions` (`userId`);