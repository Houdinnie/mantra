import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

export const isLocalAuth = () => ENV.authMode === "local";

export const localOwnerOpenId = () => ENV.ownerOpenId || "local-owner";

/** Stand-in owner record, used only when AUTH_MODE=local and no database is configured. */
export function localOwnerUser(openId: string): User {
  const now = new Date();
  return {
    id: 1,
    openId,
    name: ENV.ownerName,
    email: null,
    loginMethod: "local",
    role: "admin",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}
