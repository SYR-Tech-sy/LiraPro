import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "../../rate-overrides.json");

export interface CurrencyOverride {
  code: string;
  buyPrice?: number;
  sellPrice?: number;
  updatedAt: string;
}

interface OverridesData {
  overrides: Record<string, CurrencyOverride>;
}

let cache: OverridesData | null = null;

function readData(): OverridesData {
  if (cache) return cache;
  try {
    if (!fs.existsSync(DATA_FILE)) {
      cache = { overrides: {} };
      return cache;
    }
    cache = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as OverridesData;
    return cache;
  } catch {
    cache = { overrides: {} };
    return cache;
  }
}

function writeData(data: OverridesData): void {
  cache = data;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getAllOverrides(): Record<string, CurrencyOverride> {
  return readData().overrides;
}

export function setOverride(code: string, buyPrice?: number, sellPrice?: number): CurrencyOverride {
  const data = readData();
  const entry: CurrencyOverride = {
    code,
    buyPrice,
    sellPrice,
    updatedAt: new Date().toISOString(),
  };
  data.overrides[code] = entry;
  writeData(data);
  return entry;
}

export function deleteOverride(code: string): boolean {
  const data = readData();
  if (!data.overrides[code]) return false;
  delete data.overrides[code];
  writeData(data);
  return true;
}

export function clearAllOverrides(): void {
  writeData({ overrides: {} });
}
