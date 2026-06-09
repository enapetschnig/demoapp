-- ============================================================
-- 0001 FOUNDATION + KRITISCHER PFAD
-- Multi-Tenancy, RLS, atomare Nummernkreise, Konfiguration,
-- CRM, Projekte/Pipelines, Artikel/Leistungen, Dokumente.
-- Geldbeträge numeric(14,2), Mengen numeric(14,3), Default-MwSt 20% (AT).
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMs ----------
do $$ begin
  create type user_type as enum ('standard','app');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('geschaeftsfuehrer','niederlassungsleiter','buchhaltung','vertriebler','monteur');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_type as enum ('person','firma');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_category as enum ('kunde','lieferant','partner','ansprechpartner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type item_kind as enum ('artikel','leistung','titel','text');
exception when duplicate_object then null; end $$;

do $$ begin
  create type document_status as enum
    ('entwurf','import_erforderlich','in_bearbeitung','erstellt','versendet','erneut_versendet','angenommen','abgelehnt','storniert','geloescht');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('offen','teilzahlung','bezahlt','ueberfaellig','storniert');
exception when duplicate_object then null; end $$;

-- ---------- COMPANIES (Mandant) ----------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mein Betrieb',
  legal_form text,
  address_street text,
  address_zip text,
  address_city text,
  country text default 'Österreich',
  phone text,
  mobile text,
  fax text,
  founding_year text,
  account_holder text,
  bank text,
  iban text,
  bic text,
  tax_number text,
  commercial_register text,
  vat_id text,
  logo_url text,
  primary_color text default '#71c837',
  default_vat_rate numeric(5,2) not null default 20.00,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- BRANCHES (Niederlassungen) ----------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  address_street text,
  address_zip text,
  address_city text,
  radius_km integer default 0,
  created_at timestamptz not null default now()
);

-- ---------- PROFILES (Mitarbeiter / verknüpft mit auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  role app_role not null default 'geschaeftsfuehrer',
  user_kind user_type not null default 'standard',
  position text,
  avatar_url text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- RLS HELPER ----------
create or replace function public.current_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- new auth user -> empty profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'first_name',''),
          coalesce(new.raw_user_meta_data->>'last_name',''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- NUMBER RANGES (Nummernkreise) + atomare Vergabe ----------
create table if not exists public.number_ranges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  key text not null,            -- z.B. 'angebot','rechnung'
  name text not null,
  prefix text not null,         -- z.B. 'ANG-','RE-'
  start_number integer not null default 1,
  next_number integer not null default 1,
  unique (company_id, key)
);

-- atomare, race-freie Nummernvergabe (Row-Lock via UPDATE ... RETURNING)
create or replace function public.next_document_number(p_company uuid, p_key text)
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text; v_num integer;
begin
  update public.number_ranges
     set next_number = next_number + 1
   where company_id = p_company and key = p_key
  returning prefix, next_number - 1 into v_prefix, v_num;
  if v_prefix is null then
    raise exception 'Kein Nummernkreis für % gefunden', p_key;
  end if;
  return v_prefix || lpad(v_num::text, 4, '0');
end $$;

-- ---------- DOCUMENT FOLDERS / TYPES / TEXTS / SOURCES / TEMPLATES / CUSTOM FIELDS ----------
create table if not exists public.document_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.document_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  base_type text not null,             -- angebot, rechnung, auftragsbestaetigung, ...
  name text not null,
  status text not null default 'aktiv',
  default_folder_id uuid references public.document_folders(id) on delete set null,
  number_range_key text,
  move_project_to_step_id uuid,        -- Workflow-Automatik
  booking_relevant boolean not null default false,
  booking_category text default 'standard',
  subject_prefix text,
  layout jsonb not null default '{}'::jsonb,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.document_texts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kind text not null default 'text',   -- 'text' | 'titel'
  source text not null default 'eigene', -- 'system' | 'eigene'
  title text not null,
  content text,
  base_type text,                       -- angebot, rechnung, mahnung, ...
  placement text,                       -- 'einleitung' | 'abschluss'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  context text,                          -- kunde | dokument-angebot | dokument-rechnung ...
  subject text,
  body text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.custom_field_defs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity text not null default 'project', -- project | contact | document
  field_type text not null default 'text', -- text | checkbox | select | url
  name text not null,
  suffix text,
  hint text,
  options jsonb default '[]'::jsonb,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

-- ---------- CONTACTS (CRM) ----------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type contact_type not null default 'person',
  category contact_category not null default 'kunde',
  customer_number text,
  company_name text,
  salutation text,
  first_name text,
  last_name text,
  email text,
  phone text,
  mobile text,
  address_street text,
  address_zip text,
  address_city text,
  country text default 'Österreich',
  notes text,
  parent_contact_id uuid references public.contacts(id) on delete set null,
  is_archived boolean not null default false,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_contacts_company on public.contacts(company_id);

