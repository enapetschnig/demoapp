# Datenmodell

Alle Fachtabellen haben `company_id uuid` (Mandant) + RLS `company_id = current_company_id()`.
Geld `numeric(14,2)`, Mengen `numeric(14,3)`, Steuersätze `numeric(5,2)`, Default-MwSt 20 % (AT).

## Fundament & Mandant (0001)
- **companies** — Mandant: Name, Adresse, Bank (IBAN/BIC), Steuer-IDs, `logo_url`, `primary_color`, `default_vat_rate`, `settings` jsonb
- **branches** — Niederlassungen (Name, Adresse, Radius)
- **profiles** — Mitarbeiter, verknüpft mit `auth.users`; `role`, `user_kind` (standard/app), `branch_id`
- Helfer: `current_company_id()`, `current_role()`, Trigger `handle_new_user` (legt Profil an)

## Konfiguration (0001)
- **number_ranges** — Nummernkreise (key, prefix, next_number) + `next_document_number()` (Row-Lock)
- **document_types** — Konfigurator: base_type, Ordner, Nummernkreis-Key, `move_project_to_step_id`, Buchungslogik, `subject_prefix`, `layout`
- **document_folders**, **project_sources**, **document_texts** (Bausteine mit Platzhaltern),
  **email_templates**, **custom_field_defs**

## CRM (0001)
- **contacts** — Person/Firma, Kategorie (kunde/lieferant/partner/ansprechpartner), Kundennr., Adresse,
  `parent_contact_id` (Ansprechpartner→Firma), `custom_fields`

## Projekte / Pipelines (0001)
- **project_types** — Gewerke (Name, Code, is_standard, color)
- **project_steps** — Pipeline-Phasen je Gewerk (name, base_status, status_code, sort_order)
- **projects** — Gewerk, Kunde, Adresse, `current_step_id`, `assigned_to`, Wert, `custom_fields` + `next_project_number()`
- **activity_log** — Logbuch (entity_type/entity_id) für Projekte & Kontakte

## Katalog (0001)
- **sales_prices** — Verkaufspreis-Stufen (Aufschlag %), **articles** (EK/VK/MwSt/Bestand), **services** (Zeit/Preis)

## Dokumente (0001/0003) — kritischer Pfad
- **documents** — base_type, number (erst beim Abschließen), Kunde/Projekt, status, payment_status,
  Netto/MwSt/Brutto/Offen (per Trigger), Rabatt, `recipient_snapshot`/`company_snapshot`/`layout_snapshot`, `is_deleted`
- **document_items** — Positionen (kind artikel/leistung/titel/text, Menge, EP, Rabatt, MwSt, `line_net`)
- Trigger `set_item_line_net`, `recompute_document_totals`; RPC `save_document`, `finalize_document`

## Buchhaltung (0005)
- **payments** (+ Trigger `recompute_document_payment`), **receipts** (Belege), **cost_centers**,
  **dunning_levels**, **dunnings**

## Zeit / Personal (0005/0006)
- **wage_groups**, **time_categories**, **time_entries**, **absence_types**, **absences**

## Planung (0005)
- **appointment_categories**, **resources**, **appointments**

## Lager (0005)
- **stock_items**, **stock_movements** (+ Trigger `apply_stock_movement` verbucht Bestand)

## Service & Aufgaben (0005)
- **maintenance_contracts**, **orders** (Field Service), **tasks**, **task_templates**, **checklists**

## Standarddaten (0002/0006)
`bootstrap_company` (Nummernkreise, 17 Dokumenttypen, Ordner, 15 Quellen, 4 Gewerke-Pipelines,
VK1, Monteurstunde, Demo-Artikel, Demo-Kunde) + `seed_module_defaults` (Lohngruppen, Zeitkategorien,
Abwesenheitsarten, Terminkategorien, Mahnstufen) — via Trigger für neue Mandanten.
