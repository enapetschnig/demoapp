-- ============================================================
-- 0009 Dokumentvorlagen (wiederverwendbare Angebots-/Rechnungs-Sets)
-- ============================================================
create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  base_type text not null default 'angebot',
  intro_text text,
  outro_text text,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.document_templates enable row level security;
drop policy if exists document_templates_sel on public.document_templates;
drop policy if exists document_templates_mod on public.document_templates;
create policy document_templates_sel on public.document_templates for select using (company_id = public.current_company_id());
create policy document_templates_mod on public.document_templates for all using (company_id = public.current_company_id()) with check (company_id = public.current_company_id());
