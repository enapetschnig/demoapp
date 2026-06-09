# Dokumente — Editor, Kalkulation, Nummernkreise, PDF (kritischer Pfad)

Das Belegwesen ist das Herzstück. „Angebot/Rechnung schreiben" muss verlässlich funktionieren.

## Ablauf
1. **Anlegen**: `/dokumente/neu` (optional `?type=&customer=&project=`) oder „Dokument erstellen" im Projekt.
2. **Editor** (`src/pages/DokumentEditor.tsx`, Route `/dokumente/:id`):
   - Mitte: Typ/Kunde/Datum/Betreff, Einleitungstext (Rich-Text), Positionstabelle, Summen, Schlusstext.
   - Rechts: Reiter „Artikel & Leistungen" (Katalogsuche → Position einfügen) und „Texte & Titel"
     (Bausteine einfügen) + Box „Übersicht" (Live-KPIs: Positionen, EK, Ertrag, netto/brutto).
3. **Speichern**: `save_document(jsonb)` — Kopf + Positionen atomar in einer Transaktion.
4. **Abschließen**: `finalize_document(uuid)` — vergibt die Nummer (Nummernkreis, race-frei), setzt
   Status `erstellt`, friert Snapshots ein, verschiebt das Projekt automatisch in die konfigurierte Phase.
5. **PDF**: `src/lib/documentPdf.ts` rendert ein A4-Layout (Firmenkopf + Logo, Empfänger, Infoblock,
   Positionen, Summen je MwSt-Satz, Schlusstext, Fußzeile mit Bankdaten) und lädt es via html2pdf herunter.
6. **E-Mail**: vorbereitet (Mailserver-Konfig im Admin), echter Versand folgt.

## Kalkulation (Single Source of Truth)
`src/lib/documentCalculations.ts` spiegelt exakt den DB-Trigger `recompute_document_totals`:
- `line_net = round(menge × EP × (1 − Rabatt%/100), 2)` (nur artikel/leistung; titel/text = 0)
- Dokument-Rabatt (Prozent + Betrag) reduziert den Netto; MwSt wird **je Steuersatz** gruppiert berechnet
  (echte Mischsätze 20/13/10), Brutto = Netto + Σ MwSt. Immer nach jedem Schritt auf 2 Stellen runden (`r2`).
- Die DB ist die Wahrheit; der Client rechnet nur für die Anzeige → keine Divergenz Vorschau/gespeichert.

## Nummernkreise
`document_types.number_range_key` → `number_ranges`. `next_document_number` macht
`UPDATE number_ranges SET next_number = next_number + 1 … RETURNING` (Row-Lock, keine Races).
Nummer erst beim Abschließen → keine Lücken durch verworfene Entwürfe (rechtlich relevant für Rechnungen).
`rechnung_13b` teilt sich den `rechnung`-Kreis.

## Dokumenttyp-Konfiguration
`src/lib/documentTypes.ts` = zentrale Config (Label, `isInvoiceLike`, `isOfferLike`, `showPaymentSection`,
`showPositions`, `defaultVatRate`) + `interpolateText` für `{{Platzhalter}}`. UI, PDF und Logik lesen daraus.

## Status & Zahlungen
`document_status` (entwurf → erstellt → versendet → angenommen/abgelehnt/storniert).
`payment_status` (offen/teilzahlung/bezahlt/überfällig/storniert) wird über `payments` +
Trigger `recompute_document_payment` gepflegt (Buchhaltung → „Zahlung erfassen").
