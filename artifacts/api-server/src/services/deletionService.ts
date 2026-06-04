import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "../../deletion-requests.json");

export interface DeletionRequest {
  id: string;
  walletId: string;
  fullName?: string;
  email?: string;
  accountType?: string;
  reason?: string;
  requestedAt: string;
  status: "pending" | "handled" | "rejected" | "cancelled";
  handledAt?: string;
}

interface DeletionData {
  requests: DeletionRequest[];
}

function readData(): DeletionData {
  try {
    if (!fs.existsSync(DATA_FILE)) return { requests: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as DeletionData;
  } catch {
    return { requests: [] };
  }
}

function writeData(data: DeletionData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getAllRequests(): DeletionRequest[] {
  return readData().requests;
}

export function addRequest(req: Omit<DeletionRequest, "id" | "requestedAt" | "status">): DeletionRequest {
  const data = readData();
  // Remove any existing pending request for the same wallet before adding new one
  data.requests = data.requests.filter(r => !(r.walletId === req.walletId && r.status === "pending"));
  const entry: DeletionRequest = {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...req,
    requestedAt: new Date().toISOString(),
    status: "pending",
  };
  data.requests.unshift(entry);
  writeData(data);
  return entry;
}

export function markHandled(id: string, status: "handled" | "rejected" = "handled"): boolean {
  const data = readData();
  const r = data.requests.find((x) => x.id === id);
  if (!r) return false;
  r.status = status;
  r.handledAt = new Date().toISOString();
  writeData(data);
  return true;
}

export function cancelRequestByWallet(walletId: string): boolean {
  const data = readData();
  const r = data.requests.find(x => x.walletId === walletId && x.status === "pending");
  if (!r) return false;
  r.status = "cancelled";
  r.handledAt = new Date().toISOString();
  writeData(data);
  return true;
}

export function deleteRequestById(id: string): boolean {
  const data = readData();
  const before = data.requests.length;
  data.requests = data.requests.filter(r => r.id !== id);
  if (data.requests.length === before) return false;
  writeData(data);
  return true;
}
