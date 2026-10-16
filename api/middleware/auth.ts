import { randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export type AuthUser = { id: string; name: string; email: string; emailVerified: boolean; role: "ADMIN" | "STAFF" | "CUSTOMER"; staffType: "ORDER_MANAGER" | "PRODUCT_MANAGER" | null; allowedCategories: unknown };
declare global { namespace Express { interface Request { user?: AuthUser; sessionToken?: string; } } }

export const SESSION_COOKIE = "epic_session";
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const makeSessionToken = () => randomBytes(32).toString("hex");

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

/**
 * Resolve the session token for a request. The httpOnly cookie is the primary
 * (and XSS-safe) source; the Authorization header stays supported for API
 * clients and tooling.
 */
export function readSessionToken(req: Request): string | undefined {
  const cookie = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (cookie) return cookie;
  const header = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header || undefined;
}

/** Set the session as an httpOnly cookie. `secure` follows the real protocol. */
export function setSessionCookie(req: Request, res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  });
}

export function clearSessionCookie(req: Request, res: Response): void {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", secure: req.secure, path: "/" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readSessionToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session || session.expiresAt <= new Date()) return res.status(401).json({ error: "Session expired" });
  req.user = { id: session.user.id, name: session.user.name, email: session.user.email, emailVerified: session.user.emailVerified, role: session.user.role, staffType: session.user.staffType, allowedCategories: session.user.allowedCategories };
  req.sessionToken = token;
  next();
}
export function requireRole(...roles: AuthUser["role"][]) { return (req: Request, res: Response, next: NextFunction) => !req.user || !roles.includes(req.user.role) ? res.status(403).json({ error: "Insufficient permissions" }) : next(); }
