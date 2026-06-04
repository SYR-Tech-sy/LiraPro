import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SESSIONS_FILE = join(__dir, "../sessions.json");

export interface SessionInfo {
  userId: string;
  ip: string;
  userAgent: string;
  deviceName: string;
  lastSeenAt: string;
}

function readSessions(): Record<string, SessionInfo> {
  try {
    if (!existsSync(SESSIONS_FILE)) return {};
    return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8")) as Record<string, SessionInfo>;
  } catch { return {}; }
}

function saveSessions(data: Record<string, SessionInfo>): void {
  try {
    writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

function parseDeviceName(ua: string): string {
  if (!ua) return "جهاز غير معروف";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android Phone" : "Android Tablet";
  if (/Windows/i.test(ua)) {
    if (/Edg\//i.test(ua)) return "Windows — Edge";
    if (/Chrome/i.test(ua)) return "Windows — Chrome";
    if (/Firefox/i.test(ua)) return "Windows — Firefox";
    return "Windows";
  }
  if (/Macintosh|Mac OS/i.test(ua)) {
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Mac — Chrome";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Mac — Safari";
    if (/Firefox/i.test(ua)) return "Mac — Firefox";
    return "macOS";
  }
  if (/Linux/i.test(ua)) return "Linux";
  return "متصفح";
}

export function trackSession(userId: string, ip: string, userAgent: string): void {
  try {
    const sessions = readSessions();
    sessions[userId] = {
      userId,
      ip: ip || "غير متاح",
      userAgent: (userAgent || "").slice(0, 300),
      deviceName: parseDeviceName(userAgent),
      lastSeenAt: new Date().toISOString(),
    };
    saveSessions(sessions);
  } catch {}
}

export function getUserSession(userId: string): SessionInfo | null {
  return readSessions()[userId] ?? null;
}

export function getAllSessions(): Record<string, SessionInfo> {
  return readSessions();
}
