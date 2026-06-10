Both confirmed. Key additional finding: the calculation engine (`documentCalculations.ts`) supports `discount_percent` per line and document-level discount, but **has no `markup_percent` support at all** — so the Aufschlag column is genuinely unbuilt end-to-end, not just missing in UI. Also, the Editor's right panel "Übersicht" (line 346-358) actually DOES show EK Material, Arbeitszeit, Ertrag — so finding "interne Kalkulation fehlt" is partly inaccurate; only EK Lohn / Aufschlag(€/%) / Rabatt-Aufschläge are missing. I have enough verified ground truth. Here is the report.

---

# App-Audit — Gaps & Verbesserungen

**Stand:** 2026-06-10 · Lead-QA Review aller 12 Module · Soll = Word-Dokument

## 1. Gesamteinschätzung

Die App deckt das Dokument **breit, aber flach** ab: Alle 12 Hauptmodule existieren mit funktionierendem Grundgerüst (CRUD, Listen, RLS via `company_id`, Navigation), aber kaum eines erreicht die im Dokument geforderte Tiefe — durchgehend "teilweise". Der **kritische Pfad Angebot → Rechnung funktioniert im Kern**: Dokumente lassen sich anlegen, mit Artikeln/Leistungen aus dem Katalog bestücken, die Summen werden korrekt inkl. Mischsteuer berechnet (`calcDocument` spiegelt die DB-Trigger), das Abschließen vergibt eine Nummer aus dem Nummernkreis mit Snapshots und Pipeline-Automatik, PDF-Export läuft, und in der Buchhaltung werden Zahlungen mit auto-recalculiertem Status erfasst. **Der Pfad ist also durchgängig nutzbar.** Die größten echten Risiken liegen (a) in einer **RLS-Lücke in KontaktDetail** (fremde Firmendaten potentiell lesbar) und (b) in einem **falschen Foreign-Key bei Abwesenheiten**. Funktionale Lücken (Aufschlag, dokumentweiter Rabatt im UI, Vorlagen-Backend, Layout-Konfigurator, Mahngebühren) mindern die Vollständigkeit gegenüber dem Dokument, blockieren den Grundbetrieb aber nicht.

---

## 2. P0 — Echte Bugs (müssen gefixt werden)

Priorisiert nach Sicherheit → Datenkorrektheit → sichtbarer Funktionsausfall.

### P0.1 — RLS-Lücke: KontaktDetail liest ohne `company_id`-Filter
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/KontaktDetail.tsx` (Zeilen 26, 35, 44)
Die Queries für `documents`, `projects` und `activity_log` filtern nur auf `customer_id`/`entity_id`, **nicht** auf `company_id`. Falls die DB-RLS-Policies nicht greifen (oder bei manipulierter ID), sind Daten anderer Firmen lesbar. **Verifiziert.** Fix: `.eq("company_id", company!.id)` an alle drei Queries anhängen.

### P0.2 — Abwesenheiten speichern Typ als String statt FK
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/mitarbeiter/Abwesenheiten.tsx:89` + `useEmployees.ts:138`
`absences.type` wird als freier Name-String gespeichert statt als FK auf `absence_types`. Folge: Umbenennen/Löschen eines Typs bricht historische Datensätze, Auswertungen nach Typ sind unzuverlässig. Datenintegritäts-Bug.

### P0.3 — Pausenregel wird gespeichert, aber nie angewendet
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/mitarbeiter/Pausenverwaltung.tsx`
`break_rule` (Gesetzlich/Fest/Keine) wird in `company.settings` persistiert, aber **keine Logik zieht die Pause bei der Zeiterfassung ab**. Arbeitszeiten sind dadurch systematisch falsch → falsche Lohn-/Auswertungsdaten. Logik-Bug mit Geschäftswirkung.

### P0.4 — Belege: `open_amount` wird nie neu berechnet
`supabase/migrations/0005_modules.sql` (Z. 25-44) + `/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/buchhaltung/Belege.tsx`
Anders als bei `payments` (Trigger vorhanden) gibt es für Belegzahlungen keinen Recompute-Trigger. `open_amount` bleibt statisch → falsche offene Beträge in der Buchhaltung. Fix: Trigger analog `trg_payments_recompute`.

### P0.5 — Dokumentweiter Rabatt im Editor nicht eingebbar
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/DokumentEditor.tsx`
`discountPercent` ist State (Z. 55), fließt in `calcDocument` (Z. 102) und ins Save-Payload (Z. 118) — aber **es gibt kein Eingabefeld im UI**. Der dokumentweite Rabatt ist damit toter Code; Nutzer können keinen Rabatt geben. **Verifiziert.** Fix: Input neben dem Summenblock (Z. 285-291).