-- ---------- PROJECT TYPES (Gewerke/Pipelines) + STEPS ----------
create table if not exists public.project_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text,                       -- Kürzel UNB/EINS/PV
  is_default boolean not null default false,
  is_standard boolean not null default false,
  status text not null default 'aktiv',
  color text default '#6b7280',
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.project_steps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_type_id uuid not null references public.project_types(id) on delete cascade,
  name text not null,
  base_status text not null,       -- interner Standard-Status
  status_code integer not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- PROJECTS ----------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_type_id uuid references public.project_types(id) on delete set null,
  project_number integer not null,
  customer_id uuid references public.contacts(id) on delete set null,
  contact_person_id uuid references public.contacts(id) on delete set null,
  name text,
  address_street text,
  address_zip text,
  address_city text,
  reachability text,
  source_id uuid references public.project_sources(id) on delete set null,
  current_step_id uuid references public.project_steps(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  reminder_at timestamptz,
  value numeric(14,2) default 0,
  priority integer default 0,
  is_archived boolean not null default false,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_projects_company on public.projects(company_id);
create index if not exists idx_projects_step on public.projects(current_step_id);

-- fortlaufende Projektnummer je Mandant
create or replace function public.next_project_number(p_company uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare v integer;
begin
  select coalesce(max(project_number),99)+1 into v from public.projects where company_id = p_company;
  return v;
end $$;

-- ---------- ACTIVITY LOG (Logbuch für Projekte/Kontakte) ----------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entity_type text not null,       -- project | contact | document
  entity_id uuid not null,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default 'kommentar', -- system | kommentar | status | dokument | ...
  title text,
  message text,
  created_at timestamptz not null default now()
);
create index if not exists idx_activity_entity on public.activity_log(entity_type, entity_id);

-- ---------- CATALOG: SALES PRICES / ARTICLES / SERVICES ----------
create table if not exists public.sales_prices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,              -- VK1
  is_standard boolean not null default false,
  markup_percent numeric(7,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  article_number text,
  name text not null,
  category text,
  description text,
  unit text default 'Stk',
  ean text,
  matchcode text,
  supplier text,
  supplier_number text,
  manufacturer text,
  purchase_price numeric(14,2) default 0,
  list_price numeric(14,2) default 0,
  sale_price numeric(14,2) default 0,
  vat_rate numeric(5,2) default 20.00,
  image_url text,
  stock numeric(14,3) default 0,
  used_count integer default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_articles_company on public.articles(company_id);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  service_number text,
  name text not null,
  description text,
  internal_name text,
  time_minutes integer default 60,
  unit text default 'Std',
  price numeric(14,2) default 0,
  vat_rate numeric(5,2) default 20.00,
  manufacturer text,
  ean text,
  created_at timestamptz not null default now()
);

-- ---------- DOCUMENTS + ITEMS (Angebote/Rechnungen/...) ----------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  doc_type_id uuid references public.document_types(id) on delete set null,
  base_type text not null default 'angebot',
  number text,                     -- erst beim Abschließen vergeben
  name text,
  customer_id uuid references public.contacts(id) on delete set null,
  contact_person_id uuid references public.contacts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  folder_id uuid references public.document_folders(id) on delete set null,
  status document_status not null default 'entwurf',
  payment_status payment_status not null default 'offen',
  doc_date date not null default current_date,
  due_date date,
  service_date date,
  subject text,
  intro_text text,
  outro_text text,
  net_amount numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  gross_amount numeric(14,2) not null default 0,
  open_amount numeric(14,2) not null default 0,
  discount_percent numeric(7,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  reference_document_id uuid references public.documents(id) on delete set null,
  reverse_charge boolean not null default false,
  layout jsonb not null default '{}'::jsonb,
  pdf_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalized_at timestamptz,
  sent_at timestamptz
);
create index if not exists idx_documents_company on public.documents(company_id);
create index if not exists idx_documents_project on public.documents(project_id);
create index if not exists idx_documents_customer on public.documents(customer_id);

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  kind item_kind not null default 'artikel',
  article_id uuid references public.articles(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  position integer,
  name text,
  description text,
  quantity numeric(14,3) default 1,
  unit text,
  unit_price numeric(14,2) default 0,
  purchase_price numeric(14,2) default 0,
  markup_percent numeric(7,2) default 0,
  discount_percent numeric(7,2) default 0,
  vat_rate numeric(5,2) default 20.00,
  line_net numeric(14,2) default 0,
  time_minutes integer default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_docitems_doc on public.document_items(document_id);

-- ---------- RLS: enable + policies (alle mandantengebunden) ----------
do $$
declare t text;
begin
  foreach t in array array[
    'branches','profiles','number_ranges','document_folders','document_types',
    'document_texts','project_sources','email_templates','custom_field_defs',
    'contacts','project_types','project_steps','projects','activity_log',
    'sales_prices','articles','services','documents','document_items'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_sel on public.%I;', t, t);
    execute format('drop policy if exists %I_mod on public.%I;', t, t);
    execute format('create policy %I_sel on public.%I for select using (company_id = public.current_company_id());', t, t);
    execute format('create policy %I_mod on public.%I for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());', t, t);
  end loop;
end $$;

-- companies: nur eigene
alter table public.companies enable row level security;
drop policy if exists companies_sel on public.companies;
drop policy if exists companies_upd on public.companies;
create policy companies_sel on public.companies for select using (id = public.current_company_id());
create policy companies_upd on public.companies for update using (id = public.current_company_id());

-- profiles: zusätzlich eigenes Profil immer lesbar (vor company-Zuordnung)
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (id = auth.uid());
drop policy if exists profiles_self_upd on public.profiles;
create policy profiles_self_upd on public.profiles for update using (id = auth.uid());
