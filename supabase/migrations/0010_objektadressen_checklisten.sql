-- ============================================================
-- 0010 Objektadressen (je Kontakt) + Projekt-Checklisten
-- ============================================================
create table if not exists public.object_addresses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  label text,
  street text, zip text, city text, country text default 'Österreich',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  items jsonb not null default '[]'::jsonb,   -- [{text, done}]
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['object_addresses','project_checklists'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_sel on public.%I;', t, t);
    execute format('drop policy if exists %I_mod on public.%I;', t, t);
    execute format('create policy %I_sel on public.%I for select using (company_id = public.current_company_id());', t, t);
    execute format('create policy %I_mod on public.%I for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());', t, t);
  end loop;
end $$;