### P0.6 — Mahngebühr wird nirgends berechnet/addiert
`/Users/christophnapetschnig/Developer/neuedemoapp/src/hooks/queries/useDunning.ts` (`useCreateDunning`, Z. 82-107)
`dunning_levels.fee` existiert, wird bei Mahnungserstellung aber nicht auf `open_amount` aufgeschlagen. Mahnungen sind betragsmäßig falsch. Geschäftslogik-Bug.

> **Korrektur zum Audit-Input:** Das gemeldete „TabsContent value='logbuch' fehlt“ in `KontaktDetail.tsx` ist **falsch** — der Tab existiert (Z. 117-129). Reales Problem ist nur, dass `defaultValue` `dokumente` statt `logbuch` ist (siehe P1.10, kein P0).

---

## 3. P1 — Wichtige Lücken ggü. Dokument (nach Wirkung sortiert)

### P1.1 — Aufschlag (markup_percent) End-to-End fehlend
`DokumentEditor.tsx` (Spalte fehlt Z. 249-251; `EItem`-Typ Z. 29 ohne Feld) + `documentCalculations.ts` (kein `markup_percent` in `CalcItem`/Logik) + `migrations/0003_document_engine.sql:171` (Spalte existiert, ungenutzt). **Verifiziert:** Die Kalkulationsengine kennt Aufschlag gar nicht — Anforderung 21.4/36.2 ist komplett unerfüllt, betrifft die kaufmännische Kernkalkulation jeder Position.

### P1.2 — Vorlagen-Modul ist reine Attrappe
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/dokumente/Vorlagen.tsx`
**Verifiziert:** Nur `PLACEHOLDER`-Array (Z. 15-18), kein Backend, kein Speichern, keine Wiederverwendung. Anforderung 6.7/31.3 völlig offen — hoher Alltagsnutzen für Angebots-/Rechnungserstellung.

### P1.3 — Layout-Konfigurator fehlt
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/dokumente/Konfigurator.tsx`
Nur Name/Status/Ordner/Pipeline. Fehlen: Seitenränder, Schriftgrößen/-art, Grundlayout (Klassik/Modern), Fußzeile, Positionen-Checkboxen (15+), Reiter ERSTE/FOLGESEITEN (Anf. 6.5/20.2). Bestimmt das gesamte PDF-Erscheinungsbild.

### P1.4 — Nummernkreise nicht im Adminbereich
Finalize nutzt sie bereits, aber es gibt **keine Verwaltungs-UI** (Präfix, Startnummer, nächste Nummer; Anf. 16/20). Neue Admin-Seite nötig.

### P1.5 — Buchhaltungs-Einstellungen: 4 Reiter fehlen
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/buchhaltung/BuchhaltungEinstellungen.tsx`
Fehlen: BUCHUNGSKONTEN (DATEV SKR 03/04), UMSATZSTEUERREGELUNG (§13b, PV), NUMMERNKREISE, ALLGEMEIN. Voraussetzung für korrekte Buchung/DATEV-Export.

### P1.6 — Zugriffsrechte stark vereinfacht
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/admin/Zugriffsrechte.tsx`
6 Rechte statt 20+ in Themenblöcken; keine Stufen (alle/Niederlassung/eigene), keine dokumenttyp-spezifische Sichtbarkeit. Sicherheits- und Berechtigungsmodell unterdimensioniert.

