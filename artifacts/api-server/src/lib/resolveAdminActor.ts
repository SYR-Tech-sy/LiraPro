import type { Request } from "express";
import { verifySupabaseToken } from "./supabase-admin.js";

/**
 * Resolves the acting admin's identity by verifying the Supabase JWT
 * from the Authorization header server-side. Falls back to "admin" if
 * no valid token is present, so override history always has some label.
 */
export async function resolveAdminActor(req: Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return "admin";
  const token = authHeader.slice(7);
  try {
    const user = await verifySupabaseToken(token);
    if (!user) return "admin";
    return user.email ?? user.id ?? "admin";
  } catch {
    return "admin";
  }
}
