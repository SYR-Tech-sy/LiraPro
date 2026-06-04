import { Router, type Request, type Response } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const TICKETS_FILE = join(__dir, "../support-tickets.json");
const MESSAGES_FILE = join(__dir, "../support-messages.json");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "SYRSYP2026ADMIN";

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "normal" | "high";
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedNote?: string;
  closedBy?: string;
  lastMessageAt: string;
  messageCount: number;
  unreadAdmin?: number;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  role: "user" | "admin" | "bot";
  text: string;
  agentName?: string;
  agentBadge?: string;
  attachment?: { type: string; name: string; url?: string; duration?: number };
  createdAt: string;
  readByAdmin?: boolean;
  readByUser?: boolean;
}

function readTickets(): SupportTicket[] {
  try {
    if (!existsSync(TICKETS_FILE)) return [];
    return JSON.parse(readFileSync(TICKETS_FILE, "utf-8")) as SupportTicket[];
  } catch { return []; }
}

function saveTickets(tickets: SupportTicket[]): void {
  try { writeFileSync(TICKETS_FILE, JSON.stringify(tickets, null, 2), "utf-8"); } catch {}
}

function readMessages(): Record<string, TicketMessage[]> {
  try {
    if (!existsSync(MESSAGES_FILE)) return {};
    return JSON.parse(readFileSync(MESSAGES_FILE, "utf-8")) as Record<string, TicketMessage[]>;
  } catch { return {}; }
}

function saveMessages(data: Record<string, TicketMessage[]>): void {
  try { writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2), "utf-8"); } catch {}
}

