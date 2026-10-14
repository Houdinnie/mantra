import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

/** Local sign-in is on only when AUTH_MODE=local AND NODE_ENV=development. Anything else fails closed. */
export const localAuthEnabled = () =>
  ENV.authMode === "local" && process.env.NODE_ENV === "development";

export const isLocalAuth = localAuthEnabled;

export const LOCAL_SESSION_MS = 12 * 60 * 60 * 1000;

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** True only for a direct loopback connection to a loopback host name, not proxied and not cross-site. */
export function isLoopbackRequest(req: {
  socket: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}): boolean {
  if (!LOOPBACK.has(req.socket.remoteAddress ?? "")) return false;
  if (req.headers["x-forwarded-for"] || req.headers["forwarded"]) return false;
  const host = String(req.headers.host ?? "").replace(/:\d+$/, "").toLowerCase();
  if (!LOOPBACK_HOSTS.has(host)) return false;
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  return true;
}

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
