I now have everything verified. The neuedemoapp scaffold already mirrors monti.pro's dependency set (jspdf 2.5.2 explicit, all shadcn deps, Supabase, React Query). The storno function confirms the race-risk finding (MAX+LOOP, no FOR UPDATE row lock). I have all the load-bearing details confirmed against real code. Here is the report.

---

# monti.pro Studie — Erkenntnisse für HERO-Nachbau

> Lead-Architekt-Report. Grundlage: Quellcode-Analyse von `monti.pro` (verifiziert gegen reale Dateien) + Anforderungen an die HERO Handwerker-Software. Ziel: ein sauberer Neubau, nicht ein Klon. Externe Schnittstellen (DATANORM, IDS, GAEB, DATEV, Lexware, UGL, OpenTrans) sind **nicht** Teil des Scopes.
> Bestätigt: Das Scaffold unter `/Users/christophnapetschnig/Developer/neuedemoapp` enthält bereits den vollständigen shadcn/ui-Satz, Supabase-Client, React Query und `jspdf@2.5.2` — die Tech-Basis aus Abschnitt 1 ist also schon eingerichtet.

---

## 1. Tech-Stack & bestätigte Konventionen zum Wiederverwenden

Der bestehende Stack ist solide und produktionsbewährt. **1:1 übernehmen** — die Versionen sind im Scaffold bereits identisch.

### Exakte Libraries & Versionen (aus `package.json`)
| Bereich | Library | Version | Hinweis |
|---|---|---|---|
| Framework | `react` / `react-dom` | `^18.3.1` | |
| Build | `vite` `^5.4.19` + `@vitejs/plugin-react-swc` `^3.11.0` | | SWC statt Babel — schnell |
| Sprache | `typescript` `^5.8.3` | | strict |
| Styling | `tailwindcss` `^3.4.17` + `tailwindcss-animate` + `@tailwindcss/typography` | | |
| UI-Primitives | shadcn/ui auf `@radix-ui/*` | siehe `components.json` | New-York-Style, kompletter Satz schon im Scaffold |
| Server-State | `@tanstack/react-query` | `^5.83.0` | **Pflicht** in HERO (monti.pro nutzt es zu wenig — siehe unten) |
| Backend | `@supabase/supabase-js` | `^2.79.0` | Auth + DB + Storage + Edge Functions |
| Forms | `react-hook-form` `^7.61.1` + `zod` `^3.25.76` + `@hookform/resolvers` | | Zod-Validierung end-to-end |
| Routing | `react-router-dom` | `^6.30.1` | |
| PDF | `jspdf` `^2.5.2` + `jspdf-autotable` `^5.0.7` | | Client-seitig (siehe §3 für Empfehlung) |
| QR (EPC/GiroCode) | `qrcode` `^1.5.4` | | SEPA-Überweisungs-QR |
| Tabellen-Export | `xlsx` + `xlsx-js-style` | | Stundenauswertung/Reports |
| Rich-Text | `react-quill-new` `^3.8.3` | | Langtexte in Positionen / Textbausteine |
| Datum | `date-fns` `^3.6.0` | | **Immer mit `de-AT`-Locale + Wien-TZ** |
| Toasts | `sonner` `^1.7.4` | | |
| PWA | `vite-plugin-pwa` `^0.20.5` | | Auto-Update, Workbox |
| Charts | `recharts` `^2.15.4` | | Auswertungen |
| Icons | `lucide-react` | | |

### Datei-Layout (übernehmen)
```
src/
  main.tsx                      # ErrorBoundary + QueryProvider → App
  App.tsx                       # QueryClientProvider → BrowserRouter → Routes (ProtectedRoute-Wrapper)
  index.css                     # HSL Design-Tokens (:root) — Rebrand = HSL-Werte tauschen
  integrations/supabase/
    client.ts                   # Singleton, localStorage-Persist, Auto-Refresh
    types.ts                    # generierte Database-Typen
  components/
    ui/                         # shadcn-Primitives (NICHT anfassen)
    AppLayout.tsx, AppSidebar.tsx, ProtectedRoute.tsx, ErrorBoundary.tsx
  hooks/                        # usePermissions, useConfigOptions, useIsMobile, useSessionKeepalive
  contexts/                     # Provider (z.B. Auth/Workspace)
  lib/                          # reine Logik (Berechnungen, PDF, Typen) — testbar, ohne React
  pages/                        # Routen-Komponenten
supabase/
  migrations/                   # sequenzielle SQL-Migrationen
  functions/                    # Edge Functions (Email, ggf. PDF)
```

### Bestätigte Konventionen
- **`@/`-Alias** muss in `tsconfig.json` **und** `vite.config.ts` identisch auf `src/` zeigen (sonst IDE ok, Build bricht).
- **Supabase-Client als Singleton**: `import { supabase } from '@/integrations/supabase/client'`.
- **Design-Tokens als HSL in `:root`** (`--primary`, `--accent`, …), Tailwind via `hsl(var(--primary))`. Rebranding = nur Variablen tauschen. monti.pro: primary dunkelblau `#1F3A5F`, accent blau `#0077CC`, success grün `#4CAF50`, Schrift Montserrat/Segoe UI.
- **Reine Logik in `src/lib/`** (Steuerberechnung, PDF, Dokumenttyp-Config) — frei von React, damit unit-testbar.
- **PWA**: Auto-Update-Strategie, Workbox-Caching (5MB-Limit), Icons 192/512/180px, Auto-Reload-Script in `index.html` bei „Failed to fetch dynamically imported module" (Deploy-Cache-Busting).
- **Manuelle Vite-Chunks** für große Libs (jspdf, xlsx, radix, recharts) — bei jedem Major-Bump auditieren.