function verifyAdmin(req: Request, res: Response): boolean {
  const token = req.headers["x-admin-token"];
  if (token !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

const router = Router();

// ── Create ticket (user) ──────────────────────────────────────────────────────
router.post("/support/tickets", async (req, res): Promise<void> => {
  const { userId, userName, userEmail, subject, firstMessage } = req.body as {
    userId: string; userName: string; userEmail?: string;
    subject: string; firstMessage?: string;
  };

  if (!userId || !subject) {
    res.status(400).json({ error: "userId and subject required" });
    return;
  }

  const tickets = readTickets();
  const existing = tickets.find(t => t.userId === userId && t.status !== "closed");
  if (existing) {
    res.status(409).json({ error: "already_open", ticketId: existing.id });
    return;
  }

  const now = new Date().toISOString();
  const ticketId = `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const ticket: SupportTicket = {
    id: ticketId,
    userId,
    userName,
    userEmail,
    subject: subject.slice(0, 200),
    status: "open",
    priority: "normal",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: now,
    messageCount: firstMessage ? 1 : 0,
    unreadAdmin: firstMessage ? 1 : 0,
  };

  tickets.unshift(ticket);
  saveTickets(tickets.slice(0, 2000));

  if (firstMessage) {
    const messages = readMessages();
    if (!messages[ticketId]) messages[ticketId] = [];
    messages[ticketId].push({
      id: `msg-${Date.now()}`,
      ticketId,
      role: "user",
      text: firstMessage,
      createdAt: now,
      readByAdmin: false,
      readByUser: true,
    });
    saveMessages(messages);
  }

  res.status(201).json(ticket);
});

// ── List all tickets (admin) ──────────────────────────────────────────────────
router.get("/support/tickets", (req, res): void => {
  if (!verifyAdmin(req, res)) return;
  const tickets = readTickets();
  const status = req.query.status as string | undefined;
  const filtered = status ? tickets.filter(t => t.status === status) : tickets;
  res.json(filtered);
});

// ── Get user's own active ticket ──────────────────────────────────────────────
router.get("/support/my-ticket", (req, res): void => {
  const userId = req.query.userId as string;
  if (!userId) { res.status(400).json({ error: "userId required" }); return; }
  const tickets = readTickets();
  const ticket = tickets.find(t => t.userId === userId);
  if (!ticket) { res.json(null); return; }
  const messages = readMessages();
  res.json({ ticket, messages: messages[ticket.id] ?? [] });
});

// ── Get single ticket ─────────────────────────────────────────────────────────
router.get("/support/tickets/:id", (req, res): void => {
  const tickets = readTickets();
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }

  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  const userId = req.query.userId as string | undefined;
  if (!isAdmin && ticket.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = readMessages();
  res.json({ ticket, messages: messages[ticket.id] ?? [] });
});

// ── Get messages for a ticket ─────────────────────────────────────────────────
router.get("/support/tickets/:id/messages", (req, res): void => {
  const tickets = readTickets();
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }

  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  const userId = req.query.userId as string | undefined;
  if (!isAdmin && ticket.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const messages = readMessages();
  res.json(messages[ticket.id] ?? []);
});

// ── Add message to ticket ─────────────────────────────────────────────────────
router.post("/support/tickets/:id/messages", (req, res): void => {
  const tickets = readTickets();
  const idx = tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }

  const ticket = tickets[idx]!;
  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  const { text, role, agentName, agentBadge, userId, attachment } = req.body as {
    text: string; role?: string; agentName?: string; agentBadge?: string;
    userId?: string;
    attachment?: { type: string; name: string; url?: string; duration?: number };
  };

  if (!text) { res.status(400).json({ error: "text required" }); return; }

  if (!isAdmin && ticket.userId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  if (ticket.status === "closed" && !isAdmin) {
    res.status(400).json({ error: "Ticket is closed" }); return;
  }

  const actualRole: "user" | "admin" | "bot" = isAdmin ? ((role as "admin" | "bot") ?? "admin") : "user";
  const now = new Date().toISOString();

  const message: TicketMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ticketId: ticket.id,
    role: actualRole,
    text,
    ...(agentName ? { agentName } : {}),
    ...(agentBadge ? { agentBadge } : {}),
    ...(attachment ? { attachment } : {}),
    createdAt: now,
    readByAdmin: isAdmin,
    readByUser: !isAdmin,
  };

  const messages = readMessages();
  if (!messages[ticket.id]) messages[ticket.id] = [];
  messages[ticket.id].push(message);
  saveMessages(messages);

  tickets[idx] = {
    ...ticket,
    updatedAt: now,
    lastMessageAt: now,
    messageCount: messages[ticket.id].length,
    status: actualRole === "admin" && ticket.status === "open" ? "in_progress" : ticket.status,
    unreadAdmin: actualRole === "user" ? (ticket.unreadAdmin ?? 0) + 1 : 0,
  };
  saveTickets(tickets);

  res.status(201).json(message);
});

// ── Update ticket status (admin) ──────────────────────────────────────────────
router.patch("/support/tickets/:id", (req, res): void => {
  if (!verifyAdmin(req, res)) return;

  const tickets = readTickets();
  const idx = tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }

  const ticket = tickets[idx]!;
  const { status, priority, closedNote, closedBy } = req.body as {
    status?: string; priority?: string; closedNote?: string; closedBy?: string;
  };

  const now = new Date().toISOString();
  tickets[idx] = {
    ...ticket,
    ...(status ? { status: status as SupportTicket["status"] } : {}),
    ...(priority ? { priority: priority as SupportTicket["priority"] } : {}),
    ...(status === "closed" ? {
      closedAt: now,
      ...(closedNote ? { closedNote } : {}),
      ...(closedBy ? { closedBy } : {}),
    } : {}),
    updatedAt: now,
    unreadAdmin: 0,
  };
  saveTickets(tickets);

  if (status === "closed") {
    const messages = readMessages();
    if (!messages[ticket.id]) messages[ticket.id] = [];
    messages[ticket.id].push({
      id: `sys-close-${Date.now()}`,
      ticketId: ticket.id,
      role: "admin",
      text: closedNote
        ? `تم إغلاق التذكرة · ${closedNote}`
        : "تم إغلاق تذكرة الدعم. شكراً لتواصلك مع فريق LiraPro.",
      agentName: closedBy || "فريق دعم LiraPro",
      agentBadge: "cyberpunk",
      createdAt: now,
      readByAdmin: true,
      readByUser: false,
    });
    saveMessages(messages);
  }

  res.json(tickets[idx]);
});

// ── Delete ticket (admin) ─────────────────────────────────────────────────────
router.delete("/support/tickets/:id", (req, res): void => {
  if (!verifyAdmin(req, res)) return;
  const id = req.params.id!;
  const remaining = readTickets().filter(t => t.id !== id);
  saveTickets(remaining);
  const messages = readMessages();
  delete messages[id];
  saveMessages(messages);
  res.json({ success: true });
});

// ── Bulk delete tickets (admin) ───────────────────────────────────────────────
router.post("/support/tickets/bulk-delete", (req, res): void => {
  if (!verifyAdmin(req, res)) return;
  const { ids } = req.body as { ids: string[] };
  if (!Array.isArray(ids)) { res.status(400).json({ error: "ids array required" }); return; }
  const toDelete = new Set(ids);
  const remaining = readTickets().filter(t => !toDelete.has(t.id));
  saveTickets(remaining);
  const messages = readMessages();
  ids.forEach(id => delete messages[id]);
  saveMessages(messages);
  res.json({ success: true, deleted: ids.length });
});

// ── Mark messages as read ─────────────────────────────────────────────────────
router.post("/support/tickets/:id/read", (req, res): void => {
  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  const { userId } = req.body as { userId?: string };

  const tickets = readTickets();
  const idx = tickets.findIndex(t => t.id === req.params.id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return; }

  const ticket = tickets[idx]!;
  if (!isAdmin && ticket.userId !== userId) {
    res.status(403).json({ error: "Forbidden" }); return;
  }

  const messages = readMessages();
  const ticketMsgs = messages[ticket.id] ?? [];
  ticketMsgs.forEach(m => {
    if (isAdmin && m.role === "user") m.readByAdmin = true;
    if (!isAdmin && m.role === "admin") m.readByUser = true;
  });
  messages[ticket.id] = ticketMsgs;
  saveMessages(messages);

  if (isAdmin) {
    tickets[idx] = { ...ticket, unreadAdmin: 0 };
    saveTickets(tickets);
  }

  res.json({ success: true });
});

export default router;
