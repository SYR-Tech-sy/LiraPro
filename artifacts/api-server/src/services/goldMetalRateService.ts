interface GoldOverride {
  pricePerGramSYP: number;
  isManual: boolean;
  updatedAt: string;
}

interface MetalOverride {
  symbol: string;
  priceSYP: number;
  isManual: boolean;
  updatedAt: string;
}

let goldOverride: GoldOverride | null = null;
const metalOverrides: Map<string, MetalOverride> = new Map();

export function getGoldOverride(): GoldOverride | null {
  return goldOverride;
}

export function setGoldOverride(pricePerGramSYP: number): GoldOverride {
  goldOverride = { pricePerGramSYP, isManual: true, updatedAt: new Date().toISOString() };
  return goldOverride;
}

export function clearGoldOverride(): void {
  goldOverride = null;
}

export function getMetalOverride(symbol: string): MetalOverride | null {
  return metalOverrides.get(symbol) ?? null;
}

export function getAllMetalOverrides(): Record<string, MetalOverride> {
  return Object.fromEntries(metalOverrides.entries());
}

export function setMetalOverride(symbol: string, priceSYP: number): MetalOverride {
  const ovr: MetalOverride = { symbol, priceSYP, isManual: true, updatedAt: new Date().toISOString() };
  metalOverrides.set(symbol, ovr);
  return ovr;
}

export function clearMetalOverride(symbol: string): void {
  metalOverrides.delete(symbol);
}
