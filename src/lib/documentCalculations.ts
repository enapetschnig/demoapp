// Single Source of Truth für die Beleg-Kalkulation (Client-Anzeige).
// Spiegelt exakt die DB-Trigger-Logik (recompute_document_totals).
import { r2 } from "./format";

export interface CalcItem {
  kind: "artikel" | "leistung" | "titel" | "text";
  quantity?: number | null;
  unit_price?: number | null;
  purchase_price?: number | null;
  discount_percent?: number | null;
  vat_rate?: number | null;
  time_minutes?: number | null;
}

export interface VatGroup { rate: number; base: number; vat: number; }
export interface CalcResult {
  positionsNet: number;
  docDiscount: number;
  net: number;
  vatGroups: VatGroup[];
  vatTotal: number;
  gross: number;
  ekTotal: number;
  profit: number;
  workMinutes: number;
  articleCount: number;
  serviceCount: number;
}

export function lineNet(it: CalcItem): number {
  if (it.kind !== "artikel" && it.kind !== "leistung") return 0;
  return r2((it.quantity ?? 0) * (it.unit_price ?? 0) * (1 - (it.discount_percent ?? 0) / 100));
}

export function calcDocument(
  items: CalcItem[],
  opts: { discountPercent?: number; discountAmount?: number } = {},
): CalcResult {
  const billable = items.filter((i) => i.kind === "artikel" || i.kind === "leistung");
  const positionsNet = r2(billable.reduce((s, i) => s + lineNet(i), 0));

  let docDiscount = r2(positionsNet * (opts.discountPercent ?? 0) / 100) + (opts.discountAmount ?? 0);
  if (docDiscount < 0) docDiscount = 0;
  const net = r2(positionsNet - docDiscount);
  const factor = positionsNet > 0 ? (positionsNet - docDiscount) / positionsNet : 1;

  const byRate = new Map<number, number>();
  for (const i of billable) {
    const rate = i.vat_rate ?? 0;
    byRate.set(rate, (byRate.get(rate) ?? 0) + lineNet(i));
  }
  const vatGroups: VatGroup[] = [...byRate.entries()]
    .map(([rate, base]) => ({ rate, base: r2(base * factor), vat: r2(base * factor * rate / 100) }))
    .sort((a, b) => b.rate - a.rate);
  const vatTotal = r2(vatGroups.reduce((s, g) => s + g.vat, 0));

  const ekTotal = r2(billable.reduce((s, i) => s + (i.purchase_price ?? 0) * (i.quantity ?? 0), 0));
  const workMinutes = items.filter((i) => i.kind === "leistung").reduce((s, i) => s + (i.time_minutes ?? 0) * (i.quantity ?? 0), 0);

  return {
    positionsNet, docDiscount, net, vatGroups, vatTotal,
    gross: r2(net + vatTotal),
    ekTotal, profit: r2(net - ekTotal), workMinutes,
    articleCount: items.filter((i) => i.kind === "artikel").length,
    serviceCount: items.filter((i) => i.kind === "leistung").length,
  };
}
