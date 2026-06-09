-- ============================================================
-- 0005 FOLGE-MODULE: Buchhaltung, Zeit/Personal, Planung,
-- Lager, Wartung, Aufträge, Aufgaben, Checklisten.
-- ============================================================

-- ---------- Buchhaltung ----------
create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, number text, color text default '#6b7280',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  amount numeric(14,2) not null default 0,
  paid_at date not null default current_date,
  method text default 'ueberweisung',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null default 'ausgabe',         -- einnahme | ausgabe
  receipt_number text,
  file_url text,
  project_id uuid references public.projects(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  category text,
  cost_center_id uuid references public.cost_centers(id) on delete set null,
  net_amount numeric(14,2) default 0,
  gross_amount numeric(14,2) default 0,
  open_amount numeric(14,2) default 0,
  doc_date date default current_date,
  due_date date,
  status text default 'offen',                    -- entwurf|offen|faellig|teilbezahlt|bezahlt
  value_date date,
  exported boolean default false,
  created_at timestamptz not null default now()
);

create table if not exists public.dunning_levels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  level int not null,
  name text not null,
  type text not null default 'zahlungserinnerung', -- zahlungserinnerung | mahnung
  interval_days int not null default 7,
  fee numeric(14,2) default 0,
  active boolean default false,
  sort_order int default 0
);

create table if not exists public.dunnings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  level int not null default 1,
  sent_at date default current_date,
  note text,
  created_at timestamptz not null default now()
);

-- Zahlungs-Trigger: open_amount + payment_status aus payments pflegen
create or replace function public.recompute_document_payment(p_doc uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_paid numeric(14,2); v_gross numeric(14,2);
begin
  select coalesce(sum(amount),0) into v_paid from public.payments where document_id = p_doc;
  select gross_amount into v_gross from public.documents where id = p_doc;
  update public.documents set
    open_amount = round(coalesce(v_gross,0) - v_paid, 2),
    payment_status = case
      when v_paid <= 0 then 'offen'
      when v_paid >= coalesce(v_gross,0) then 'bezahlt'
      else 'teilzahlung' end
  where id = p_doc;
end $$;

create or replace function public.trg_payment_recompute()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_document_payment(coalesce(new.document_id, old.document_id));
  return null;
end $$;
drop trigger if exists trg_payments_recompute on public.payments;
create trigger trg_payments_recompute after insert or update or delete on public.payments
  for each row execute function public.trg_payment_recompute();

-- ---------- Zeit / Personal ----------
create table if not exists public.wage_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  self_cost numeric(14,2) default 0,
  total_cost numeric(14,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.time_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  work_relevant boolean default true,
  active boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  category_id uuid references public.time_categories(id) on delete set null,
  entry_date date not null default current_date,
  start_time text,
  end_time text,
  duration_minutes int default 0,
  break_minutes int default 0,
  status text default 'eingereicht',  -- vorlaeufig|eingereicht|bestaetigt|geloescht
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.absence_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, paid boolean default true
);

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid references public.profiles(id) on delete set null,
  type text,
  start_date date not null,
  end_date date not null,
  days numeric(6,1) default 1,
  status text default 'eingereicht',  -- eingereicht|genehmigt|abgelehnt
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Planung ----------
create table if not exists public.appointment_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, color text default '#3b82f6'
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text default 'mitarbeiter',  -- mitarbeiter|fahrzeug|allgemein
  profile_id uuid references public.profiles(id) on delete set null
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  category_id uuid references public.appointment_categories(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  all_day boolean default false,
  assigned_to uuid references public.profiles(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  note text,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Lager ----------
create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  stock_number text,
  category text,
  stock numeric(14,3) default 0,
  planned_stock numeric(14,3) default 0,
  article_id uuid references public.articles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  stock_item_id uuid not null references public.stock_items(id) on delete cascade,
  type text not null,                 -- einbuchung|ausbuchung
  quantity numeric(14,3) not null default 0,
  old_stock numeric(14,3) default 0,
  new_stock numeric(14,3) default 0,
  project_id uuid references public.projects(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  booking_number text,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Lagerbewegung verbucht Bestand automatisch
create or replace function public.apply_stock_movement()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_old numeric(14,3);
begin
  select stock into v_old from public.stock_items where id = new.stock_item_id;
  new.old_stock := coalesce(v_old,0);
  new.new_stock := coalesce(v_old,0) + (case when new.type = 'ausbuchung' then -new.quantity else new.quantity end);
  update public.stock_items set stock = new.new_stock where id = new.stock_item_id;
  return new;
end $$;
drop trigger if exists trg_stock_movement on public.stock_movements;
create trigger trg_stock_movement before insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- ---------- Wartungsverträge ----------
create table if not exists public.maintenance_contracts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.contacts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  start_date date,
  last_appointment date,
  due_date date,
  runtime_value int, runtime_unit text default 'jahre',
  interval_value int, interval_unit text default 'jahre',
  reminder text,
  assigned_to uuid references public.profiles(id) on delete set null,
  status text default 'aktiv',
  created_at timestamptz not null default now()
);

-- ---------- Aufträge (Field Service) ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  order_number text,
  title text not null,
  type text default 'sonstiges',     -- wartung|reparatur|notdienst|reklamation|sonstiges
  status text default 'offen',        -- offen|zugewiesen|erledigt|rechnung|abgeschlossen|archiviert
  customer_id uuid references public.contacts(id) on delete set null,
  contact_person_id uuid references public.contacts(id) on delete set null,
  address text,
  description text,
  start_at timestamptz, end_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ---------- Aufgaben ----------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references public.profiles(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  due_date date,
  done_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null, description text,
  created_at timestamptz not null default now()
);

-- ---------- Checklisten (Admin) ----------
create table if not exists public.checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- Hilfsnummern (race-frei genug für Sekundärbelege) ----------
create or replace function public.next_prefixed_number(p_company uuid, p_table text, p_col text, p_prefix text, p_start int default 1)
returns text language plpgsql security definer set search_path = public as $$
declare v int;
begin
  execute format('select coalesce(max(nullif(regexp_replace(%I, ''[^0-9]'', '''', ''g''),'''')::int), %s-1)+1 from public.%I where company_id = $1', p_col, p_start, p_table)
    into v using p_company;
  return p_prefix || lpad(v::text, 4, '0');
end $$;

-- ---------- RLS für alle neuen Tabellen ----------
do $$
declare t text;
begin
  foreach t in array array[
    'cost_centers','payments','receipts','dunning_levels','dunnings',
    'wage_groups','time_categories','time_entries','absence_types','absences',
    'appointment_categories','resources','appointments',
    'stock_items','stock_movements','maintenance_contracts','orders',
    'tasks','task_templates','checklists'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_sel on public.%I;', t, t);
    execute format('drop policy if exists %I_mod on public.%I;', t, t);
    execute format('create policy %I_sel on public.%I for select using (company_id = public.current_company_id());', t, t);
    execute format('create policy %I_mod on public.%I for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());', t, t);
  end loop;
end $$;

grant execute on function public.next_prefixed_number(uuid,text,text,text,int) to authenticated;
grant execute on function public.recompute_document_payment(uuid) to authenticated;