### Konventions-Korrekturen für HERO (Lessons learned)
1. **React Query konsequent nutzen.** monti.pro hat es installiert, aber Pages fetchen oft direkt mit `supabase.from()` + lokalem State → Doppel-Queries, kein Caching, kein Dedup. **HERO-Regel: jeder DB-Read läuft über einen `useQuery`/`useMutation`-Hook in `src/hooks/queries/`.**
2. **Eine Sprache pro Layer.** monti.pro mischt Deutsch (`kunde_name`, `faellig_am`) und Englisch (`invoice`, `items`). **Empfehlung:** Domänenbegriffe, die fachlich Deutsch sind (Gewerk, Angebot, Mahnung), dürfen Deutsch bleiben — aber **konsistent**. Technische Spalten (`created_at`, `org_id`, `status`) Englisch. Diese Regel früh in `CLAUDE.md` festschreiben.
3. **Keine 4857-Zeilen-Monolithen** (siehe `InvoiceDetail.tsx`). HERO-Regel: Page = Komposition aus Sub-Komponenten + Service-Hooks.

---

## 2. Empfohlenes Supabase-Datenmodell für HERO

> **Das ist die wichtigste Architekturentscheidung.** monti.pro ist **single-user-scoped** (alles nur `user_id`, kein `org_id`). Die Findings nennen das einhellig als #1-Pitfall: nachträgliches Multi-Tenancy = massiver RLS-Rewrite. **HERO startet von Tag 1 mit Mandantenfähigkeit.**

### 2.1 Mandanten- & Auth-Fundament

```sql
organizations        (id, name, slug, created_at)
org_members          (org_id, user_id, role, created_at, PRIMARY KEY(org_id,user_id))
profiles             (id=auth.users.id, vorname, nachname, is_active, theme_color, dark_mode, locale DEFAULT 'de-AT', timezone DEFAULT 'Europe/Vienna')
app_role ENUM        ('administrator','vorarbeiter','mitarbeiter','freelancer')
role_permissions     (org_id, role, feature, can_view, can_edit, UNIQUE(org_id,role,feature))
```

**Multi-Tenant-Regel (verbindlich):**
- **`org_id UUID NOT NULL` ist auf JEDER fachlichen Tabelle die erste Spalte nach `id`.**
- Aktive Organisation kommt aus **JWT Custom Claim** (`app_metadata.org_id`), gesetzt per Auth-Hook bei Login / Org-Wechsel — nicht aus Query-Parametern (manipulierbar).
- `created_by UUID` (= `auth.uid()`) für Audit, **nicht** für Isolation.

**RLS-Standardpattern (eine zentrale Helper-Funktion, überall referenziert):**
```sql
CREATE FUNCTION is_org_member(p_org uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM org_members
                 WHERE org_id = p_org AND user_id = auth.uid());
$$;

CREATE FUNCTION has_org_role(p_org uuid, p_role app_role) RETURNS boolean ...

-- Standard-Policy auf jeder Tabelle:
USING ( org_id = (auth.jwt()->'app_metadata'->>'org_id')::uuid
        AND is_org_member(org_id) )
```
Feinere Sichtbarkeit (z.B. Mitarbeiter sieht nur eigene Projekte) **on top** via Feature-Permissions oder Zuordnungstabelle — **nie** als Ersatz für die Org-Schranke.

> **Konsequenz aus den Findings:** monti.pro hatte mehrere **kritische RLS-Lecks** (`invoice_payments USING(true)` → jeder konnte fremde Rechnungen als bezahlt markieren; `email_log`/`contact_history`/`einsaetze` mit `auth.role()='authenticated'` = alle sehen alles). Mit der Org-Schranke + Member-Check als **verpflichtendem** Default verschwindet diese ganze Fehlerklasse. **Keine einzige Policy darf `USING(true)` oder nur `authenticated` verwenden.**

### 2.2 CRM

```sql
customers            (id, org_id, kundennummer, kundentyp, firmenname, anrede, titel, vorname,
                      nachname, uid_nummer, email, telefon, website, branche,
                      -- strukturierte Adresse, NICHT als ein TEXT-Feld (monti.pro-Pitfall):
                      strasse, hausnummer, plz, ort, land,
                      rechnungs_strasse, rechnungs_plz, rechnungs_ort, rechnungs_land,
                      zahlungsbedingungen, skonto_prozent, skonto_tage, nettofrist,
                      farbe_bg, farbe_text, is_deleted DEFAULT false, created_at, updated_at)
customer_contacts    (id, org_id, customer_id FK, anrede, vorname, nachname, position,
                      email, telefon, ist_hauptkontakt, notizen)
contact_history      (id, org_id, customer_id FK, project_id FK, typ, betreff, beschreibung,
                      datum, dauer_minuten, kontaktperson, created_by)   -- RLS via org_id!
```