### P1.7 — Gewerke-Pipelines nicht dynamisch in der Sidebar
`/Users/christophnapetschnig/Developer/neuedemoapp/src/lib/navigation.ts`
Statisches „Projekte" mit 3 Subpunkten statt je Gewerk (PV/Dach/Montage) aufklappbare Phasen mit Zählern (Anf. 5.1/22.2). Zentrale Navigation für den Projektalltag.

### P1.8 — Plantafel ohne Stundenblöcke, Gruppierung & Drag&Drop
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/planung/Plantafel.tsx`
Keine 06/09/12/15-Spalten, keine Gruppierung (Allgemein/Mitarbeiter), kein DnD zum Terminverschieben. Plantafel ist Kern der Disposition.

### P1.9 — Zeiterfassung: falsche KPIs, fehlende Reiter/Spalten
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/mitarbeiter/Zeiterfassung.tsx`
KPI-Kacheln entsprechen nicht dem Soll (BEANTRAGT/BEWILLIGT/SOLL/ABWESEND/AUSGLEICH/SALDO), Reiter STUNDENAUSGLEICH und Spalte „Pause" fehlen.

### P1.10 — Diverse Soll/Ist-Defaults & fehlende Detail-Reiter
KontaktDetail Default-Tab `dokumente` statt `logbuch` (`KontaktDetail.tsx:84`); fehlende Detail-Reiter in Kontakt (Bilder, Ansprechpartner, Aufgaben, Aufträge, Objektadressen) und Projekt (11 von 13 Reitern fehlen). Mittlere Wirkung, hohe Sichtbarkeit.

### P1.11 — Reporting: 3 von 7 Reitern + alle Filterleisten fehlen
`/Users/christophnapetschnig/Developer/neuedemoapp/src/pages/Auswertungen.tsx`
Artikel&Leistungen-, Umsatz/Projekt-, Projektkarte-Tabs fehlen; keine Date-Range/Dropdown-Filter (Anf. 37). Zusätzlich Datenkonsistenz-Bug (s. P2.4).

---

## 4. P2 — Verbesserungen / Politur

- **P2.1 — Positions-Rabatt-Spalte im Editor.** `discount_percent` pro Position ist in DB & `lineNet` (Z. 30-33) berechnet, aber kein Eingabefeld. (`DokumentEditor.tsx`)
- **P2.2 — Globale Suche (Strg+K) verdrahten.** Such-Input ist nur visuell ohne Handler; `cmdk` ist vorhanden. (`src/components/AppSidebar.tsx:119-126`)
- **P2.3 — TexteTitel: `BASE_TYPES` dynamisch.** Hartcodierte 6 Typen → alle 16 aus `DOC_TYPES`. (`src/pages/dokumente/TexteTitel.tsx:23-30`)
- **P2.4 — Reporting-Konsistenz.** `useDocTypeCounts` ohne `INVOICE_TYPES`-Filter, inkonsistent zu `useRevenueReport`. (`src/hooks/queries/useReports.ts`)
- **P2.5 — Konsistenz-Bugs „erfasst aber nicht angezeigt":** Auftrags-Adresse & Ansprechpartner (`src/pages/Auftraege.tsx`), Lager-Spalten Kategorie/Erstellt von/Projekt (`src/pages/LagerBewegungen.tsx`, `Lagerbuch.tsx`), Land-Feld im Kontaktformular (`src/components/ContactDialog.tsx:33`).
- **P2.6 — Editor-Übersicht ergänzen.** Rechtes Panel zeigt bereits EK Material/Arbeitszeit/Ertrag (Z. 346-358); fehlen nur EK Lohn und Aufschlag(€/%) ggü. Anf. 21.4.
- **P2.7 — Defaults aus Stammdaten.** Artikel-Neuanlage hardcodet `unit='Stk'`/`vat_rate=20` statt `company.default_vat_rate`. (`src/pages/Artikel.tsx:20`)
- **P2.8 — UNIQUE-Constraints.** Artikelnummer/EAN pro `company_id` (DB-Ebene). (`src/hooks/queries/useCatalog.ts`)
- **P2.9 — Shell-Politur:** Benachrichtigungs-Badge mit echter Zahl, Hilfe-Icon-Dropdown, klickbare Footer-Links, Mobile-Hamburger. (`src/components/AppHeader.tsx`, `AppSidebar.tsx`)
- **P2.10 — Drag&Drop Positions-Reorder** im Editor mit `sort_order`-Persistierung; Dashboard-Karten mit echten KPIs (offene Aufgaben/Mahnwesen-Button).

