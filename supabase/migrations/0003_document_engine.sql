-- ============================================================
-- 0003 DOKUMENT-ENGINE
-- Summen per DB-Trigger (Source of Truth), atomares save_document,
-- finalize_document (race-freie Nummer erst beim Abschließen +
-- Empfänger-/Firmen-/Layout-Snapshot + Pipeline-Automatik), Soft-Delete.
-- ============================================================

alter table public.documents
  add column if not exists recipient_snapshot jsonb,
  add column if not exists company_snapshot jsonb,
  add column if not exists layout_snapshot jsonb,
  add column if not exists is_deleted boolean not null default false;

-- eindeutige Dokumentnummer je Mandant (nur wenn vergeben)
create unique index if not exists uq_documents_company_number
  on public.documents(company_id, number) where number is not null;

-- ---------- Positions-Netto vor Insert/Update setzen ----------
create or replace function public.set_item_line_net()
returns trigger language plpgsql as $$
begin
  if new.kind in ('artikel','leistung') then
    new.line_net := round(coalesce(new.quantity,0) * coalesce(new.unit_price,0)
                          * (1 - coalesce(new.discount_percent,0)/100.0), 2);
  else
    new.line_net := 0;
  end if;
  return new;
end $$;

drop trigger if exists trg_item_line_net on public.document_items;
create trigger trg_item_line_net
  before insert or update on public.document_items
  for each row execute function public.set_item_line_net();