### 2.3 Gewerke-Pipelines & Projekte/Aufträge

> HERO braucht **konfigurierbare Gewerke-Pipelines** — das fehlt monti.pro komplett (flache Status-Enums, kein Kanban). Sauber modellieren:

```sql
gewerke              (id, org_id, name, farbe, sort_order, is_active)
pipelines            (id, org_id, gewerk_id FK, name, is_default)
pipeline_stages      (id, org_id, pipeline_id FK, name, farbe_bg, farbe_text, sort_order,
                      is_won, is_lost)          -- ersetzt project_statuses, pro Pipeline konfigurierbar
projects             (id, org_id, projektnummer, name, beschreibung,
                      customer_id FK, pipeline_id FK, stage_id FK,    -- aktuelle Pipeline-Stufe
                      strasse, hausnummer, plz, ort, land,            -- strukturiert!
                      prioritaet, geplanter_start, geplantes_ende, budget, auftragsvolumen,
                      verantwortlicher_id, bauleiter_id, created_by, created_at, updated_at)
project_assignments  (id, org_id, project_id FK, employee_id FK, rolle, assigned_at,
                      UNIQUE(project_id,employee_id))   -- statt zugewiesene_mitarbeiter JSONB
project_gewerke      (id, org_id, project_id FK, gewerk_id FK, stage_id FK)  -- Gewerk-Status je Projekt
auftraege            (id, org_id, project_id FK, auftragsnummer, status, ...)  -- falls Auftrag ≠ Projekt
```
- **Adresse strukturiert** (`strasse/hausnummer/plz/ort/land`) statt eines kommaseparierten TEXT-Felds (monti.pro-Pitfall: brüchiges `.split(',')`).
- **Zuordnungen als Junction-Tabelle** (`project_assignments`) statt JSONB-Array — referenzielle Integrität, einfache RLS, kein manuelles JSONB-Patchen bei Mitarbeiter-Löschung.
- **Aktivitäts-/Audit-Log** (`activity_log(org_id, entity_type, entity_id, action, old_values JSONB, new_values JSONB, created_by, created_at)`) via DB-Trigger auf Status-Änderungen — monti.pro loggt nur manuelle Kontakte, keine Systemereignisse.

### 2.4 Dokumente (Angebot/Rechnung) — der Kern

```sql
document_typ ENUM    ('angebot','auftragsbestaetigung','rechnung','anzahlungsrechnung',
                      'schlussrechnung','lieferschein','gutschrift')
document_status ENUM ('entwurf','offen','gesendet','teilbezahlt','bezahlt',
                      'angenommen','abgelehnt','verrechnet','storniert')

documents            (id, org_id, typ document_typ, nummer TEXT, laufnummer INT, jahr INT,
                      status document_status, version INT DEFAULT 0,   -- optimistic locking!
                      customer_id FK, project_id FK,
                      -- Kunden-SNAPSHOT (bewusst denormalisiert, Audit):
                      kunde_name, kunde_strasse, kunde_plz, kunde_ort, kunde_land,
                      kunde_email, kunde_telefon, kunde_uid, kunde_anrede, kunde_titel,
                      datum, faellig_am, leistungsdatum, leistungsdatum_bis,
                      zahlungsbedingungen, skonto_prozent, skonto_tage,
                      betreff, notizen,
                      -- Summen-CACHE (per Trigger gepflegt, NICHT im Client):
                      netto_summe NUMERIC(12,2), mwst_satz NUMERIC(5,2) DEFAULT 20,
                      mwst_betrag NUMERIC(12,2), brutto_summe NUMERIC(12,2),
                      bezahlt_betrag NUMERIC(12,2) DEFAULT 0,
                      rabatt_prozent NUMERIC(5,2), rabatt_betrag NUMERIC(12,2),
                      nachlass_betrag NUMERIC(12,2), nachlass_bezeichnung TEXT,
                      reverse_charge BOOLEAN DEFAULT false,
                      gueltig_bis DATE, mahnstufe INT DEFAULT 0,
                      -- Genealogie & Storno:
                      parent_document_id UUID FK self, anzahlung_prozent, anzahlung_betrag,
                      verrechnet_mit_document_id UUID FK self, verrechnet_am DATE,
                      storno_nummer, storno_datum, storno_grund,
                      ansprechpartner_employee_id FK, ansprechpartner_name/telefon/email,
                      layout_snapshot JSONB,    -- Layout zum Erstellzeitpunkt (Reprint-Stabilität)
                      pdf_hash TEXT, archiviert BOOLEAN DEFAULT false,
                      is_deleted BOOLEAN DEFAULT false, deleted_at, deleted_by,
                      created_by, created_at, updated_at)

document_items       (id, org_id, document_id FK ON DELETE CASCADE, position INT,
                      kurztext, langtext, beschreibung, menge NUMERIC(12,2),
                      einheit, einzelpreis NUMERIC(12,2), rabatt_prozent NUMERIC(5,2),
                      gesamtpreis NUMERIC(12,2), mwst_exempt BOOLEAN DEFAULT false,
                      mwst_satz_override NUMERIC(5,2),   -- für echte Mischsätze (10/13/20)
                      artikel_id FK, set_snapshot JSONB)

document_payments    (id, org_id, document_id FK, betrag NUMERIC(12,2), datum, notizen, created_by)
document_texts       (id, org_id, typ, feld, sprache DEFAULT 'de', inhalt, UNIQUE(org_id,typ,feld,sprache))
```

