-- ============================================================
-- 0006 Standarddaten der Folge-Module je Mandant.
-- Trigger seedet neue Mandanten; Backfill für bestehende.
-- ============================================================

create or replace function public.seed_module_defaults(p_company uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.wage_groups where company_id = p_company) then
    insert into public.wage_groups (company_id, name, self_cost, total_cost) values
      (p_company,'Meister',25,50),(p_company,'Monteur',20,35);
  end if;

  if not exists (select 1 from public.time_categories where company_id = p_company) then
    insert into public.time_categories (company_id, name, work_relevant) values
      (p_company,'Aufgabe',true),(p_company,'Büroarbeit',true),(p_company,'Fahrzeit',true),
      (p_company,'Pause',false),(p_company,'Projektierung',true),(p_company,'Sonstige',true),
      (p_company,'Umsetzung',true),(p_company,'Vor-Ort-Termin',true);
  end if;

  if not exists (select 1 from public.absence_types where company_id = p_company) then
    insert into public.absence_types (company_id, name, paid) values
      (p_company,'Urlaub',true),(p_company,'Krankheit',true),(p_company,'Sonderurlaub (bezahlt)',true),
      (p_company,'Unbezahlter Urlaub',false),(p_company,'Überstundenausgleich',true),(p_company,'Elternzeit',false);
  end if;

  if not exists (select 1 from public.appointment_categories where company_id = p_company) then
    insert into public.appointment_categories (company_id, name, color) values
      (p_company,'Umsetzung','#22c55e'),(p_company,'Besprechung','#3b82f6'),(p_company,'Büro','#6b7280'),
      (p_company,'Vor-Ort-Termin','#f59e0b'),(p_company,'Schlechtwetter','#ef4444');
  end if;

  if not exists (select 1 from public.dunning_levels where company_id = p_company) then
    insert into public.dunning_levels (company_id, level, name, type, interval_days, sort_order) values
      (p_company,1,'1. Zahlungserinnerung','zahlungserinnerung',4,1),
      (p_company,2,'2. Zahlungserinnerung','zahlungserinnerung',4,2),
      (p_company,3,'3. Zahlungserinnerung','zahlungserinnerung',4,3),
      (p_company,1,'1. Mahnung','mahnung',14,4),
      (p_company,2,'2. Mahnung','mahnung',14,5),
      (p_company,3,'3. Mahnung','mahnung',14,6);
  end if;

  -- Standard-Ressourcen aus aktiven Mitarbeitern
  if not exists (select 1 from public.resources where company_id = p_company) then
    insert into public.resources (company_id, name, type, profile_id)
    select p_company, trim(coalesce(first_name,'')||' '||coalesce(last_name,'')), 'mitarbeiter', id
    from public.profiles where company_id = p_company and is_active;
  end if;
end $$;

-- Trigger: neue Mandanten automatisch seeden
create or replace function public.trg_seed_company()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.seed_module_defaults(new.id);
  return new;
end $$;
drop trigger if exists trg_company_seed on public.companies;
create trigger trg_company_seed after insert on public.companies
  for each row execute function public.trg_seed_company();

-- Backfill bestehende Mandanten
do $$
declare c uuid;
begin
  for c in select id from public.companies loop
    perform public.seed_module_defaults(c);
  end loop;
end $$;

grant execute on function public.seed_module_defaults(uuid) to authenticated;
