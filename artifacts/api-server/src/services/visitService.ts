import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, "../../visit-stats.json");

interface VisitData {
  total: number;
  today: number;
  todayDate: string;
  lastUpdated: string;
}

function readData(): VisitData {
  const todayDate = new Date().toISOString().slice(0, 10);
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { total: 0, today: 0, todayDate, lastUpdated: new Date().toISOString() };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as VisitData;
  } catch {
    return { total: 0, today: 0, todayDate, lastUpdated: new Date().toISOString() };
  }
}

function writeData(data: VisitData): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function incrementVisit(): VisitData {
  const data = readData();
  const today = new Date().toISOString().slice(0, 10);
  if (data.todayDate !== today) {
    data.today = 0;
    data.todayDate = today;
  }
  data.total += 1;
  data.today += 1;
  data.lastUpdated = new Date().toISOString();
  writeData(data);
  return data;
}

export function getVisitStats(): VisitData {
  return readData();
}