**Constraints & Trigger, die monti.pro fehlten (alle einbauen):**
1. `UNIQUE(org_id, nummer)` auf `documents` (monti.pro: nur `UNIQUE(nummer)` global).
2. **Trigger pflegt Summen** auf `document_items` INSERT/UPDATE/DELETE → schreibt `netto/mwst/brutto` zurück. Client berechnet nur für die Anzeige, **nie** als Source-of-Truth.
3. **Trigger pflegt `bezahlt_betrag`** aus `document_payments` + `CHECK (bezahlt_betrag <= brutto_summe OR status IN ('gutschrift','storniert'))`.
4. **Status-State-Machine** als Trigger (legale Übergänge erzwingen, Rückwärtsübergänge ab `bezahlt`/`storniert` blocken).
5. `CHECK (leistungsdatum_bis IS NULL OR leistungsdatum_bis >= leistungsdatum)`.
6. **Optimistic Locking:** `version`-Spalte, Save mit `WHERE version = :expected`; bei Mismatch Konflikt-UI (monti.pro: last-write-wins, stiller Datenverlust).
7. **Soft-Delete** (`is_deleted`) statt Hard-Delete — Audit & Storno-Nachvollziehbarkeit.

### 2.5 Artikelstamm / Leistungen / Verkaufspreise

```sql
artikel              (id, org_id, artikelnummer, kurzbezeichnung, langbezeichnung, beschreibung,
                      einheit_id FK, kategorie_id FK, lieferant_id FK, produktgruppe,
                      ek_netto NUMERIC(12,2), vk_netto NUMERIC(12,2), ust_satz NUMERIC(5,2),
                      aufschlag_prozent NUMERIC(5,2), vk_preis_manuell BOOLEAN,
                      ist_set BOOLEAN, bezugseinheit, ist_lagerartikel BOOLEAN,
                      ist_aktiv BOOLEAN, foto_path, is_deleted DEFAULT false)
artikel_components   (id, org_id, parent_artikel_id FK, component_artikel_id FK,
                      menge NUMERIC(12,2), sort_order, UNIQUE(parent,component))  -- Stücklisten
einheiten            (id, org_id, symbol, name, kategorie, conversion_factor_to_base)
artikel_kategorien   (id, org_id, name, sort_order)
lieferanten          (id, org_id, name, ...)
offer_packages       (id, org_id, name, beschreibung)
offer_package_items  (id, org_id, package_id FK, artikel_id FK, beschreibung, einheit,
                      einzelpreis, default_menge, sort_order)
```
**Lessons aus monti.pro:** EK/VK-Trennung + Auto-VK für Sets (`Σ(EK×menge)×(1+aufschlag%)`) ist gut — übernehmen. **Aber:** Preisfeld-Wildwuchs (`einzelpreis`/`netto_preis`/`brutto_preis`/`vk_netto` parallel) **vermeiden** → nur `vk_netto + ust_satz`, brutto on-the-fly. `kategorie`/`lieferant` als **FK-Lookups** statt Freitext (verhindert „Arbeit" vs „ARBEIT"). Set-Snapshot beim Übernehmen ins Dokument einfrieren (`set_snapshot JSONB`) für stabile Nachkalkulation.

### 2.6 Weitere Module (gleiche Pattern: `org_id` + RLS + Soft-Delete)

```sql
employees, time_entries (+ time_entry_workers, time_entry_vehicles), time_accounts,
time_account_transactions, leave_requests, leave_balances, vehicles,
teams, team_members, einsaetze, board_projects, company_holidays,           -- Plantafel
purchase_invoices (Eingangsrechnungen), mahnungen (+ mahnung_history),       -- Buchhaltung
belege, wartungsvertraege (+ wartungsvertrag_termine), aufgaben,
bautagesberichte (+ workers/photos), besprechungsprotokolle (+ massnahmen),
documents_files (Datei-Anhänge → Storage), email_log, email_templates, audit_log,
number_ranges, app_settings, admin_config_options
```

### 2.7 Nummernkreis-Strategie (race-frei) — KRITISCH

> Das ist die fachlich heikelste Stelle. monti.pro hatte **zwei** Implementierungen mit **unterschiedlicher Qualität** — eine gut, eine riskant.

**Übernehmen (gut):** `next_document_number(p_typ, p_jahr)` mit **`SELECT … FOR UPDATE`** auf der `number_ranges`-Zeile (Datei `20260502100000_next_document_number_lock.sql`). Der Row-Lock serialisiert parallele Aufrufe pro Nummernkreis sauber. Format-Pattern `{PREFIX}{YY}{YYYY}{NNN}{N}{SUFFIX}` ist flexibel. Rechnungsähnliche Typen (`anzahlungsrechnung`/`schlussrechnung`) teilen sich den `rechnung`-Kreis → keine Lücken.

