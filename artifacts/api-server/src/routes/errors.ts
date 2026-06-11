import { Router, type Request, type Response } from "express";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { verifyAdmin } from "./admin.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ERRORS_FILE = join(__dirname, "../errors.json");

export interface LoggedErrorOccurrence {
  id: string;
  ts: string;
  message: string;
  stack?: string;
  context?: string;
}

export interface LoggedError {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  page?: string;
  url: string;
  message: string;
  stack?: string;
  meta?: unknown;
  status: "new" | "investigating" | "resolved";
  createdAt: string;
  updatedAt: string;
  count: number;
  occurrences: LoggedErrorOccurrence[];
}

function readErrors(): LoggedError[] {
  try {
    if (!existsSync(ERRORS_FILE)) return [];
    return JSON.parse(readFileSync(ERRORS_FILE, "utf-8")) as LoggedError[];
  } catch {
    return [];
  }
}

function saveErrors(errors: LoggedError[]): void {
  try {
    writeFileSync(ERRORS_FILE, JSON.stringify(errors, null, 2), "utf-8");
  } catch {
    // ignore write failures
  }
}

const router = Router();

router.post("/errors", (req: Request, res: Response): void => {
  const { userId, userName, userEmail, page, url, message, stack, meta } = req.body as Partial<LoggedError>;
  if (!message || !url) {
    res.status(400).json({ error: "message and url required" });
    return;
  }

  const now = new Date().toISOString();
  const errors = readErrors();
  const signature = `${message}::${stack ?? ""}::${url}`;
  const existing = errors.find(err => `${err.message}::${err.stack ?? ""}::${err.url}` === signature);

  const occurrence: LoggedErrorOccurrence = {
    id: `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: now,
    message,
    stack,
    context: page,
  };

  if (existing) {
    existing.count += 1;
    existing.updatedAt = now;
    existing.occurrences.unshift(occurrence);
    if (!existing.userId && userId) existing.userId = userId;
    if (!existing.userName && userName) existing.userName = userName;
    if (!existing.userEmail && userEmail) existing.userEmail = userEmail;
    if (!existing.page && page) existing.page = page;
    if (!existing.meta && meta) existing.meta = meta;
    saveErrors(errors);
    res.status(200).json({ success: true, errorId: existing.id });
    return;
  }

  const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const errorEntry: LoggedError = {
    id,
    userId,
    userName,
    userEmail,
    page,
    url,
    message,
    stack,
    meta,
    status: "new",
    createdAt: now,
    updatedAt: now,
    count: 1,
    occurrences: [occurrence],
  };

  errors.unshift(errorEntry);
  saveErrors(errors.slice(0, 2000));
  res.status(201).json({ success: true, errorId: id });
});

router.get("/admin/errors", (req: Request, res: Response): void => {
  if (!verifyAdmin(req, res)) return;
  const errors = readErrors();
  const status = (req.query.status as string | undefined)?.toLowerCase();
  const filtered = status ? errors.filter(err => err.status === status) : errors;
  res.json(filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
});

router.patch("/admin/errors/:id", (req: Request, res: Response): void => {
  if (!verifyAdmin(req, res)) return;
  const { status } = req.body as { status?: LoggedError["status"] };
  if (!status || !["new", "investigating", "resolved"].includes(status)) {
    res.status(400).json({ error: "invalid status" });
    return;
  }
  const errors = readErrors();
  const idx = errors.findIndex(err => err.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  errors[idx].status = status;
  errors[idx].updatedAt = new Date().toISOString();
  saveErrors(errors);
  res.json({ success: true, error: errors[idx] });
});

export default router;
