import type { Request, Response, NextFunction } from "express";
import { verifySupabaseToken } from "../lib/supabase-admin.js";
import { trackSession } from "../services/sessionService.js";

declare module "express" {
  interface Request {
    supabaseUserId?: string;
    supabaseUserEmail?: string;
  }
}

export async function requireSupabaseAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const user = await verifySupabaseToken(token);
  if (!user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.supabaseUserId = user.id;
  req.supabaseUserEmail = user.email ?? "";

  // Fire-and-forget: track session in DB (non-blocking)
  const ip =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")[0]
      ?.trim() ||
    req.socket?.remoteAddress ||
    "";
  const ua = req.headers["user-agent"] ?? "";
  // Prefer client-supplied stable device ID for true per-device sessions
  const deviceId = req.headers["x-device-id"] as string | undefined;
  void trackSession(user.id, ip, ua, deviceId ?? ua);

  next();
}
