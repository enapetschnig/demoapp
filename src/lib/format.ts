// Formatierung für Österreich (de-AT, EUR, Europe/Vienna).

export const fmtEUR = (value: number | null | undefined): string =>
  new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(
    Number(value ?? 0),
  );

export const fmtNumber = (value: number | null | undefined, digits = 2): string =>
  new Intl.NumberFormat("de-AT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value ?? 0));

// Datums-Strings (YYYY-MM-DD) timezone-sicher parsen (T12:00 Anker → kein Off-by-one).
export const parseDateSafe = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const datePart = s.slice(0, 10);
  return new Date(`${datePart}T12:00:00`);
};

export const fmtDate = (s: string | Date | null | undefined): string => {
  if (!s) return "";
  const d = typeof s === "string" ? parseDateSafe(s) : s;
  if (!d) return "";
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
};

export const fmtDateTime = (s: string | Date | null | undefined): string => {
  if (!s) return "";
  const d = typeof s === "string" ? new Date(s) : s;
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// YYYY-MM-DD für DB / Input[type=date]
export const toISODate = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const r2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100;