---

## 5. Geordnete TODO-Liste (umsetzbar, mit Dateien)

**Sprint 1 — Sicherheit & Datenkorrektheit (P0):**
1. RLS-Filter ergänzen: `.eq("company_id", company!.id)` in den 3 Queries von `src/pages/KontaktDetail.tsx` (Z. 26/35/44). RLS-Audit der übrigen Detail-Seiten anschließen.
2. `absences.type` auf FK umstellen: Migration für FK auf `absence_types`, Dialog `src/pages/mitarbeiter/Abwesenheiten.tsx:89` + `useEmployees.ts:138` auf ID statt String.
3. Belege-Recompute-Trigger in neuer Migration `supabase/migrations/00XX_receipts_recompute.sql` analog `trg_payments_recompute`.
4. Pausenabzug implementieren: `break_rule` aus `company.settings` in der Zeiterfassungs-Speicherlogik anwenden (`src/pages/mitarbeiter/Pausenverwaltung.tsx` Logik → `useTime.ts`).
5. Mahngebühr addieren: `dunning_levels.fee` in `useCreateDunning` (`src/hooks/queries/useDunning.ts:82-107`) laden und auf `open_amount` aufschlagen.

**Sprint 2 — Dokumenten-Kernpfad vervollständigen (P0.5 + P1.1 + P2.1):**
6. Dokumentweites Rabattfeld als Input neben Summenblock in `src/pages/DokumentEditor.tsx` (Z. 285-291).
7. Aufschlag End-to-End: `markup_percent` zu `CalcItem` + Logik in `src/lib/documentCalculations.ts`, zu `EItem` (Z. 29) und als Spalte (Z. 249-276) in `DokumentEditor.tsx`, plus Verdrahtung in `buildPayload`.
8. Positions-Rabatt-Input pro Zeile in der Positionstabelle (`DokumentEditor.tsx`).

**Sprint 3 — Hochwirksame Feature-Lücken (P1):**
9. Vorlagen-Backend: Tabelle `document_templates` + CRUD-Hook + `src/pages/dokumente/Vorlagen.tsx` von `PLACEHOLDER` auf echte Daten.
10. Nummernkreise-Admin-Seite + Layout-Konfigurator-Reiter in `src/pages/dokumente/Konfigurator.tsx`.
11. Buchhaltungs-Reiter (Buchungskonten/USt/Nummernkreise/Allgemein) in `src/pages/buchhaltung/BuchhaltungEinstellungen.tsx`.
12. Gewerke-Pipelines dynamisch aus `project_types` in `src/lib/navigation.ts`.

**Sprint 4 — Disposition, Zeit & Reporting (P1):**
13. Plantafel-Umbau (Stundenblöcke + Gruppierung + DnD) in `src/pages/planung/Plantafel.tsx`.
14. Zeiterfassungs-KPIs/Reiter/Spalten korrigieren in `src/pages/mitarbeiter/Zeiterfassung.tsx`.
15. Reporting: fehlende Tabs + Filterleisten + `INVOICE_TYPES`-Fix in `src/pages/Auswertungen.tsx` / `src/hooks/queries/useReports.ts`.

**Sprint 5 — Politur (P2):** Globale Suche verdrahten, dynamische `BASE_TYPES`, Konsistenz-Spalten (Auftrag/Lager/Kontakt-Land), KontaktDetail-Default-Tab, Shell-Badges/Links, Stammdaten-Defaults, UNIQUE-Constraints.