**NICHT übernehmen (Pitfall):** `next_storno_nummer()` (Datei `20260417100000_storno_number_function.sql`) nutzt `MAX(...)+1` in einem `LOOP` mit Kollisionsprüfung **ohne echten Row-Lock**. Bei Parallelität theoretisch dieselbe Nummer + Unique-Violation. **Für HERO:** alle Nummern (inkl. Storno) über **einen** Mechanismus — `number_ranges` + `FOR UPDATE`.

**HERO-Regeln:**
1. `number_ranges (org_id, typ, prefix, suffix, stellen, jahr_format, start_nummer, aktuelle_nummer, format_pattern, UNIQUE(org_id,typ))`. **Pro Organisation eigener Zähler.**
2. Nummern werden **ausschließlich serverseitig** vergeben (`SECURITY DEFINER` RPC mit `FOR UPDATE`). **Niemals** im Client vorgenerieren (monti.pro-Pitfall: alter Client-Code lief am Zähler vorbei → Duplikate).
3. Nummer wird **erst bei Statuswechsel `entwurf → offen/gesendet`** vergeben, nicht beim Anlegen des Entwurfs → keine Lücken durch verworfene Entwürfe (rechtlich relevant für Rechnungsnummern!).
4. `aktuelle_nummer` per Migration mit `MAX()` aus Bestandsdaten synchronisieren, falls migriert wird.

---

## 3. Dokument-Editor & PDF/Email — was übernehmen, was fixen

### Was monti.pro gut macht (übernehmen)
- **Zentrale Dokumenttyp-Config** `src/lib/documentTypes.ts` — eine Quelle der Wahrheit für `isInvoiceLike`/`isAngebotLike`/`hidePrices`/`showPaymentSection`/`showLeistungsdatum`. PDF, HTML und UI lesen daraus. Sehr sauber, **1:1 portieren** (inkl. `getDocConfig`-Fallback + `interpolateText` für `{{platzhalter}}`).
- **DIN-5008-Layout** (Absenderzeile 45mm, Empfänger 50mm, Faltmarken 105/210mm, Fensterkuvert-tauglich) — in `pdfLetterhead.ts`. Domänenwissen, das viel Arbeit spart.
- **EPC/GiroCode-QR** für SEPA-Überweisung (`invoiceHtml.ts` + `qrcode`), nur bei zahlbaren Typen mit vollständigen Bankdaten + brutto > 0.
- **Layout als JSON** in `app_settings` + Merge mit Defaults für graceful degradation (`useInvoiceLayout`, `invoiceLayoutTypes.ts`).
- **Logo-Trimming auf Canvas** (transparente Ränder weg) + 5-min-Cache (`logoLoader.ts`).
- **Email-Audit-Trail**: `email_log` Row sofort als `queued` anlegen, dann Resend aufrufen, dann Status (`sent`/`failed`) + `provider_message_id` updaten (Edge Function `send-document-email`). Auch bei Provider-Fehler bleibt der Trail.
- **Email-Templates** pro Dokumenttyp mit Platzhaltern (`SendEmailDialog`).
- **Timezone-sichere Datumsbehandlung**: Datums-Strings (`YYYY-MM-DD`) per String-Split parsen + `T12:00:00`-Anker statt `new Date()` → keine Off-by-one-Tag-Fehler.

### Was zu fixen ist
1. **Steuerberechnung zentralisieren.** Die verifizierte Formel lebt aktuell **inline** in `InvoiceDetail.tsx:1063-1073`:
   ```ts
   const r2 = (v: number) => Math.round(v * 100) / 100;
   exemptBrutto    = Σ gesamtpreis WHERE mwst_exempt
   positionenNetto = Σ gesamtpreis WHERE NOT mwst_exempt   // gesamtpreis = menge×einzelpreis×(1−rabatt%)
   rabattWert      = positionenNetto × (rabatt_prozent/100)   // ODER rabatt_betrag
   nettoSumme      = r2(positionenNetto − rabattWert − nachlassWert)
   mwstBetrag      = r2(nettoSumme × mwst_satz/100)
   bruttoSumme     = r2(nettoSumme + mwstBetrag + exemptBrutto)
   ```
   → **Nach `src/lib/documentCalculations.ts` extrahieren**, von UI **und** PDF **und** DB-Trigger-Logik (gespiegelt) genutzt. Single source of truth, keine Rundungsdivergenz zwischen Vorschau und gespeicherten Summen. **Immer `r2()` nach jeder Operation** (NUMERIC(12,2)).
