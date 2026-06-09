// Laufzeit-Theming: Primärfarbe (aus Adminbereich / Seitendarstellung) anwenden.
// Wandelt Hex → HSL und setzt die CSS-Variablen, die das Designsystem nutzt.

export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  let c = hex.trim().replace(/^#/, "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return null;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Kontrastfarbe (schwarz/weiß) passend zur Fläche
function readableForeground(l: number): string {
  return l > 60 ? "0 0% 13%" : "0 0% 100%";
}

export const DEFAULT_PRIMARY = "#71c837";

export function applyPrimaryColor(hex: string | null | undefined) {
  const value = hex && hex.length ? hex : DEFAULT_PRIMARY;
  const hsl = hexToHsl(value);
  if (!hsl) return;
  const root = document.documentElement;
  const triple = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  root.style.setProperty("--primary", triple);
  root.style.setProperty("--primary-foreground", readableForeground(hsl.l));
  root.style.setProperty("--ring", triple);
  root.style.setProperty("--sidebar-primary", triple);
  root.style.setProperty("--sidebar-ring", triple);
  // Aktiver Menüpunkt: dunkle Variante der Primärfarbe + heller Balken
  root.style.setProperty("--sidebar-active-bg", `${hsl.h} ${Math.max(hsl.s - 20, 25)}% 18%`);
  root.style.setProperty("--sidebar-active-bar", `${hsl.h} ${hsl.s}% 60%`);
  root.style.setProperty("--sidebar-active-fg", `${hsl.h} ${Math.min(hsl.s + 5, 70)}% 72%`);
  root.style.setProperty("--success", `${hsl.h} ${hsl.s}% ${Math.max(hsl.l - 8, 30)}%`);
}
