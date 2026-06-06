import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "../../verify-requests.json");

export interface VerifyRequest {
  id: string;
  supabaseId: string;
  lphId: string;
  fullName: string;
  email: string;
  requestedAt: string;
  status: "pending" | "approved" | "rejected";
  approvedAt?: string;
  rejectedAt?: string;
}

interface VerifyData {
  requests: VerifyRequest[];
}

function readData(): VerifyData {
  try {
    if (!fs.existsSync(DATA_FILE)) return { requests: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as VerifyData;
  } catch {
    return { requests: [] };
  }
}

function writeData(data: VerifyData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getAllVerifyRequests(): VerifyRequest[] {
  return readData().requests;
}

export function addVerifyRequest(
  req: Omit<VerifyRequest, "id" | "requestedAt" | "status">
): VerifyRequest {
  const data = readData();
  const existing = data.requests.find(
    (r) => r.supabaseId === req.supabaseId && r.status === "pending"
  );
  if (existing) return existing;
  const entry: VerifyRequest = {
    id: `vrf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...req,
    requestedAt: new Date().toISOString(),
    status: "pending",
  };
  data.requests.unshift(entry);
  writeData(data);
  return entry;
}

export function handleVerifyRequest(
  id: string,
  action: "approved" | "rejected"
): boolean {
  const data = readData();
  const r = data.requests.find((x) => x.id === id);
  if (!r) return false;
  r.status = action;
  if (action === "approved") r.approvedAt = new Date().toISOString();
  else r.rejectedAt = new Date().toISOString();
  writeData(data);
  return true;
}