2. **Echte Mischsteuersätze.** monti.pro hat nur einen `mwst_satz` pro Dokument + `mwst_exempt`-Flag. Österreich/Handwerk braucht oft 20/13/10 in einem Dokument → `mwst_satz_override` je Position; Summen pro Satz gruppieren und im PDF separat ausweisen.
3. **Monolith aufbrechen.** `InvoiceDetail.tsx` = **4857 Zeilen**, managt Erstellung, Edit, PDF, Storno, Zahlungen, Genealogie. → in HERO: `useDocumentForm` (State+Calc), `DocumentRepository` (CRUD+Genealogie als RPC/Transaktion), `DocumentPdfService`, `PaymentService`, `StornoService` + Sub-Komponenten `<DocumentEditor>`/`<DocumentViewer>`/`<DocumentPayments>`.
4. **Atomare Saves.** monti.pro speichert Header → löscht Items → fügt Items neu ein (3 separate Calls, kein Transaktionsrahmen) → Netzwerkfehler dazwischen = inkonsistent. → **eine RPC** (`save_document(payload jsonb)`) mit `BEGIN…COMMIT`.
5. **Server-seitige PDF-Generierung evaluieren.** Client-`jsPDF` ist gut für Sofort-Vorschau, aber: hält bei 100+ Seiten den Client an, WinAnsi-Charset (`safePdfText()` ersetzt Unicode > U+00FF durch `?`), keine eingebetteten Fonts. **HERO-Empfehlung:** Vorschau client-seitig behalten, **finale PDF in einer Edge Function** rendern (Puppeteer/headless), in Storage ablegen (`documents_files`), `pdf_hash` speichern → Reprint ohne Neuberechnung + Manipulationsschutz. Montserrat als eingebetteten Font.
6. **Layout-Versionierung.** `layout_snapshot JSONB` auf dem Dokument einfrieren → Reprint mit Original-Layout, auch wenn Admin später Logo/Farben ändert.
7. **Template-Platzhalter mit echter Engine.** monti.pro nutzt naives Regex-Replace (Variablenname kann im Inhalt versehentlich ersetzt werden). → strikte Delimiter / Handlebars.
8. **`email_log` aufräumen.** Cron (`pg_cron`) für Archivierung > 90 Tage; PDF-Anhänge unter ~2-3 MB halten (base64-Limit von Resend/HTTP).

---

## 4. Wiederverwendbarer Code/Komponenten (mit Pfaden)

> Direkt portierbar (reine Logik) bzw. als Vorlage. Pfade zur Ausgangsbasis:

