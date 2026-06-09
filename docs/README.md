# Handwerker Software (Demo) — Entwickler-Doku

White-label Komplettlösung für Handwerksbetriebe (CRM, Projekte/Pipelines, Angebote/Rechnungen,
Artikelstamm, Lager, Buchhaltung, Zeiterfassung, Planung, Auswertungen). Nachbau gemäß
`~/Downloads/softwareanfroderungen.docx`. **Kein Marken-/Produktname fest verdrahtet** — Firmenname,
Logo und Primärfarbe sind im Adminbereich konfigurierbar.

## Stack
- Vite + React 18 + TypeScript, Tailwind + shadcn/ui (Radix), TanStack Query, React Router v6
- Supabase (Auth, Postgres + RLS, Storage), react-hook-form/zod, react-quill-new (Rich-Text)
- html2pdf.js (PDF), recharts (Auswertungen), date-fns (de-AT, Europe/Vienna), sonner (Toasts), PWA

## Starten
```bash
cd ~/Developer/neuedemoapp
npm install
npm run dev      # http://localhost:8080
```
Registrieren (E-Mail-Bestätigung ist für die Demo deaktiviert). Beim ersten Login legt
`bootstrap_company` automatisch einen voll funktionsfähigen Mandanten an (Nummernkreise,
Dokumenttypen, Ordner, Quellen, 4 Gewerke-Pipelines, VK1, Monteurstunde, Demo-Artikel + Demo-Kunde).

## Architektur-Leitplanken (aus der monti.pro-Studie, siehe `00-studie-montipro.md`)
1. **Mandantenfähigkeit ab Tag 1**: jede Fachtabelle hat `company_id`; RLS-Policy
   `company_id = current_company_id()` (SECURITY DEFINER, liest `profiles`). Keine `USING(true)`-Policies.
2. **Race-freie Nummernkreise**: `next_document_number()` per `UPDATE … RETURNING` (Row-Lock).
   Nummer wird erst beim **Abschließen** vergeben (keine Lücken durch verworfene Entwürfe).
3. **Summen = DB-Wahrheit**: `document_items`-Trigger berechnen Netto/MwSt/Brutto (Mischsätze je Satz);
   der Client spiegelt sie nur für die Live-Anzeige (`src/lib/documentCalculations.ts`).
4. **Atomar speichern**: `save_document(jsonb)`-RPC schreibt Kopf + Positionen in einer Transaktion.
5. **Snapshots**: `finalize_document` friert Empfänger-/Firmen-/Layout-Snapshot ein (stabiler Nachdruck).

## Datenmodell
Migrationen in `supabase/migrations/0001..0006` (anwenden via Supabase-SQL-Editor oder Management-API).
Überblick siehe `01-datenmodell.md`. Kernfunktionen:
`current_company_id`, `next_document_number`, `save_document`, `finalize_document`,
`recompute_document_totals`, `recompute_document_payment`, `bootstrap_company`, `seed_module_defaults`.

## Code-Konventionen
- Jeder DB-Zugriff über einen Hook in `src/hooks/queries/` (TanStack Query). Nie roh in der Page.
- Listenseiten = `PageHeader` + `DataTable` (Steuerleiste, Sortierung, Filterzeile, Paginierung).
- Dialoge: Felder mittig, Footer „Abbrechen" (grau) / „Speichern" (grün) — einheitlich.
- Geld `fmtEUR`, Datum `fmtDate`/`toISODate`, Zahlen `fmtNumber` (alles `de-AT`).
- Designtokens als HSL in `src/index.css`; Primärfarbe zur Laufzeit über `src/lib/theme.ts`.

## Modul-Doku
- `00-studie-montipro.md` — Studie des Bestandsprojekts (Patterns, Pitfalls, Baureihenfolge)
- `01-datenmodell.md` — Tabellen & Beziehungen
- `02-dokumente.md` — Dokumenteneditor, Kalkulation, Nummernkreise, PDF (kritischer Pfad)
- weitere `NN-<modul>.md` entstehen je Modul

## Status
Siehe Projekt-Memory. Fertig: Fundament+Engine (getestet), Shell+Theme, Kontakte, Artikelstamm,
Projekte/Pipelines, Dokumenteneditor+PDF, Admin (Firmenprofil/Logo, Seitendarstellung/Farbe).
In Arbeit: Buchhaltung, Zeit/Personal, Planung, Lager, Wartung, Aufträge, Aufgaben, Auswertungen, übriger Admin.
