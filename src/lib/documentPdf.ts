import { fmtEUR, fmtDate, fmtNumber } from "./format";
import type { CalcResult } from "./documentCalculations";

export interface PdfRecipient {
  name: string; company?: string; street?: string; zip?: string; city?: string;
  customerNumber?: string; email?: string; mobile?: string;
}
export interface PdfCompany {
  name: string; street?: string; zip?: string; city?: string;
  phone?: string; email?: string; logo_url?: string | null;
  iban?: string; bic?: string; bank?: string; vat_id?: string;
}
export interface PdfItem {
  position: number; name: string; description?: string;
  quantity: number; unit?: string; unit_price: number; line_net: number; kind: string;
}
export interface PdfData {
  company: PdfCompany; recipient: PdfRecipient;
  docTitle: string; number: string; date: string; subject?: string;
  introHtml?: string; outroHtml?: string;
  items: PdfItem[]; calc: CalcResult; showPrices: boolean;
}

export function buildDocumentHtml(d: PdfData): string {
  const c = d.company;
  const senderLine = [c.name, c.street, `${c.zip ?? ""} ${c.city ?? ""}`.trim()].filter(Boolean).join(" · ");
  const rows = d.items.map((it) => {
    if (it.kind === "titel") {
      return `<tr><td colspan="6" style="padding:8px 6px;font-weight:bold;border-top:1px solid #ddd">${esc(it.name)}</td></tr>`;
    }
    return `<tr style="border-top:1px solid #eee">
      <td style="padding:6px;vertical-align:top">${it.position}</td>
      <td style="padding:6px;text-align:right;vertical-align:top">${fmtNumber(it.quantity, 2)}</td>
      <td style="padding:6px;vertical-align:top">${esc(it.unit ?? "")}</td>
      <td style="padding:6px;vertical-align:top">${esc(it.name)}${it.description ? `<div style="color:#666;font-size:11px">${esc(it.description)}</div>` : ""}</td>
      ${d.showPrices ? `<td style="padding:6px;text-align:right;vertical-align:top">${fmtEUR(it.unit_price)}</td>
      <td style="padding:6px;text-align:right;vertical-align:top">${fmtEUR(it.line_net)}</td>` : `<td></td><td></td>`}
    </tr>`;
  }).join("");

  const vatRows = d.calc.vatGroups.map((g) =>
    `<tr><td style="padding:2px 0">zzgl. ${fmtNumber(g.rate, 0)}% MwSt.</td><td style="text-align:right">${fmtEUR(g.vat)}</td></tr>`
  ).join("");

  const totals = d.showPrices ? `
    <table style="margin-left:auto;margin-top:12px;width:50%;font-size:12px">
      <tr><td style="padding:2px 0">Nettobetrag</td><td style="text-align:right">${fmtEUR(d.calc.net)}</td></tr>
      ${vatRows}
      <tr style="font-weight:bold;border-top:1px solid #333"><td style="padding:6px 0">Gesamtsumme</td><td style="text-align:right">${fmtEUR(d.calc.gross)}</td></tr>
    </table>` : "";

  const footerParts = [
    c.phone && `Tel: ${esc(c.phone)}`,
    c.email && esc(c.email),
    c.iban && `IBAN: ${esc(c.iban)}`,
    c.bic && `BIC: ${esc(c.bic)}`,
    c.vat_id && `UID: ${esc(c.vat_id)}`,
  ].filter(Boolean).join(" · ");

  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a1a1a;width:180mm;padding:0">
    <div style="display:flex;justify-content:space-between;align-items:flex-start">
      <div style="font-size:9px;color:#666;border-bottom:1px solid #ccc;padding-bottom:2px;margin-bottom:24px">${esc(senderLine)}</div>
      ${c.logo_url ? `<img src="${c.logo_url}" style="max-height:60px;max-width:160px;object-fit:contain" crossorigin="anonymous" />` : ""}
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:8px">
      <div style="line-height:1.5">
        ${d.recipient.company ? `<div>${esc(d.recipient.company)}</div>` : ""}
        <div>${esc(d.recipient.name)}</div>
        ${d.recipient.street ? `<div>${esc(d.recipient.street)}</div>` : ""}
        <div>${esc(`${d.recipient.zip ?? ""} ${d.recipient.city ?? ""}`.trim())}</div>
      </div>
      <table style="font-size:11px;line-height:1.6">
        <tr><td style="color:#666;padding-right:12px">${esc(d.docTitle)}-Nr.</td><td style="font-weight:bold">${esc(d.number)}</td></tr>
        <tr><td style="color:#666">Datum</td><td>${esc(d.date)}</td></tr>
        ${d.recipient.customerNumber ? `<tr><td style="color:#666">Kundennr.</td><td>${esc(d.recipient.customerNumber)}</td></tr>` : ""}
      </table>
    </div>
    ${d.subject ? `<div style="margin-top:24px;font-weight:bold;font-size:14px">BV: ${esc(d.subject)}</div>` : ""}
    <h1 style="font-size:18px;font-weight:600;margin:16px 0 4px">${esc(d.docTitle)} ${esc(d.number)}</h1>
    ${d.introHtml ? `<div style="margin:8px 0">${d.introHtml}</div>` : ""}
    <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:12px">
      <thead><tr style="background:#f3f4f6;text-align:left">
        <th style="padding:6px">Pos</th><th style="padding:6px;text-align:right">Menge</th><th style="padding:6px">Einheit</th>
        <th style="padding:6px">Bezeichnung</th>
        ${d.showPrices ? `<th style="padding:6px;text-align:right">Einzelpreis</th><th style="padding:6px;text-align:right">Gesamt</th>` : "<th></th><th></th>"}
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${totals}
    ${d.outroHtml ? `<div style="margin-top:24px">${d.outroHtml}</div>` : ""}
    <div style="margin-top:48px;border-top:1px solid #ccc;padding-top:6px;font-size:9px;color:#666;text-align:center">${footerParts}</div>
  </div>`;
}

function esc(s: string): string {
  return String(s ?? "").replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]!));
}

export async function downloadDocumentPdf(d: PdfData, filename: string) {
  const html2pdf = (await import("html2pdf.js")).default as unknown as (...a: unknown[]) => {
    set: (o: unknown) => { from: (e: HTMLElement) => { save: () => Promise<void> } };
  };
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.background = "#fff";
  container.style.padding = "15mm";
  container.innerHTML = buildDocumentHtml(d);
  document.body.appendChild(container);
  try {
    await html2pdf().set({
      margin: 0,
      filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    }).from(container).save();
  } finally {
    document.body.removeChild(container);
  }
}
