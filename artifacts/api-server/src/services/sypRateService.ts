import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = join(__dir, "../syp-rate-settings.json");

export interface SypRateSettings {
  rate: number;
  isManual: boolean;
  updatedAt: string;
}

const DEFAULT_SETTINGS: SypRateSettings = {
  rate: 13500,
  isManual: false,
  updatedAt: new Date().toISOString(),
};

function readSettings(): SypRateSettings {
  try {
    if (!existsSync(SETTINGS_FILE)) return { ...DEFAULT_SETTINGS };
    return JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) as SypRateSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: SypRateSettings): void {
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

let _settings: SypRateSettings = readSettings();

export function getActiveSypRate(): number {
  return _settings.isManual ? _settings.rate : 13500;
}

export function getSypRateSettings(): SypRateSettings {
  return { ..._settings };
}

export function setSypRateSettings(rate: number, isManual: boolean): SypRateSettings {
  _settings = { rate, isManual, updatedAt: new Date().toISOString() };
  saveSettings(_settings);
  return { ..._settings };
}
