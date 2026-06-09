// Zentrale Dokumenttyp-Konfiguration — Single Source of Truth.
// PDF, HTML, UI und Editor lesen daraus (Pattern aus monti.pro übernommen).

export type DocBaseType =
  | "allgemein" | "angebot" | "arbeitsbericht" | "aufmassdokument"
  | "auftragsbestaetigung" | "baustellenbericht" | "bestellschein" | "brief"
  | "gutschrift" | "kalkulation" | "lieferschein" | "mahnung"
  | "rechnung" | "rechnung_13b" | "reparaturauftrag" | "stornorechnung"
  | "wartungsauftrag";

export interface DocTypeConfig {
  base: DocBaseType;
  label: string;
  short: string;       // Nummernpräfix-Kürzel-Hinweis
  isInvoiceLike: boolean;   // zahlbares Dokument (Rechnung/Gutschrift/Storno/§13b)
  isOfferLike: boolean;     // Angebot
  showPositions: boolean;   // Positionsliste relevant
  showPaymentSection: boolean;
  showLeistungsdatum: boolean;
  defaultVatRate: number;
}

export const DOC_TYPES: Record<DocBaseType, DocTypeConfig> = {
  allgemein:            { base: "allgemein", label: "Allgemein", short: "ALL", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  angebot:              { base: "angebot", label: "Angebot", short: "ANG", isInvoiceLike: false, isOfferLike: true, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  arbeitsbericht:       { base: "arbeitsbericht", label: "Arbeitsbericht", short: "ARB", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: true, defaultVatRate: 20 },
  aufmassdokument:      { base: "aufmassdokument", label: "Aufmaßdokument", short: "AFM", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  auftragsbestaetigung: { base: "auftragsbestaetigung", label: "Auftragsbestätigung", short: "AB", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  baustellenbericht:    { base: "baustellenbericht", label: "Baustellenbericht", short: "BER", isInvoiceLike: false, isOfferLike: false, showPositions: false, showPaymentSection: false, showLeistungsdatum: true, defaultVatRate: 20 },
  bestellschein:        { base: "bestellschein", label: "Bestellschein", short: "BS", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  brief:                { base: "brief", label: "Brief", short: "B", isInvoiceLike: false, isOfferLike: false, showPositions: false, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  gutschrift:           { base: "gutschrift", label: "Gutschrift", short: "GS", isInvoiceLike: true, isOfferLike: false, showPositions: true, showPaymentSection: true, showLeistungsdatum: true, defaultVatRate: 20 },
  kalkulation:          { base: "kalkulation", label: "Kalkulation", short: "KALK", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  lieferschein:         { base: "lieferschein", label: "Lieferschein", short: "LS", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: true, defaultVatRate: 20 },
  mahnung:              { base: "mahnung", label: "Mahnung", short: "MA", isInvoiceLike: false, isOfferLike: false, showPositions: false, showPaymentSection: true, showLeistungsdatum: false, defaultVatRate: 20 },
  rechnung:             { base: "rechnung", label: "Rechnung", short: "RE", isInvoiceLike: true, isOfferLike: false, showPositions: true, showPaymentSection: true, showLeistungsdatum: true, defaultVatRate: 20 },
  rechnung_13b:         { base: "rechnung_13b", label: "Rechnung §13b", short: "RE", isInvoiceLike: true, isOfferLike: false, showPositions: true, showPaymentSection: true, showLeistungsdatum: true, defaultVatRate: 0 },
  reparaturauftrag:     { base: "reparaturauftrag", label: "Reparaturauftrag", short: "RA", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: true, defaultVatRate: 20 },
  stornorechnung:       { base: "stornorechnung", label: "Stornorechnung", short: "ST", isInvoiceLike: true, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: false, defaultVatRate: 20 },
  wartungsauftrag:      { base: "wartungsauftrag", label: "Wartungsauftrag", short: "WA", isInvoiceLike: false, isOfferLike: false, showPositions: true, showPaymentSection: false, showLeistungsdatum: true, defaultVatRate: 20 },
};

export const getDocConfig = (base: string): DocTypeConfig =>
  DOC_TYPES[base as DocBaseType] ?? DOC_TYPES.allgemein;

export const docLabel = (base: string): string => getDocConfig(base).label;

// Platzhalter {{Pfad.feld}} ersetzen (strikte Delimiter).
export function interpolateText(
  template: string | null | undefined,
  context: Record<string, unknown>,
): string {
  if (!template) return "";
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, path: string) => {
    const val = path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, context);
    return val == null ? "" : String(val);
  });
}

// Dokumentstatus → Label + Farbe (Pill)
export const DOC_STATUS_LABELS: Record<string, string> = {
  entwurf: "Entwurf",
  import_erforderlich: "Import erforderlich",
  in_bearbeitung: "In Bearbeitung",
  erstellt: "Erstellt",
  versendet: "Versendet",
  erneut_versendet: "Erneut versendet",
  angenommen: "Angenommen",
  abgelehnt: "Abgelehnt",
  storniert: "Storniert",
  geloescht: "Gelöscht",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  offen: "Offen",
  teilzahlung: "Teilzahlung",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
  storniert: "Storniert",
};