**Hoher Reuse-Wert (lib, fast 1:1 portierbar):**
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/documentTypes.ts` — Dokumenttyp-Config + `interpolateText`. **1:1.**
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/pdfLetterhead.ts` — DIN-5008-Briefkopf/Footer.
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/invoiceHtml.ts` — HTML-Tabelle + EPC-QR-Generierung.
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/logoLoader.ts` — Logo-Trim + Cache.
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/invoiceLayoutTypes.ts` — Layout-Typen + Defaults.
- `/Users/christophnapetschnig/Developer/monti.pro/src/lib/workingHours.ts` + `/Users/christophnapetschnig/Developer/monti.pro/src/lib/hoursAccounting.ts` — Soll/Ist/Saldo-Logik (Soll-Werte parametrisieren, siehe §5).
- **Steuerlogik aus** `/Users/christophnapetschnig/Developer/monti.pro/src/pages/InvoiceDetail.tsx:1063-1073` → neu als `documentCalculations.ts`.

**SQL-Funktionen (portieren):**
- `/Users/christophnapetschnig/Developer/monti.pro/supabase/migrations/20260502100000_next_document_number_lock.sql` — **die gute** Nummernfunktion mit `FOR UPDATE`.

**Komponenten als Vorlage (Struktur ja, Code refactoren):**
- `/Users/christophnapetschnig/Developer/monti.pro/src/components/ProtectedRoute.tsx`, `AppLayout.tsx`, `AppSidebar.tsx`, `ErrorBoundary.tsx` — Shell-Pattern.
- `/Users/christophnapetschnig/Developer/monti.pro/src/hooks/usePermissions.ts`, `useConfigOptions`-Pattern, `useSessionKeepalive.ts` — Hooks (mit Fixes aus §5).
- `/Users/christophnapetschnig/Developer/monti.pro/src/components/InvoicePdfPreview.tsx` + `InvoiceLayoutEditor.tsx` + `SendEmailDialog.tsx` — PDF-Vorschau/Layout/Email-UI.
- `/Users/christophnapetschnig/Developer/monti.pro/supabase/functions/send-document-email/index.ts` — Email-Edge-Function (Resend) mit Audit-Trail.
- `/Users/christophnapetschnig/Developer/monti.pro/src/components/MaterialSetEditor.tsx`, `BulkPriceDialog.tsx`, `MaterialCatalogDialog.tsx` — Artikelstamm/Sets (Preisfelder konsolidieren, N+1 in BulkPrice batchen).
- `/Users/christophnapetschnig/Developer/monti.pro/src/components/schedule/*` (`useScheduleData.ts`, `scheduleTypes.ts`, `scheduleUtils.ts`) + `src/pages/ScheduleBoard.tsx` — Plantafel-Drag&Drop (Pointer-Capture, ohne externe Lib, touch-fähig).
- `/Users/christophnapetschnig/Developer/monti.pro/src/components/ContactHistoryTimeline.tsx` — Aktivitäts-Timeline.

**Bereits im HERO-Scaffold vorhanden** (`/Users/christophnapetschnig/Developer/neuedemoapp/src/`): kompletter `components/ui/`-Satz inkl. `rich-text-editor.tsx`, `loading-button.tsx`, `sidebar.tsx`; `integrations/supabase/client.ts`; `hooks/use-mobile.tsx`, `use-toast.ts`. → Baseline steht.

---

## 5. TOP-Pitfalls (gerankt) — was unbedingt zu vermeiden ist

> Reihenfolge = Schadenspotenzial × Eintrittswahrscheinlichkeit. Die ersten vier sind **rechts-/geldrelevant**.

1. **Fehlende Mandantentrennung & lecke RLS.** monti.pro: kein `org_id`, mehrere `USING(true)`/`authenticated`-Policies (`invoice_payments` ließ jeden fremde Rechnungen als bezahlt markieren; `email_log`/`contact_history`/`einsaetze` global lesbar). → **HERO: `org_id NOT NULL` überall, eine zentrale `is_org_member()`-Schranke, kein `USING(true)`. Von Tag 1.**
2. **Nummernkreis-Race & Lücken.** Duplikate durch Client-Vorgenerierung; lückenhafte Rechnungsnummern durch nummerierte Entwürfe; Storno-Funktion ohne Row-Lock. → **Nur serverseitige `FOR UPDATE`-RPC, Nummer erst bei `→offen/gesendet`, ein Mechanismus für alle Typen.**
3. **Steuer-/Rundungsfehler & inkonsistente Summen.** Inline-Formel in 4857-Zeilen-Komponente, Summen im Client gepflegt → driftet gegen DB/PDF. `mwst_exempt`-Flag falsch gesetzt → Steuer doppelt/verschwindet. → **`documentCalculations.ts` als single source, `r2()` nach jeder Operation, Summen + `bezahlt_betrag` per DB-Trigger, `CHECK`-Constraints (kein Overpayment, Datumsrange), echte Mischsätze.**
4. **Keine Atomizität / kein Optimistic Locking bei Dokument-Saves.** Header→Items-Delete→Items-Insert ohne Transaktion (verwaiste Items); last-write-wins bei Parallel-Edit (stiller Datenverlust); Hard-Delete ohne Audit. → **`save_document`-RPC mit Transaktion, `version`-Spalte + Konflikt-UI, Soft-Delete + `audit_log`.**
5. **PDF-Fallstricke.** Client-jsPDF: Unicode/Emoji → `?`, Seitenumbrüche zerschneiden Zeilen, kein Streaming (große Dokumente hängen), stille Render-Fehler (korruptes PDF wirkt erfolgreich), CORS auf Logo-Storage → Canvas-Trim scheitert lautlos, Layout-Änderung wirkt erst nach Refresh. → **finale PDF server-seitig, eingebetteter Font, `page-break-inside:avoid`, Storage-CORS prüfen, `pdf_hash` + Layout-Snapshot.**
6. **Zeit/Saldo-Annahmen hartcodiert.** Soll fix 10h Mo-Do/0 Fr-So, keine Teilzeit/Schedule-Overrides; Overlap-Check nur tagesintern (ganztägige `einsaetze` doppelbuchbar); `HH:MM`-Strings ohne TZ → DST-Off-by-one. → **`employee_schedule(soll_h_per_day, part_time%, timezone)`, Overlap-Check als INSERT-Trigger inkl. ganztägiger Einsätze, durchgängig `date-fns` mit `Europe/Vienna`.**
7. **Genealogie-Korruption (Angebot→AB→AR→SR→Gutschrift).** `parent_invoice_id`-Kette bis 5 Hops, kann verwaisen; Gutschrift-Verrechnung verlangt manuelle UI-Aktion → bleibt fälschlich `offen`; Storno-Rollback bei gelöschtem Ziel → verwaister `bezahlt_betrag`. → **FK-Typ-Constraints auf `parent_document_id.typ`, Verrechnung als Trigger/atomare RPC, Status-State-Machine.**
8. **Datenmodell-Brüchigkeit.** Adresse als ein TEXT-Feld (brüchiges `.split(',')`), `zugewiesene_mitarbeiter` als JSONB-Array (kein referenzieller Schutz), Preisfeld-Wildwuchs, Freitext-`kategorie`/`lieferant`, Geister-/Legacy-Tabellen. → **strukturierte Adressen, Junction-Tabellen, ein VK-Feld, FK-Lookups, saubere Migrationen.**
9. **App-Shell-Schwächen.** `usePermissions` lädt Rollen nur einmal (kein Refetch bei Rollenänderung); Session-Keepalive failt still (Arbeitsverlust beim nächsten Save); serielle ProtectedRoute-Checks (4+ Round-Trips/Route); `MENU_GROUPS` re-rendert nicht bei Permission-Änderung. → **Realtime-Sub auf `role_permissions`, sichtbare Session-Warn-Toast, ein `useAuth`-Context (Org+Rolle+Permissions in 1 Query), `useMemo` für Sidebar.**
10. **Keine Observability.** ErrorBoundary loggt nur in die Konsole; kein Remote-Error-Tracking; Tests mit `waitForTimeout` (flaky). → **Sentry o.ä. in ErrorBoundary + Edge-Functions, deterministische Playwright-Assertions.**

---

## 6. Empfohlene Modul-Baureihenfolge (Reliability-First)

> Prinzip: erst das mandantenfähige Fundament, dann der **kritische Pfad Angebot→Rechnung end-to-end**, dann darauf aufbauende Module. Jede Phase liefert etwas Lauffähiges + Tests.

**Phase 0 — Fundament (Wochen 1-2) — Voraussetzung für alles**
- Multi-Tenancy: `organizations`, `org_members`, JWT-Claim-Hook, `is_org_member()`/`has_org_role()`.
- App-Shell: `useAuth`-Context (Org+Rolle+Permissions in 1 Query), `ProtectedRoute`, `AppLayout`/`AppSidebar`, `ErrorBoundary` + Sentry, Session-Keepalive mit Toast.
- `number_ranges` + `next_document_number()` (`FOR UPDATE`), `app_settings`, `admin_config_options`, `audit_log`, `role_permissions`.
- React-Query-Konvention + `CLAUDE.md` (ER-Diagramm, Auth-Flow, Namenskonvention).

**Phase 1 — Stammdaten (Woche 3)**
- CRM: `customers`, `customer_contacts`, `contact_history` (strukturierte Adressen).
- Artikelstamm: `artikel`, `einheiten`, `kategorien`, `lieferanten`, `artikel_components` (Sets), `offer_packages`.

**Phase 2 — KRITISCHER PFAD: Angebot + Rechnung end-to-end (Wochen 4-6) ⚠️**
> **Muss zuerst vollständig funktionieren — das ist das Herz von HERO.** Erst weiterbauen, wenn dieser Pfad lückenlos und getestet steht.
1. `documents` + `document_items` + Trigger (Summen, `bezahlt_betrag`, Status-State-Machine), Constraints, `version` (Optimistic Locking).
2. `documentCalculations.ts` (extrahiert + unit-getestet) + Dokumenttyp-Config.
3. Dokument-Editor (refaktoriert: `useDocumentForm` + Sub-Komponenten + `save_document`-RPC atomar).
4. PDF: Vorschau (client) + finale Generierung (Edge Function, Storage, `pdf_hash`, Layout-Snapshot) + EPC-QR + DIN-5008.
5. Email: `email_log` + `email_templates` + Resend-Edge-Function.
6. Nummernvergabe bei `→offen/gesendet`; Genealogie Angebot→AB→AR→SR; Zahlungen; Storno; Gutschrift-Verrechnung.
7. **Akzeptanztest:** Angebot anlegen → annehmen → in Rechnung wandeln → PDF → mailen → Teilzahlung → Vollzahlung → Storno. Alle Summen, Nummern, Status korrekt, race-frei (Parallel-Test).

**Phase 3 — Projekte & Gewerke-Pipelines (Wochen 7-8)**
- `gewerke`, `pipelines`, `pipeline_stages`, `projects` (strukturiert), `project_assignments`, `project_gewerke`, Kanban-Board, `activity_log`-Trigger. Dokumente an Projekte verknüpfen.

**Phase 4 — Zeit & Planung (Wochen 9-10)**
- `time_entries` (+ workers/vehicles), `time_accounts`, `leave_requests`/`leave_balances`, `employee_schedule` (Teilzeit/TZ), Overlap-Trigger, Plantafel (`einsaetze`/`teams`/`board_projects`), Excel-Export.

**Phase 5 — Aufträge, Aufgaben, Wartungsverträge (Wochen 11-12)**
- `auftraege`, `aufgaben`, `wartungsvertraege` (+ Termine, ggf. `pg_cron`-Fälligkeit), Lager (auf Artikelstamm).

**Phase 6 — Buchhaltung & Auswertungen (Wochen 13-14)**
- `purchase_invoices`, `belege`, `mahnungen` (+ Eskalation), Materialized Views für Auswertungen (Umsatz/Monat, Kundensaldo, Mitarbeiterstunden), Recharts-Dashboards.

**Phase 7 — Firmeneinstellungen/Admin (Woche 15)**
- Projekttypen/Pipelines-Editor, Nummernkreise-UI, Zugriffsrechte-Matrix (Realtime), Mitarbeiterverwaltung, Layout-Editor, PWA-Branding pro Org.

---

### Zusammenfassung für die Umsetzung
- **Tech-Stack** aus monti.pro 1:1 — ist im Scaffold bereits eingerichtet.
- **Drei Architekturentscheidungen retten das Projekt:** (1) `org_id` + zentrale RLS-Schranke von Tag 1, (2) serverseitige race-freie Nummern + DB-Trigger für Summen/Status/Zahlungen, (3) Steuerlogik in `documentCalculations.ts` + Editor entmonolithisieren + atomare Saves.
- **Kritischer Pfad Angebot→Rechnung zuerst** und vollständig, bevor andere Module beginnen.
- **Wiederverwendbar:** alle `src/lib/*`-Logik, DIN-5008/EPC-QR/Logo-Loader, die `FOR UPDATE`-Nummernfunktion, Email-Edge-Function, Plantafel-D&D, Shell-Pattern.
- **Klar vermeiden:** lecke RLS, Client-Nummernvergabe, `MAX+LOOP`-Storno, Inline-Steuerformel, JSONB-Zuordnungen, TEXT-Adressen, Preisfeld-Wildwuchs, stiller Session-Fail.