-- ---------- Dokumentsummen neu berechnen ----------
create or replace function public.recompute_document_totals(p_doc uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_positions_net numeric(14,2) := 0;
  v_disc_pct numeric(7,2) := 0;
  v_disc_amt numeric(14,2) := 0;
  v_doc_discount numeric(14,2) := 0;
  v_factor numeric := 1;
  v_vat numeric(14,2) := 0;
  v_net numeric(14,2) := 0;
  v_paid numeric(14,2) := 0;
  r record;
begin
  select coalesce(discount_percent,0), coalesce(discount_amount,0)
    into v_disc_pct, v_disc_amt
  from public.documents where id = p_doc;

  select coalesce(sum(line_net),0) into v_positions_net
  from public.document_items
  where document_id = p_doc and kind in ('artikel','leistung');

  v_doc_discount := round(v_positions_net * v_disc_pct/100.0, 2) + v_disc_amt;
  if v_doc_discount < 0 then v_doc_discount := 0; end if;
  v_net := round(v_positions_net - v_doc_discount, 2);

  if v_positions_net > 0 then
    v_factor := (v_positions_net - v_doc_discount) / v_positions_net;
  end if;

  -- MwSt je Steuersatz (echte Mischsätze)
  for r in
    select vat_rate, sum(line_net) as rate_net
    from public.document_items
    where document_id = p_doc and kind in ('artikel','leistung')
    group by vat_rate
  loop
    v_vat := v_vat + round(r.rate_net * v_factor * coalesce(r.vat_rate,0)/100.0, 2);
  end loop;

  update public.documents
     set net_amount = v_net,
         vat_amount = v_vat,
         gross_amount = round(v_net + v_vat, 2),
         open_amount = case when payment_status = 'bezahlt' then 0
                            else round(v_net + v_vat, 2) end,
         updated_at = now()
   where id = p_doc;
end $$;

create or replace function public.trg_recompute_from_items()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.recompute_document_totals(coalesce(new.document_id, old.document_id));
  return null;
end $$;

drop trigger if exists trg_items_recompute on public.document_items;
create trigger trg_items_recompute
  after insert or update or delete on public.document_items
  for each row execute function public.trg_recompute_from_items();

-- ---------- Atomares Speichern (Header + Positionen in 1 Transaktion) ----------
create or replace function public.save_document(payload jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company_id();
  v_id uuid := nullif(payload->>'id','')::uuid;
  v_item jsonb;
  v_pos int := 0;
begin
  if v_company is null then raise exception 'Kein Mandant'; end if;

  if v_id is null then
    insert into public.documents (company_id, base_type, doc_type_id, customer_id, contact_person_id,
        project_id, folder_id, subject, name, doc_date, due_date, service_date,
        intro_text, outro_text, discount_percent, discount_amount, reverse_charge, created_by)
    values (v_company,
        coalesce(payload->>'base_type','angebot'),
        nullif(payload->>'doc_type_id','')::uuid,
        nullif(payload->>'customer_id','')::uuid,
        nullif(payload->>'contact_person_id','')::uuid,
        nullif(payload->>'project_id','')::uuid,
        nullif(payload->>'folder_id','')::uuid,
        payload->>'subject', payload->>'name',
        coalesce(nullif(payload->>'doc_date','')::date, current_date),
        nullif(payload->>'due_date','')::date,
        nullif(payload->>'service_date','')::date,
        payload->>'intro_text', payload->>'outro_text',
        coalesce(nullif(payload->>'discount_percent','')::numeric,0),
        coalesce(nullif(payload->>'discount_amount','')::numeric,0),
        coalesce((payload->>'reverse_charge')::boolean,false),
        auth.uid())
    returning id into v_id;
  else
    update public.documents set
        base_type = coalesce(payload->>'base_type', base_type),
        doc_type_id = nullif(payload->>'doc_type_id','')::uuid,
        customer_id = nullif(payload->>'customer_id','')::uuid,
        contact_person_id = nullif(payload->>'contact_person_id','')::uuid,
        project_id = nullif(payload->>'project_id','')::uuid,
        folder_id = nullif(payload->>'folder_id','')::uuid,
        subject = payload->>'subject',
        name = payload->>'name',
        doc_date = coalesce(nullif(payload->>'doc_date','')::date, doc_date),
        due_date = nullif(payload->>'due_date','')::date,
        service_date = nullif(payload->>'service_date','')::date,
        intro_text = payload->>'intro_text',
        outro_text = payload->>'outro_text',
        discount_percent = coalesce(nullif(payload->>'discount_percent','')::numeric,0),
        discount_amount = coalesce(nullif(payload->>'discount_amount','')::numeric,0),
        reverse_charge = coalesce((payload->>'reverse_charge')::boolean,false),
        updated_at = now()
    where id = v_id and company_id = v_company;
    if not found then raise exception 'Dokument nicht gefunden'; end if;
  end if;

  -- Positionen ersetzen
  delete from public.document_items where document_id = v_id;
  for v_item in select * from jsonb_array_elements(coalesce(payload->'items','[]'::jsonb))
  loop
    v_pos := v_pos + 1;
    insert into public.document_items (company_id, document_id, kind, article_id, service_id,
        position, name, description, quantity, unit, unit_price, purchase_price,
        markup_percent, discount_percent, vat_rate, time_minutes, sort_order)
    values (v_company, v_id,
        coalesce(v_item->>'kind','artikel')::item_kind,
        nullif(v_item->>'article_id','')::uuid,
        nullif(v_item->>'service_id','')::uuid,
        v_pos,
        v_item->>'name', v_item->>'description',
        coalesce(nullif(v_item->>'quantity','')::numeric,1),
        v_item->>'unit',
        coalesce(nullif(v_item->>'unit_price','')::numeric,0),
        coalesce(nullif(v_item->>'purchase_price','')::numeric,0),
        coalesce(nullif(v_item->>'markup_percent','')::numeric,0),
        coalesce(nullif(v_item->>'discount_percent','')::numeric,0),
        coalesce(nullif(v_item->>'vat_rate','')::numeric,20),
        coalesce(nullif(v_item->>'time_minutes','')::int,0),
        v_pos);
  end loop;

  perform public.recompute_document_totals(v_id);
  return v_id;
end $$;

-- ---------- Dokument abschließen (Nummer vergeben, Snapshots, Pipeline) ----------
create or replace function public.finalize_document(p_doc uuid)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_company uuid := public.current_company_id();
  v_doc public.documents%rowtype;
  v_key text;
  v_number text;
  v_move_step uuid;
  v_recipient jsonb;
  v_company_row public.companies%rowtype;
begin
  select * into v_doc from public.documents where id = p_doc and company_id = v_company;
  if not found then raise exception 'Dokument nicht gefunden'; end if;

  -- Nummer nur einmal vergeben
  if v_doc.number is null then
    select coalesce(number_range_key, case when v_doc.base_type='rechnung_13b' then 'rechnung' else v_doc.base_type end)
      into v_key
    from public.document_types where id = v_doc.doc_type_id;
    if v_key is null then
      v_key := case when v_doc.base_type='rechnung_13b' then 'rechnung' else v_doc.base_type end;
    end if;
    v_number := public.next_document_number(v_company, v_key);
  else
    v_number := v_doc.number;
  end if;

  -- Empfänger-Snapshot
  select to_jsonb(c) into v_recipient from public.contacts c where c.id = v_doc.customer_id;
  select * into v_company_row from public.companies where id = v_company;

  update public.documents set
      number = v_number,
      status = 'erstellt',
      finalized_at = coalesce(finalized_at, now()),
      due_date = case when base_type in ('rechnung','rechnung_13b') and due_date is null
                      then doc_date + 14 else due_date end,
      recipient_snapshot = coalesce(recipient_snapshot, v_recipient),
      company_snapshot = coalesce(company_snapshot, to_jsonb(v_company_row)),
      layout_snapshot = coalesce(layout_snapshot, layout)
  where id = p_doc;

  -- Pipeline-Automatik: Projekt in konfigurierte Phase verschieben
  if v_doc.project_id is not null then
    select move_project_to_step_id into v_move_step
    from public.document_types where id = v_doc.doc_type_id;
    if v_move_step is not null then
      update public.projects set current_step_id = v_move_step where id = v_doc.project_id;
    end if;
  end if;

  -- Logbuch
  insert into public.activity_log (company_id, entity_type, entity_id, user_id, type, title, message)
  values (v_company, 'document', p_doc, auth.uid(), 'dokument',
          'Dokument abgeschlossen', v_doc.base_type || ' ' || v_number || ' wurde abgeschlossen');
  if v_doc.project_id is not null then
    insert into public.activity_log (company_id, entity_type, entity_id, user_id, type, title, message)
    values (v_company, 'project', v_doc.project_id, auth.uid(), 'dokument',
            'Dokument erstellt', v_doc.base_type || ' ' || v_number || ' erstellt');
  end if;

  return v_number;
end $$;

grant execute on function public.save_document(jsonb) to authenticated;
grant execute on function public.finalize_document(uuid) to authenticated;
grant execute on function public.recompute_document_totals(uuid) to authenticated;
